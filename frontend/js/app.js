// Main application controller
class FoodieHubApp {
    constructor() {
        this.currentView = 'menu';
        this.isInitialized = false;
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize authentication
            const isAuthenticated = await window.authManager.initializeAuth();
            
            // Always initialize menu (public access)
            await window.menuManager.initialize();
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            if (isAuthenticated) {
                // Initialize authenticated managers
                await this.initializeAuthenticatedManagers();
            }
            
            // Hide loading screen
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('App initialization failed:', error);
            this.hideLoadingScreen();
            showToast('Failed to initialize application', 'error');
        }
    }

    async initializeAuthenticatedManagers() {
        try {
            // Initialize orders manager
            await window.ordersManager.initialize();
            
            // Initialize profile manager
            await window.profileManager.initialize();
            
            // Connect to socket for real-time updates
            window.socketManager.connect();
            
            // Render current view
            this.renderCurrentView();
            
        } catch (error) {
            console.error('Failed to initialize authenticated managers:', error);
            throw error;
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.classList.remove('hidden');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 500);
    }

    switchView(view) {
        if (!window.authManager.isAuthenticated && view !== 'menu') {
            showToast('Please login to access this feature', 'warning');
            window.authManager.showAuthModal();
            return;
        }

        this.currentView = view;
        
        // Update active navigation buttons
        document.querySelectorAll('.nav-btn, .nav-btn-mobile').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-view') === view) {
                btn.classList.add('active');
            }
        });

        // Show/hide views
        document.querySelectorAll('.view').forEach(viewEl => {
            viewEl.classList.remove('active');
        });
        
        const targetView = document.getElementById(view + 'View');
        if (targetView) {
            targetView.classList.add('active');
        }

        // Close mobile menu
        this.closeMobileMenu();

        // Render current view
        this.renderCurrentView();
        
        // Update URL without page reload
        this.updateURL(view);
    }

    renderCurrentView() {
        if (!this.isInitialized || !window.authManager.isAuthenticated) {
            return;
        }

        switch (this.currentView) {
            case 'menu':
                // Menu is already loaded
                break;
            case 'cart':
                window.cartManager.renderCart();
                break;
            case 'orders':
                // Orders are already loaded
                break;
            case 'profile':
                // Profile is already loaded
                break;
        }
    }

    closeMobileMenu() {
        const mobileNav = document.getElementById('mobileNav');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const icon = mobileMenuBtn.querySelector('i');
        
        mobileNav.classList.remove('show');
        icon.className = 'fas fa-bars';
    }

    updateURL(view) {
        const url = new URL(window.location);
        url.searchParams.set('view', view);
        window.history.replaceState({}, '', url);
    }

    initializeEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn, .nav-btn-mobile').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // User dropdown navigation
        document.querySelectorAll('.user-dropdown a[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // Mobile menu toggle
        document.getElementById('mobileMenuBtn').addEventListener('click', () => {
            const mobileNav = document.getElementById('mobileNav');
            const icon = document.getElementById('mobileMenuBtn').querySelector('i');
            
            mobileNav.classList.toggle('show');
            
            if (mobileNav.classList.contains('show')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });

        // Initialize auth event listeners
        window.authManager.initializeEventListeners();

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const view = urlParams.get('view') || 'menu';
            this.switchView(view);
        });

        // Handle initial URL view
        const urlParams = new URLSearchParams(window.location.search);
        const initialView = urlParams.get('view') || 'menu';
        if (initialView !== 'menu') {
            setTimeout(() => {
                this.switchView(initialView);
            }, 1000);
        }

        // Handle online/offline status
        window.addEventListener('online', () => {
            showToast('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            showToast('Connection lost. Some features may not work.', 'warning');
        });

        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && window.authManager.isAuthenticated) {
                // Refresh data when user returns to tab
                if (this.currentView === 'orders') {
                    window.ordersManager.loadOrders();
                }
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Alt + M for Menu
            if (e.altKey && e.key === 'm') {
                e.preventDefault();
                this.switchView('menu');
            }
            
            // Alt + C for Cart
            if (e.altKey && e.key === 'c') {
                e.preventDefault();
                this.switchView('cart');
            }
            
            // Alt + O for Orders
            if (e.altKey && e.key === 'o') {
                e.preventDefault();
                this.switchView('orders');
            }
            
            // Alt + P for Profile
            if (e.altKey && e.key === 'p') {
                e.preventDefault();
                this.switchView('profile');
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                // Close auth modal
                const authModal = document.getElementById('authModal');
                if (authModal.classList.contains('show') && window.authManager.isAuthenticated) {
                    window.authManager.hideAuthModal();
                }
                
                // Close payment modal
                const paymentModal = document.getElementById('paymentModal');
                if (paymentModal.classList.contains('show') && !window.paymentManager.isProcessing) {
                    window.paymentManager.hidePaymentModal();
                }
            }
        });

        // Service Worker registration (for PWA features)
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('SW registered: ', registration);
                    })
                    .catch(registrationError => {
                        console.log('SW registration failed: ', registrationError);
                    });
            });
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FoodieHubApp();
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showToast('An unexpected error occurred', 'error');
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    showToast('An unexpected error occurred', 'error');
});