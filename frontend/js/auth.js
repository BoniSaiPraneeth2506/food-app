// Authentication management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.initializeAuth();
    }

    async initializeAuth() {
        const token = localStorage.getItem('authToken');
        if (token) {
            api.setToken(token);
            try {
                const response = await api.getCurrentUser();
                if (response.success) {
                    this.currentUser = response.user;
                    this.isAuthenticated = true;
                    this.updateUI();
                    return true;
                }
            } catch (error) {
                console.error('Auth initialization failed:', error);
                this.logout();
            }
        }
        
        this.showAuthModal();
        return false;
    }

    async login(email, password) {
        try {
            showLoading('Signing in...');
            
            const response = await api.login(email, password);
            
            if (response.success) {
                window.api.setToken(response.token);
                this.currentUser = response.user;
                this.isAuthenticated = true;
                
                this.hideAuthModal();
                this.updateUI();
                
                showToast('Welcome back!', 'success');
                
                // Initialize socket connection
                if (window.socketManager) {
                    window.socketManager.connect();
                }
                
                // Initialize managers after successful login
                if (window.app && window.app.initializeManagers) {
                    await window.app.initializeManagers();
                }
                
                return true;
            }
        } catch (error) {
            console.error('Login failed:', error);
            showToast(error.message || 'Login failed', 'error');
            return false;
        } finally {
            hideLoading();
        }
    }

    async register(userData) {
        try {
            showLoading('Creating account...');
            
            const response = await api.register(userData);
            
            if (response.success) {
                api.setToken(response.token);
                this.currentUser = response.user;
                this.isAuthenticated = true;
                
                this.hideAuthModal();
                this.updateUI();
                
                showToast('Account created successfully!', 'success');
                
                // Initialize socket connection
                if (window.socketManager) {
                    window.socketManager.connect();
                }
                
                return true;
            }
        } catch (error) {
            console.error('Registration failed:', error);
            showToast(error.message || 'Registration failed', 'error');
            return false;
        } finally {
            hideLoading();
        }
    }

    logout() {
        api.setToken(null);
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Disconnect socket
        if (window.socketManager) {
            window.socketManager.disconnect();
        }
        
        // Clear application state
        if (window.cartManager) {
            window.cartManager.clearCart();
        }
        
        this.showAuthModal();
        showToast('Logged out successfully', 'info');
    }

    showAuthModal() {
        const modal = document.getElementById('authModal');
        modal.classList.add('show');
        
        // Reset forms
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
        
        // Show login form by default
        this.showLoginForm();
    }

    hideAuthModal() {
        const modal = document.getElementById('authModal');
        modal.classList.remove('show');
    }

    showLoginForm() {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('authTitle').textContent = 'Welcome Back';
    }

    showRegisterForm() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
        document.getElementById('authTitle').textContent = 'Create Account';
    }

    updateUI() {
        if (this.isAuthenticated && this.currentUser) {
            // Update user display
            const userNameDisplay = document.getElementById('userNameDisplay');
            const profileUserName = document.getElementById('profileUserName');
            const profileUserEmail = document.getElementById('profileUserEmail');
            const profileUserRole = document.getElementById('profileUserRole');
            
            if (userNameDisplay) {
                userNameDisplay.textContent = this.currentUser.name;
            }
            
            if (profileUserName) {
                profileUserName.textContent = this.currentUser.name;
            }
            
            if (profileUserEmail) {
                profileUserEmail.textContent = this.currentUser.email;
            }
            
            if (profileUserRole) {
                profileUserRole.textContent = this.currentUser.role;
            }
            
            // Update profile form
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');
            const profilePhone = document.getElementById('profilePhone');
            
            if (profileName) profileName.value = this.currentUser.name || '';
            if (profileEmail) profileEmail.value = this.currentUser.email || '';
            if (profilePhone) profilePhone.value = this.currentUser.phone || '';
        }
    }

    async updateProfile(userData) {
        try {
            showLoading('Updating profile...');
            
            const response = await api.updateProfile(userData);
            
            if (response.success) {
                this.currentUser = response.user;
                this.updateUI();
                showToast('Profile updated successfully!', 'success');
                return true;
            }
        } catch (error) {
            console.error('Profile update failed:', error);
            showToast(error.message || 'Profile update failed', 'error');
            return false;
        } finally {
            hideLoading();
        }
    }

    initializeEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            await this.login(email, password);
        });

        // Register form
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                name: document.getElementById('registerName').value,
                email: document.getElementById('registerEmail').value,
                phone: document.getElementById('registerPhone').value,
                studentId: document.getElementById('registerStudentId').value,
                password: document.getElementById('registerPassword').value
            };
            await this.register(userData);
        });

        // Form switching
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Close modal
        document.getElementById('closeAuthModal').addEventListener('click', () => {
            if (this.isAuthenticated) {
                this.hideAuthModal();
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Profile update
        document.getElementById('profileUpdateForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                name: document.getElementById('profileName').value,
                phone: document.getElementById('profilePhone').value
            };
            await this.updateProfile(userData);
        });

        // User menu toggle
        document.getElementById('userMenuBtn').addEventListener('click', () => {
            const dropdown = document.getElementById('userDropdown');
            dropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const userMenu = document.querySelector('.user-menu');
            const dropdown = document.getElementById('userDropdown');
            
            if (!userMenu.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }
}

// Create global auth manager
window.authManager = new AuthManager();