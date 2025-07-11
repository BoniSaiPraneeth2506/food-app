// Orders management
class OrdersManager {
    constructor() {
        this.orders = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.isLoading = false;
        this.statusFilter = '';
        
        this.initializeEventListeners();
    }

    async loadOrders(page = 1, append = false) {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            
            if (!append) {
                showLoading('Loading orders...');
            }
            
            const params = {
                page,
                limit: CONFIG.ORDERS_PER_PAGE,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            };
            
            if (this.statusFilter) {
                params.status = this.statusFilter;
            }
            
            const response = await window.api.getOrders(params);
            
            if (response.success) {
                const { orders, pagination } = response.data;
                
                if (append) {
                    this.orders = [...this.orders, ...orders];
                } else {
                    this.orders = orders;
                }
                
                this.currentPage = pagination.currentPage;
                this.totalPages = pagination.totalPages;
                
                this.renderOrders();
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
            showToast('Failed to load orders', 'error');
        } finally {
            this.isLoading = false;
            hideLoading();
        }
    }

    renderOrders() {
        const ordersContent = document.getElementById('ordersContent');
        
        if (this.orders.length === 0) {
            ordersContent.innerHTML = `
                <div class="orders-empty">
                    <i class="fas fa-clock"></i>
                    <p>No orders found</p>
                    <button class="browse-menu-btn" onclick="window.app.switchView('menu')">Order Now</button>
                </div>
            `;
            return;
        }
        
        const ordersList = this.orders.map(order => this.createOrderHTML(order)).join('');
        
        ordersContent.innerHTML = `
            <div class="orders-list">
                ${ordersList}
            </div>
        `;
    }

    createOrderHTML(order) {
        const statusIcon = CONFIG.ORDER_STATUS_ICONS[order.status] || 'fas fa-circle';
        const orderDate = new Date(order.createdAt).toLocaleString();
        const estimatedReady = order.estimatedPrepTime ? 
            new Date(new Date(order.createdAt).getTime() + order.estimatedPrepTime * 60000).toLocaleString() : 
            'N/A';
        
        return `
            <div class="order-item" data-id="${order._id}">
                <div class="order-header">
                    <h3 class="order-id">Order #${order.orderNumber}</h3>
                    <div class="order-status-price">
                        <span class="order-status ${order.status}">
                            <i class="${statusIcon}"></i>
                            ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <span class="order-total">$${order.total.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item-line">
                            <span class="order-item-name">${item.quantity}x ${item.name}</span>
                            <span class="order-item-price">$${item.subtotal.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-meta">
                    <p><i class="fas fa-calendar"></i> Ordered: ${orderDate}</p>
                    ${order.status === 'placed' || order.status === 'confirmed' || order.status === 'preparing' ? 
                        `<p><i class="fas fa-clock"></i> Estimated ready: ${estimatedReady}</p>` : ''
                    }
                    ${order.status === 'ready' ? 
                        '<p><i class="fas fa-bell"></i> Ready for pickup!</p>' : ''
                    }
                    ${order.status === 'completed' && order.completedAt ? 
                        `<p><i class="fas fa-check"></i> Completed: ${new Date(order.completedAt).toLocaleString()}</p>` : ''
                    }
                    ${order.specialInstructions ? 
                        `<p><i class="fas fa-comment"></i> Special instructions: ${order.specialInstructions}</p>` : ''
                    }
                </div>
            </div>
        `;
    }

    updateOrderStatus(orderId, newStatus) {
        const order = this.orders.find(o => o._id === orderId);
        if (order) {
            order.status = newStatus;
            this.renderOrders();
        }
    }

    addNewOrder(order) {
        this.orders.unshift(order);
        this.renderOrders();
    }

    async loadOrderStats() {
        try {
            const response = await window.api.getOrderStats();
            if (response.success) {
                this.updateProfileStats(response.data);
            }
        } catch (error) {
            console.error('Failed to load order stats:', error);
        }
    }

    updateProfileStats(stats) {
        const totalOrdersEl = document.getElementById('totalOrders');
        const totalSpentEl = document.getElementById('totalSpent');
        const completedOrdersEl = document.getElementById('completedOrders');
        
        if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders || 0;
        if (totalSpentEl) totalSpentEl.textContent = `$${(stats.totalRevenue || 0).toFixed(2)}`;
        if (completedOrdersEl) completedOrdersEl.textContent = stats.completedOrders || 0;
    }

    initializeEventListeners() {
        // Status filter
        document.getElementById('orderStatusFilter').addEventListener('change', (e) => {
            this.statusFilter = e.target.value;
            this.currentPage = 1;
            this.loadOrders();
        });
    }

    async initialize() {
        await this.loadOrders();
        await this.loadOrderStats();
    }
}

// Create global orders manager
window.ordersManager = new OrdersManager();