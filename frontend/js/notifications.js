// Notifications and real-time updates
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.socket = null;
        this.isConnected = false;
        
        this.initializeEventListeners();
    }

    connect() {
        if (!window.authManager.isAuthenticated || this.isConnected) {
            return;
        }

        try {
            this.socket = io(CONFIG.SOCKET_URL);
            
            this.socket.on('connect', () => {
                console.log('Socket connected');
                this.isConnected = true;
                
                // Join user room for personalized notifications
                if (window.authManager.currentUser) {
                    this.socket.emit('join-user', window.authManager.currentUser._id);
                }
            });

            this.socket.on('disconnect', () => {
                console.log('Socket disconnected');
                this.isConnected = false;
            });

            // Order status updates
            this.socket.on('orderStatusUpdate', (data) => {
                this.handleOrderStatusUpdate(data);
            });

            // Payment confirmations
            this.socket.on('paymentConfirmed', (data) => {
                this.handlePaymentConfirmed(data);
            });

            // New order notifications (for admin/staff)
            this.socket.on('newOrder', (data) => {
                this.handleNewOrder(data);
            });

            // General notifications
            this.socket.on('notification', (data) => {
                this.addNotification(data.message, data.type || 'info');
            });

        } catch (error) {
            console.error('Socket connection failed:', error);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    handleOrderStatusUpdate(data) {
        const { orderId, orderNumber, status, message } = data;
        
        // Update order in orders manager
        if (window.ordersManager) {
            window.ordersManager.updateOrderStatus(orderId, status);
        }
        
        // Show notification
        this.addNotification(message || `Order #${orderNumber} status updated to ${status}`, 'info');
        
        // Play notification sound for important statuses
        if (status === 'ready') {
            this.playNotificationSound();
        }
    }

    handlePaymentConfirmed(data) {
        const { orderNumber } = data;
        this.addNotification(`Payment confirmed for Order #${orderNumber}`, 'success');
    }

    handleNewOrder(data) {
        // This would be for admin/staff users
        const { orderNumber, customerName, total } = data;
        this.addNotification(`New order #${orderNumber} from ${customerName} - $${total.toFixed(2)}`, 'info');
    }

    addNotification(message, type = 'info') {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date(),
            read: false
        };
        
        this.notifications.unshift(notification);
        this.updateNotificationBadge();
        this.showToast(message, type);
        
        // Store in localStorage for persistence
        this.saveNotifications();
    }

    updateNotificationBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notificationBadge');
        
        if (badge) {
            badge.textContent = unreadCount;
            if (unreadCount > 0) {
                badge.classList.add('show');
            } else {
                badge.classList.remove('show');
            }
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = document.querySelector('.toast-icon');
        
        // Set message
        toastMessage.textContent = message;
        
        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toastIcon.className = `toast-icon ${icons[type] || icons.info}`;
        
        // Set toast type class
        toast.className = `toast ${type}`;
        
        // Show toast
        toast.classList.add('show');
        
        // Hide after duration
        setTimeout(() => {
            toast.classList.remove('show');
        }, CONFIG.TOAST_DURATION);
    }

    playNotificationSound() {
        // Create a simple notification sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    }

    saveNotifications() {
        try {
            // Keep only last 50 notifications
            const notificationsToSave = this.notifications.slice(0, 50);
            localStorage.setItem('notifications', JSON.stringify(notificationsToSave));
        } catch (error) {
            console.error('Failed to save notifications:', error);
        }
    }

    loadNotifications() {
        try {
            const saved = localStorage.getItem('notifications');
            if (saved) {
                this.notifications = JSON.parse(saved);
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
            this.notifications = [];
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateNotificationBadge();
        this.saveNotifications();
    }

    clearNotifications() {
        this.notifications = [];
        this.updateNotificationBadge();
        this.saveNotifications();
    }

    initializeEventListeners() {
        // Notification button click
        document.getElementById('notificationBtn').addEventListener('click', () => {
            // Could show a notification dropdown here
            this.markAllAsRead();
        });
        
        // Load saved notifications
        this.loadNotifications();
    }
}

// Global toast functions
window.showToast = (message, type = 'info') => {
    if (window.notificationManager) {
        window.notificationManager.showToast(message, type);
    }
};

window.showLoading = (message = 'Loading...') => {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    overlay.classList.add('show');
};

window.hideLoading = () => {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('show');
};

// Create global notification manager
window.notificationManager = new NotificationManager();

// Socket manager for easier access
window.socketManager = {
    connect: () => window.notificationManager.connect(),
    disconnect: () => window.notificationManager.disconnect()
};