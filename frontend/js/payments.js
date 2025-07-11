// Payment management with Stripe
class PaymentManager {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.cardElement = null;
        this.currentOrder = null;
        this.isProcessing = false;
        
        this.initializeStripe();
        this.initializeEventListeners();
    }

    async initializeStripe() {
        try {
            // Get Stripe publishable key from backend
            const response = await api.getStripeConfig();
            if (response.success && response.data.publishableKey) {
                this.stripe = Stripe(response.data.publishableKey);
                this.elements = this.stripe.elements();
                this.setupCardElement();
            }
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
        }
    }

    setupCardElement() {
        if (!this.elements) return;

        // Create card element
        this.cardElement = this.elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: '#1e293b',
                    '::placeholder': {
                        color: '#64748b',
                    },
                },
                invalid: {
                    color: '#ef4444',
                },
            },
        });

        // Mount card element when payment modal is shown
        // This will be done in showPaymentModal method
    }

    showPaymentModal(order) {
        this.currentOrder = order;
        const modal = document.getElementById('paymentModal');
        
        // Update order summary
        this.updateOrderSummary(order);
        
        // Mount card element
        if (this.cardElement && !this.cardElement._mounted) {
            const cardElementContainer = document.getElementById('card-element');
            if (cardElementContainer) {
                this.cardElement.mount('#card-element');
                this.cardElement._mounted = true;
            }
        }
        
        modal.classList.add('show');
    }

    hidePaymentModal() {
        const modal = document.getElementById('paymentModal');
        modal.classList.remove('show');
        
        // Unmount card element
        if (this.cardElement && this.cardElement._mounted) {
            this.cardElement.unmount();
            this.cardElement._mounted = false;
        }
        
        this.currentOrder = null;
    }

    updateOrderSummary(order) {
        const summaryContainer = document.getElementById('paymentOrderSummary');
        
        const itemsList = order.items.map(item => `
            <div class="order-summary-item">
                <span>${item.quantity}x ${item.name}</span>
                <span>$${item.subtotal.toFixed(2)}</span>
            </div>
        `).join('');
        
        summaryContainer.innerHTML = `
            <h4>Order Summary</h4>
            <div class="order-summary-items">
                ${itemsList}
            </div>
            <div class="order-summary-totals">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>$${order.subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Tax:</span>
                    <span>$${order.tax.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total:</span>
                    <span>$${order.total.toFixed(2)}</span>
                </div>
            </div>
        `;
    }

    async processPayment() {
        if (!this.stripe || !this.cardElement || !this.currentOrder || this.isProcessing) {
            return;
        }

        try {
            this.isProcessing = true;
            this.updatePaymentButton(true);

            // Create payment intent
            const paymentIntentResponse = await api.createPaymentIntent(this.currentOrder._id);
            
            if (!paymentIntentResponse.success) {
                throw new Error(paymentIntentResponse.message || 'Failed to create payment intent');
            }

            const { clientSecret } = paymentIntentResponse.data;

            // Confirm payment with Stripe
            const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: this.cardElement,
                    billing_details: {
                        name: window.authManager.currentUser.name,
                        email: window.authManager.currentUser.email,
                    },
                }
            });

            if (error) {
                throw new Error(error.message);
            }

            if (paymentIntent.status === 'succeeded') {
                // Confirm payment with backend
                await api.confirmPayment(paymentIntent.id);
                
                // Clear cart
                window.cartManager.clearCart();
                
                // Hide payment modal
                this.hidePaymentModal();
                
                // Switch to orders view
                window.app.switchView('orders');
                
                // Reload orders
                window.ordersManager.loadOrders();
                
                showToast('Payment successful! Your order is confirmed.', 'success');
            }

        } catch (error) {
            console.error('Payment failed:', error);
            this.displayCardError(error.message);
            showToast(error.message || 'Payment failed', 'error');
        } finally {
            this.isProcessing = false;
            this.updatePaymentButton(false);
        }
    }

    updatePaymentButton(processing) {
        const button = document.getElementById('submit-payment');
        const buttonText = document.getElementById('payment-btn-text');
        const spinner = document.querySelector('.payment-spinner');
        
        if (processing) {
            button.disabled = true;
            buttonText.textContent = 'Processing...';
            spinner.classList.add('show');
        } else {
            button.disabled = false;
            buttonText.textContent = 'Pay Now';
            spinner.classList.remove('show');
        }
    }

    displayCardError(message) {
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = message;
        
        // Clear error after 5 seconds
        setTimeout(() => {
            errorElement.textContent = '';
        }, 5000);
    }

    initializeEventListeners() {
        // Close payment modal
        document.getElementById('closePaymentModal').addEventListener('click', () => {
            if (!this.isProcessing) {
                this.hidePaymentModal();
            }
        });

        // Submit payment
        document.getElementById('submit-payment').addEventListener('click', () => {
            this.processPayment();
        });

        // Handle card element changes
        if (this.cardElement) {
            this.cardElement.on('change', (event) => {
                if (event.error) {
                    this.displayCardError(event.error.message);
                } else {
                    this.displayCardError('');
                }
            });
        }

        // Prevent modal close during processing
        document.getElementById('paymentModal').addEventListener('click', (e) => {
            if (e.target.id === 'paymentModal' && !this.isProcessing) {
                this.hidePaymentModal();
            }
        });
    }
}

// Create global payment manager
window.paymentManager = new PaymentManager();