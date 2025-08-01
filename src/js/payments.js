// Payment Manager
export class PaymentManager {
    constructor(apiClient, uiManager) {
        this.api = apiClient;
        this.ui = uiManager;
        this.selectedAmount = null;
        this.selectedCurrency = 'USD';
        this.stripe = null;
        
        this.init();
    }

    async init() {
        // Initialize Stripe
        if (window.Stripe) {
            this.stripe = Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        }
        
        this.setupEventListeners();
        await this.loadDonationHistory();
    }

    setupEventListeners() {
        // Amount selection
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectAmount(parseFloat(e.target.dataset.amount));
            });
        });

        // Custom amount input
        const customAmountInput = document.getElementById('custom-amount');
        customAmountInput?.addEventListener('input', (e) => {
            const amount = parseFloat(e.target.value);
            if (amount > 0) {
                this.selectAmount(amount);
            }
        });

        // Currency selection
        const currencySelect = document.getElementById('currency-select');
        currencySelect?.addEventListener('change', (e) => {
            this.selectedCurrency = e.target.value;
            this.updateAmountButtons();
        });

        // Payment method buttons
        document.getElementById('stripe-btn')?.addEventListener('click', () => {
            this.processStripePayment();
        });

        document.getElementById('paypal-btn')?.addEventListener('click', () => {
            this.processPayPalPayment();
        });

        document.getElementById('mpesa-btn')?.addEventListener('click', () => {
            this.showMpesaModal();
        });

        // M-Pesa modal
        document.getElementById('confirm-mpesa')?.addEventListener('click', () => {
            this.processMpesaPayment();
        });

        document.getElementById('cancel-mpesa')?.addEventListener('click', () => {
            this.ui.hideModal('mpesa-modal');
        });
    }

    selectAmount(amount) {
        this.selectedAmount = amount;
        
        // Update UI
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.classList.remove('selected');
        });

        const matchingBtn = document.querySelector(`[data-amount="${amount}"]`);
        if (matchingBtn) {
            matchingBtn.classList.add('selected');
            document.getElementById('custom-amount').value = '';
        } else {
            document.getElementById('custom-amount').value = amount;
        }

        this.updatePaymentButtons();
    }

    updateAmountButtons() {
        const currencySymbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'KES': 'KSh'
        };

        const symbol = currencySymbols[this.selectedCurrency] || '$';
        
        document.querySelectorAll('.amount-btn').forEach(btn => {
            const amount = btn.dataset.amount;
            btn.textContent = `${symbol}${amount}`;
        });

        // Show/hide M-Pesa button based on currency
        const mpesaBtn = document.getElementById('mpesa-btn');
        if (mpesaBtn) {
            mpesaBtn.style.display = this.selectedCurrency === 'KES' ? 'flex' : 'none';
        }
    }

    updatePaymentButtons() {
        const hasAmount = this.selectedAmount && this.selectedAmount > 0;
        
        document.querySelectorAll('.payment-btn').forEach(btn => {
            btn.disabled = !hasAmount;
        });
    }

    getDonationData() {
        return {
            amount: this.selectedAmount,
            currency: this.selectedCurrency,
            donorName: document.getElementById('donor-name')?.value || '',
            message: document.getElementById('donation-message')?.value || '',
            isAnonymous: document.getElementById('anonymous-donation')?.checked || false
        };
    }

    async processStripePayment() {
        if (!this.stripe || !this.selectedAmount) return;

        try {
            this.ui.showModal('payment-processing-modal');
            document.getElementById('processing-message').textContent = 'Creating payment intent...';

            const donationData = this.getDonationData();
            const response = await this.api.request('/payments/stripe/create-intent', {
                method: 'POST',
                body: JSON.stringify(donationData)
            });

            if (!response.success) {
                throw new Error(response.message);
            }

            document.getElementById('processing-message').textContent = 'Redirecting to payment...';

            // Redirect to Stripe Checkout or use Elements
            const { error } = await this.stripe.redirectToCheckout({
                sessionId: response.data.sessionId
            });

            if (error) {
                throw new Error(error.message);
            }

        } catch (error) {
            console.error('Stripe payment error:', error);
            this.ui.hideModal('payment-processing-modal');
            this.ui.showNotification('Payment failed: ' + error.message, 'error');
        }
    }

    async processPayPalPayment() {
        if (!this.selectedAmount) return;

        try {
            this.ui.showModal('payment-processing-modal');
            document.getElementById('processing-message').textContent = 'Creating PayPal payment...';

            const donationData = this.getDonationData();
            const response = await this.api.request('/payments/paypal/create', {
                method: 'POST',
                body: JSON.stringify(donationData)
            });

            if (!response.success) {
                throw new Error(response.message);
            }

            document.getElementById('processing-message').textContent = 'Redirecting to PayPal...';

            // Redirect to PayPal
            window.location.href = response.data.approvalUrl;

        } catch (error) {
            console.error('PayPal payment error:', error);
            this.ui.hideModal('payment-processing-modal');
            this.ui.showNotification('Payment failed: ' + error.message, 'error');
        }
    }

    showMpesaModal() {
        if (!this.selectedAmount || this.selectedCurrency !== 'KES') {
            this.ui.showNotification('Please select an amount in KES for M-Pesa payment', 'warning');
            return;
        }

        this.ui.showModal('mpesa-modal');
    }

    async processMpesaPayment() {
        const phoneNumber = document.getElementById('mpesa-phone')?.value;
        
        if (!phoneNumber || !phoneNumber.match(/^254[0-9]{9}$/)) {
            this.ui.showNotification('Please enter a valid Kenyan phone number (254XXXXXXXXX)', 'error');
            return;
        }

        try {
            this.ui.hideModal('mpesa-modal');
            this.ui.showModal('payment-processing-modal');
            document.getElementById('processing-message').textContent = 'Initiating M-Pesa payment...';

            const donationData = {
                ...this.getDonationData(),
                phoneNumber
            };

            const response = await this.api.request('/payments/mpesa/create', {
                method: 'POST',
                body: JSON.stringify(donationData)
            });

            if (!response.success) {
                throw new Error(response.message);
            }

            this.ui.hideModal('payment-processing-modal');
            this.ui.showNotification('M-Pesa payment request sent! Please check your phone and enter your PIN.', 'success');

            // Poll for payment status
            this.pollMpesaStatus(response.data.checkoutRequestId);

        } catch (error) {
            console.error('M-Pesa payment error:', error);
            this.ui.hideModal('payment-processing-modal');
            this.ui.showNotification('M-Pesa payment failed: ' + error.message, 'error');
        }
    }

    async pollMpesaStatus(checkoutRequestId) {
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes
        
        const poll = async () => {
            try {
                const response = await this.api.request(`/payments/mpesa/status/${checkoutRequestId}`);
                
                if (response.data.status === 'completed') {
                    this.ui.showNotification('M-Pesa payment completed successfully!', 'success');
                    await this.loadDonationHistory();
                    return;
                }
                
                if (response.data.status === 'failed') {
                    this.ui.showNotification('M-Pesa payment failed. Please try again.', 'error');
                    return;
                }
                
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(poll, 10000); // Poll every 10 seconds
                }
                
            } catch (error) {
                console.error('M-Pesa status polling error:', error);
            }
        };

        setTimeout(poll, 5000); // Start polling after 5 seconds
    }

    async loadDonationHistory() {
        try {
            const response = await this.api.request('/payments/history');
            
            if (response.success) {
                this.renderDonationHistory(response.data.donations);
            }

        } catch (error) {
            console.error('Load donation history error:', error);
        }
    }

    renderDonationHistory(donations) {
        const historyList = document.getElementById('donation-history-list');
        if (!historyList) return;

        if (donations.length === 0) {
            historyList.innerHTML = '<p class="text-center text-neutral-500">No donations yet</p>';
            return;
        }

        historyList.innerHTML = donations.map(donation => `
            <div class="history-item ${donation.status}">
                <div class="history-details">
                    <div class="history-amount">
                        ${this.formatCurrency(donation.amount, donation.currency)}
                    </div>
                    <div class="history-date">
                        ${new Date(donation.createdAt).toLocaleDateString()}
                    </div>
                    <div class="history-method">
                        via ${donation.paymentMethod}
                    </div>
                    ${donation.message ? `<div class="history-message">"${donation.message}"</div>` : ''}
                </div>
                <div class="history-status ${donation.status}">
                    ${donation.status}
                </div>
            </div>
        `).join('');
    }

    formatCurrency(amount, currency) {
        const currencySymbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'KES': 'KSh'
        };

        const symbol = currencySymbols[currency] || currency;
        return `${symbol}${amount.toFixed(2)}`;
    }

    // Reset form
    resetForm() {
        this.selectedAmount = null;
        this.selectedCurrency = 'USD';
        
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        document.getElementById('custom-amount').value = '';
        document.getElementById('donor-name').value = '';
        document.getElementById('donation-message').value = '';
        document.getElementById('anonymous-donation').checked = false;
        
        this.updateAmountButtons();
        this.updatePaymentButtons();
    }
}