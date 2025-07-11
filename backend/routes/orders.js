import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import { auth, adminAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.menuItem').isMongoId().withMessage('Invalid menu item ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('specialInstructions').optional().trim().isLength({ max: 500 }).withMessage('Special instructions cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { items, specialInstructions } = req.body;
    const io = req.app.get('io');

    // Validate menu items and check stock
    const menuItemIds = items.map(item => item.menuItem);
    const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } });

    if (menuItems.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more menu items not found'
      });
    }

    // Check stock availability and calculate totals
    let subtotal = 0;
    const orderItems = [];
    const stockUpdates = [];

    for (const orderItem of items) {
      const menuItem = menuItems.find(item => item._id.toString() === orderItem.menuItem);
      
      if (!menuItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} is currently unavailable`
        });
      }

      if (menuItem.stock < orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${menuItem.name}. Available: ${menuItem.stock}`
        });
      }

      const itemSubtotal = menuItem.price * orderItem.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: orderItem.quantity,
        subtotal: itemSubtotal
      });

      stockUpdates.push({
        id: menuItem._id,
        newStock: menuItem.stock - orderItem.quantity
      });
    }

    // Calculate tax and total (assuming 8% tax)
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    // Calculate estimated prep time (max prep time + 5 minutes buffer)
    const maxPrepTime = Math.max(...menuItems.map(item => item.prepTime));
    const estimatedPrepTime = maxPrepTime + 5;

    // Create order
    const order = new Order({
      user: req.user.userId,
      items: orderItems,
      subtotal,
      tax,
      total,
      estimatedPrepTime,
      specialInstructions
    });

    await order.save();

    // Update stock for all items
    await Promise.all(stockUpdates.map(update => 
      MenuItem.findByIdAndUpdate(update.id, { 
        stock: update.newStock,
        isAvailable: update.newStock > 0 
      })
    ));

    // Populate order details
    await order.populate('user', 'name email phone');
    await order.populate('items.menuItem', 'name image category');

    // Emit real-time notification to user
    io.to(`user-${req.user.userId}`).emit('orderPlaced', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      estimatedPrepTime: order.estimatedPrepTime
    });

    // Emit to admin/staff for new order notification
    io.emit('newOrder', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerName: order.user.name,
      total: order.total,
      itemCount: order.items.length
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating order'
    });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders or all orders (admin)
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']).withMessage('Invalid status')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter - regular users see only their orders
    const filter = req.user.role === 'admin' || req.user.role === 'staff' 
      ? {} 
      : { user: req.user.userId };
    
    if (status) {
      filter.status = status;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name email phone')
        .populate('items.menuItem', 'name image category')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const filter = { _id: req.params.id };
    
    // Regular users can only see their own orders
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      filter.user = req.user.userId;
    }

    const order = await Order.findOne(filter)
      .populate('user', 'name email phone')
      .populate('items.menuItem', 'name image category')
      .populate('statusHistory.updatedBy', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Admin/Staff only)
router.put('/:id/status', [auth, adminAuth], [
  body('status').isIn(['placed', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 200 }).withMessage('Notes cannot exceed 200 characters'),
  body('cancellationReason').optional().trim().isLength({ max: 200 }).withMessage('Cancellation reason cannot exceed 200 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, notes, cancellationReason } = req.body;
    const io = req.app.get('io');

    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate status transition
    const validTransitions = {
      'placed': ['confirmed', 'cancelled'],
      'confirmed': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['completed'],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`
      });
    }

    // Add cancellation reason if cancelling
    if (status === 'cancelled' && cancellationReason) {
      order.cancellationReason = cancellationReason;
    }

    // Update order status
    await order.updateStatus(status, req.user.userId, notes);

    // Emit real-time notification to user
    io.to(`user-${order.user._id}`).emit('orderStatusUpdate', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      message: getStatusMessage(status)
    });

    // Emit to admin/staff
    io.emit('orderStatusChanged', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      updatedBy: req.user.name
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
});

// @route   GET /api/orders/stats/summary
// @desc    Get order statistics
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const userId = req.user.role === 'admin' || req.user.role === 'staff' 
      ? null 
      : req.user.userId;

    const stats = await Order.getOrderStats(userId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order statistics'
    });
  }
});

// Helper function to get status message
function getStatusMessage(status) {
  const messages = {
    'placed': 'Your order has been placed successfully!',
    'confirmed': 'Your order has been confirmed and will be prepared soon.',
    'preparing': 'Your order is being prepared.',
    'ready': 'Your order is ready for pickup!',
    'completed': 'Your order has been completed. Thank you!',
    'cancelled': 'Your order has been cancelled.'
  };
  return messages[status] || 'Order status updated.';
}

export default router;