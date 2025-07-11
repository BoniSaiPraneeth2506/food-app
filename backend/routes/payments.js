import express from 'express';
import Stripe from 'stripe';
import { body, validationResult } from 'express-validator';
import Order from '../models/Order.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @route   POST /api/payments/create-payment-intent
// @desc    Create payment intent for order
// @access  Private
router.post('/create-payment-intent', auth, [
  body('orderId').isMongoId().withMessage('Invalid order ID')
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

    const { orderId } = req.body;

    // Find the order
    const order = await Order.findOne({
      _id: orderId,
      user: req.user.userId
    }).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency: 'usd',
      customer_email: order.user.email,
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        userId: order.user._id.toString()
      },
      description: `FoodieHub Order ${order.orderNumber}`
    });

    // Update order with payment intent ID
    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating payment intent'
    });
  }
});

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment and update order status
// @access  Private
router.post('/confirm-payment', auth, [
  body('paymentIntentId').notEmpty().withMessage('Payment intent ID is required')
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

    const { paymentIntentId } = req.body;
    const io = req.app.get('io');

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Find and update order
    const order = await Order.findOne({
      stripePaymentIntentId: paymentIntentId,
      user: req.user.userId
    }).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update payment status
    order.paymentStatus = 'paid';
    order.paymentMethod = 'stripe';
    await order.updateStatus('confirmed', null, 'Payment confirmed');

    // Emit real-time notification
    io.to(`user-${req.user.userId}`).emit('paymentConfirmed', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status
    });

    res.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: order
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while confirming payment'
    });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public (Stripe webhook)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;
    
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handlePaymentFailure(failedPayment);
      break;
    
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Helper function to handle successful payment
async function handlePaymentSuccess(paymentIntent) {
  try {
    const order = await Order.findOne({
      stripePaymentIntentId: paymentIntent.id
    }).populate('user', 'name email');

    if (order && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      await order.updateStatus('confirmed', null, 'Payment confirmed via webhook');
      
      console.log(`Payment confirmed for order ${order.orderNumber}`);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Helper function to handle failed payment
async function handlePaymentFailure(paymentIntent) {
  try {
    const order = await Order.findOne({
      stripePaymentIntentId: paymentIntent.id
    });

    if (order) {
      order.paymentStatus = 'failed';
      await order.save();
      
      console.log(`Payment failed for order ${order.orderNumber}`);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// @route   GET /api/payments/config
// @desc    Get Stripe publishable key
// @access  Public
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    }
  });
});

export default router;