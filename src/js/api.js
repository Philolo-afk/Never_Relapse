// API Client for Never Relapse Backend
class APIClient {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        this.token = localStorage.getItem('nr_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('nr_token', token);
        } else {
            localStorage.removeItem('nr_token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async verifyEmail(email, token) {
        return this.request('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ email, token })
        });
    }

    async resendVerification(email) {
        return this.request('/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.success && response.data.token) {
            this.setToken(response.data.token);
        }

        return response;
    }

    async forgotPassword(email) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    async resetPassword(email, token, password) {
        return this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, token, password })
        });
    }

    async verifyToken() {
        return this.request('/auth/verify');
    }

    // User endpoints
    async getUserProfile() {
        return this.request('/user/profile');
    }

    async updateProfile(userData) {
        return this.request('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async getUserStats() {
        return this.request('/user/stats');
    }

    async deleteAccount(password) {
        return this.request('/user/account', {
            method: 'DELETE',
            body: JSON.stringify({ password })
        });
    }

    // Timer endpoints
    async getTimer() {
        return this.request('/timer');
    }

    async startTimer() {
        return this.request('/timer/start', {
            method: 'POST'
        });
    }

    async pauseTimer() {
        return this.request('/timer/pause', {
            method: 'POST'
        });
    }

    async resumeTimer() {
        return this.request('/timer/resume', {
            method: 'POST'
        });
    }

    async resetTimer() {
        return this.request('/timer/reset', {
            method: 'POST'
        });
    }

    // Achievement endpoints
    async getAchievements() {
        return this.request('/achievements');
    }

    async checkAchievements() {
        return this.request('/achievements/check', {
            method: 'POST'
        });
    }

    async getAchievementStats() {
        return this.request('/achievements/stats');
    }

    // Quote endpoints
    async getRandomQuote(category = null) {
        const params = category ? `?category=${category}` : '';
        return this.request(`/quotes/random${params}`);
    }

    async getDailyQuote() {
        return this.request('/quotes/daily');
    }

    async getQuotes(page = 1, limit = 20, category = null, search = null) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString()
        });

        if (category) params.append('category', category);
        if (search) params.append('search', search);

        return this.request(`/quotes?${params}`);
    }

    async addQuote(quoteData) {
        return this.request('/quotes', {
            method: 'POST',
            body: JSON.stringify(quoteData)
        });
    }

    async likeQuote(quoteId) {
        return this.request(`/quotes/${quoteId}/like`, {
            method: 'POST'
        });
    }

    async getQuoteCategories() {
        return this.request('/quotes/categories');
    }

    // Payment endpoints
    async createStripeIntent(donationData) {
        return this.request('/payments/stripe/create-intent', {
            method: 'POST',
            body: JSON.stringify(donationData)
        });
    }

    async confirmStripePayment(paymentIntentId) {
        return this.request('/payments/stripe/confirm', {
            method: 'POST',
            body: JSON.stringify({ paymentIntentId })
        });
    }

    async createPayPalPayment(donationData) {
        return this.request('/payments/paypal/create', {
            method: 'POST',
            body: JSON.stringify(donationData)
        });
    }

    async executePayPalPayment(paymentId, payerId) {
        return this.request('/payments/paypal/execute', {
            method: 'POST',
            body: JSON.stringify({ paymentId, payerId })
        });
    }

    async createMpesaPayment(donationData) {
        return this.request('/payments/mpesa/create', {
            method: 'POST',
            body: JSON.stringify(donationData)
        });
    }

    async recordManualMpesaPayment(donationData) {
        return this.request('/payments/mpesa/manual', {
            method: 'POST',
            body: JSON.stringify(donationData)
        });
    }

    async getMpesaPaymentStatus(checkoutRequestId) {
        return this.request(`/payments/mpesa/status/${checkoutRequestId}`);
    }

    async getDonationHistory(page = 1, limit = 10) {
        return this.request(`/payments/history?page=${page}&limit=${limit}`);
    }

    async getDonationStats() {
        return this.request('/payments/stats');
    }

    // Utility methods
    logout() {
        this.setToken(null);
    }

    isAuthenticated() {
        return !!this.token;
    }
}

export default new APIClient();