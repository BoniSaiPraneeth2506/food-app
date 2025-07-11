// Profile management
class ProfileManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Profile form is handled by AuthManager
        // This class can be extended for additional profile features
    }

    async initialize() {
        // Load additional profile data if needed
        if (window.authManager.isAuthenticated) {
            await window.ordersManager.loadOrderStats();
        }
    }

    updateStats(stats) {
        const totalOrdersEl = document.getElementById('totalOrders');
        const totalSpentEl = document.getElementById('totalSpent');
        const completedOrdersEl = document.getElementById('completedOrders');
        
        if (totalOrdersEl) totalOrdersEl.textContent = stats.totalOrders || 0;
        if (totalSpentEl) totalSpentEl.textContent = `$${(stats.totalRevenue || 0).toFixed(2)}`;
        if (completedOrdersEl) completedOrdersEl.textContent = stats.completedOrders || 0;
    }
}

// Create global profile manager
window.profileManager = new ProfileManager();