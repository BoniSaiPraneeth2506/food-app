// Cart management
class CartManager {
    constructor() {
        this.cart = [];
        this.loadCartFromStorage();
        this.initializeEventListeners();
    }

    loadCartFromStorage() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                this.cart = JSON.parse(savedCart);
                this.updateCartBadge();
            } catch (error) {
                console.error('Failed to load cart from storage:', error);
                this.cart = [];
            }
        }
    }

    saveCartToStorage() {
        localStorage.setItem('cart', JSON.stringify(this.cart));
    }

    addToCart(itemId, quantity = 1) {
        const menuItem = window.menuManager.getMenuItem(itemId);
        if (!menuItem || menuItem.stock === 0 || !menuItem.isAvailable) {
            showToast('Item is not available', 'error');
            return;
        }

        const existingItem = this.cart.find(item => item._id === itemId);
        
        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > menuItem.stock) {
                showToast(`Only ${menuItem.stock} items available`, 'warning');
                return;
            }
            existingItem.quantity = newQuantity;
        } else {
            if (quantity > menuItem.stock) {
                showToast(`Only ${menuItem.stock} items available`, 'warning');
                return;
            }
            this.cart.push({ ...menuItem, quantity });
        }

        this.saveCartToStorage();
        this.updateCartBadge();
        this.renderCart();
        
        showToast(`${menuItem.name} added to cart!`, 'success');
        
        // Add animation effect to button
        const button = window.event?.target;
        if (button) {
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = 'scale(1)';
            }, 150);
        }
    }

    removeFromCart(itemId) {
        const itemIndex = this.cart.findIndex(item => item._id === itemId);
        if (itemIndex > -1) {
            const item = this.cart[itemIndex];
            this.cart.splice(itemIndex, 1);
            this.saveCartToStorage();
            this.updateCartBadge();
            this.renderCart();
            showToast(`${item.name} removed from cart`, 'info');
        }
    }

    updateQuantity(itemId, newQuantity) {
        if (newQuantity === 0) {
            this.removeFromCart(itemId);
            return;
        }

        const item = this.cart.find(item => item._id === itemId);
        const menuItem = window.menuManager.getMenuItem(itemId);
        
        if (item && menuItem) {
            if (newQuantity > menuItem.stock) {
                showToast(`Only ${menuItem.stock} items available`, 'warning');
                return;
            }
            
            item.quantity = newQuantity;
            this.saveCartToStorage();
            this.updateCartBadge();
            this.renderCart();
        }
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    getTaxAmount() {
        return this.getCartTotal() * 0.08; // 8% tax
    }

    getFinalTotal() {
        return this.getCartTotal() + this.getTaxAmount();
    }

    updateCartBadge() {
        const count = this.getCartItemCount();
        const badges = document.querySelectorAll('#cartBadge, #cartBadgeMobile');
        
        badges.forEach(badge => {
            badge.textContent = count;
            if (count > 0) {
                badge.classList.add('show');
            } else {
                badge.classList.remove('show');
            }
        });
    }

    renderCart() {
        const cartContent = document.getElementById('cartContent');
        
        if (this.cart.length === 0) {
            cartContent.innerHTML = `
                <div class="cart-empty">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <button class="browse-menu-btn" onclick="window.app.switchView('menu')">Browse Menu</button>
                </div>
            `;
            return;
        }
        
        const cartItems = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-content">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3 class="cart-item-name">${item.name}</h3>
                        <p class="cart-item-description">${item.description}</p>
                        <p class="cart-item-price">$${item.price.toFixed(2)} each</p>
                    </div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="window.cartManager.updateQuantity('${item._id}', ${item.quantity - 1})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-display">${item.quantity}</span>
                        <button class="quantity-btn" onclick="window.cartManager.updateQuantity('${item._id}', ${item.quantity + 1})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="remove-item-btn" onclick="window.cartManager.removeFromCart('${item._id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        const cartSummary = `
            <div class="cart-summary">
                <div class="cart-summary-row">
                    <span>Subtotal:</span>
                    <span>$${this.getCartTotal().toFixed(2)}</span>
                </div>
                <div class="cart-summary-row">
                    <span>Tax (8%):</span>
                    <span>$${this.getTaxAmount().toFixed(2)}</span>
                </div>
                <div class="cart-summary-row total">
                    <span>Total:</span>
                    <span class="cart-total-amount">$${this.getFinalTotal().toFixed(2)}</span>
                </div>
                <button class="checkout-btn" onclick="window.cartManager.proceedToCheckout()">
                    Proceed to Checkout
                </button>
            </div>
        `;
        
        cartContent.innerHTML = `
            <div class="cart-items">
                ${cartItems}
            </div>
            ${cartSummary}
        `;
    }

    async proceedToCheckout() {
        if (this.cart.length === 0) {
            showToast('Your cart is empty', 'warning');
            return;
        }

        if (!window.authManager.isAuthenticated) {
            showToast('Please login to continue', 'warning');
            window.authManager.showAuthModal();
            return;
        }

        try {
            showLoading('Creating order...');

            // Prepare order data
            const orderData = {
                items: this.cart.map(item => ({
                    menuItem: item._id,
                    quantity: item.quantity
                })),
                specialInstructions: '' // Could add a field for this
            };

            // Create order
            const response = await window.api.createOrder(orderData);
            
            if (response.success) {
                const order = response.data;
                
                // Update menu item stocks
                this.cart.forEach(cartItem => {
                    const menuItem = window.menuManager.getMenuItem(cartItem._id);
                    if (menuItem) {
                        window.menuManager.updateMenuItemStock(cartItem._id, menuItem.stock - cartItem.quantity);
                    }
                });

                // Show payment modal
                window.paymentManager.showPaymentModal(order);
                
                showToast('Order created successfully!', 'success');
            }
        } catch (error) {
            console.error('Checkout failed:', error);
            showToast(error.message || 'Checkout failed', 'error');
        } finally {
            hideLoading();
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCartToStorage();
        this.updateCartBadge();
        this.renderCart();
    }

    initializeEventListeners() {
        // Cart view will be rendered when switching to cart view
    }
}

// Create global cart manager
window.cartManager = new CartManager();