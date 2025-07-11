// Configuration
const CONFIG = {
    API_BASE_URL: window.location.protocol === 'https:' ? 'https://localhost:5000/api' : 'http://localhost:5000/api',
    SOCKET_URL: window.location.hostname === 'localhost' ? 'http://localhost:5000' : '',
    STRIPE_PUBLISHABLE_KEY: null, // Will be loaded from API
    
    // Pagination
    MENU_ITEMS_PER_PAGE: 12,
    ORDERS_PER_PAGE: 10,
    
    // Toast duration
    TOAST_DURATION: 3000,
    
    // Order status colors
    ORDER_STATUS_COLORS: {
        placed: '#3b82f6',
        confirmed: '#f59e0b',
        preparing: '#ea580c',
        ready: '#22c55e',
        completed: '#6b7280',
        cancelled: '#ef4444'
    },
    
    // Order status icons
    ORDER_STATUS_ICONS: {
        placed: 'fas fa-clock',
        confirmed: 'fas fa-check-circle',
        preparing: 'fas fa-fire',
        ready: 'fas fa-bell',
        completed: 'fas fa-check',
        cancelled: 'fas fa-times-circle'
    }
};

// Environment detection
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    CONFIG.API_BASE_URL = 'http://localhost:5000/api';
    CONFIG.SOCKET_URL = 'http://localhost:5000';
} else {
    // Production URLs - update these when deploying
    CONFIG.API_BASE_URL = 'https://your-backend-domain.com/api';
    CONFIG.SOCKET_URL = 'https://your-backend-domain.com';
}

// Export for use in other files
window.CONFIG = CONFIG;