// API utility functions
class API {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // Get authentication headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(options.auth !== false),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            
            // Handle authentication errors
            if (error.message.includes('401') || error.message.includes('token') || error.message.includes('Unauthorized')) {
                this.setToken(null);
                if (window.authManager) {
                    window.authManager.logout();
                }
            }
            
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Authentication endpoints
    async login(email, password) {
        return this.post('/auth/login', { email, password });
    }

    async register(userData) {
        return this.post('/auth/register', userData);
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }

    async updateProfile(userData) {
        return this.put('/auth/profile', userData);
    }

    // Menu endpoints
    async getMenuItems(params = {}) {
        return this.get('/menu', params);
    }

    async getMenuItem(id) {
        return this.get(`/menu/${id}`);
    }

    async getCategories() {
        return this.get('/menu/categories');
    }

    async addRating(itemId, rating) {
        return this.post(`/menu/${itemId}/rating`, { rating });
    }

    // Order endpoints
    async createOrder(orderData) {
        return this.post('/orders', orderData);
    }

    async getOrders(params = {}) {
        return this.get('/orders', params);
    }

    async getOrder(id) {
        return this.get(`/orders/${id}`);
    }

    async getOrderStats() {
        return this.get('/orders/stats/summary');
    }

    // Payment endpoints
    async createPaymentIntent(orderId) {
        return this.post('/payments/create-payment-intent', { orderId });
    }

    async confirmPayment(paymentIntentId) {
        return this.post('/payments/confirm-payment', { paymentIntentId });
    }

    async getStripeConfig() {
        return this.get('/payments/config', {}, { auth: false });
    }

    // User endpoints
    async getUser(id) {
        return this.get(`/users/${id}`);
    }
}

// Create global API instance
window.api = new API();