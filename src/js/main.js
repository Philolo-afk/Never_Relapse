// Main Application Controller
import { AuthManager } from './auth.js';
import { TimerManager } from './timer.js';
import { AchievementManager } from './achievements.js';
import { QuoteManager } from './quotes.js';
import { UIManager } from './ui.js';
import { StorageManager } from './storage.js';
import { PaymentManager } from './payments.js';
import { APIClient } from './api.js';

class NeverRelapseApp {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        
        // Initialize managers
        this.storage = new StorageManager();
        this.api = new APIClient();
        this.auth = new AuthManager(this.storage);
        this.timer = new TimerManager(this.storage);
        this.achievements = new AchievementManager(this.storage);
        this.quotes = new QuoteManager();
        this.ui = new UIManager();
        this.payments = new PaymentManager(this.api, this.ui);

        this.init();
    }

    async init() {
        try {
            // Show loading screen
            this.ui.showScreen('loading-screen');
            
            // Simulate loading time for smooth UX
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Check for existing session
            const savedUser = this.auth.getCurrentUser();
            if (savedUser) {
                this.currentUser = savedUser;
                await this.startMainApp();
            } else {
                this.ui.showScreen('login-screen');
            }

            this.setupEventListeners();
            this.isInitialized = true;

        } catch (error) {
            console.error('Failed to initialize app:', error);
            alert('Failed to load the application. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Authentication events
        this.setupAuthListeners();
        
        // Navigation events
        this.setupNavigationListeners();
        
        // Timer events
        this.setupTimerListeners();
        
        // Achievement events
        this.setupAchievementListeners();
        
        // Modal events
        this.setupModalListeners();
    }

    setupAuthListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        loginForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register form
        const registerForm = document.getElementById('register-form');
        registerForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Show register screen
        document.getElementById('show-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.ui.showScreen('register-screen');
        });

        // Show login screen
        document.getElementById('show-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.ui.showScreen('login-screen');
        });

        // Logout
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });
    }

    setupNavigationListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            if (!link.classList.contains('logout')) {
                link.addEventListener('click', (e) => {
                    const view = link.dataset.view;
                    if (view) {
                        this.ui.showView(view);
                        this.updateViewContent(view);
                    }
                });
            }
        });

        // Mobile menu toggle
        document.querySelector('.mobile-menu-toggle')?.addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('mobile-active');
        });
    }

    setupTimerListeners() {
        // Start timer
        document.getElementById('start-timer')?.addEventListener('click', () => {
            this.timer.start(this.currentUser.username);
            this.updateTimerUI();
        });

        // Pause timer
        document.getElementById('pause-timer')?.addEventListener('click', () => {
            this.timer.pause();
            this.updateTimerUI();
        });

        // Resume timer
        document.getElementById('resume-timer')?.addEventListener('click', () => {
            this.timer.resume();
            this.updateTimerUI();
        });

        // Panic button
        document.getElementById('panic-button')?.addEventListener('click', () => {
            this.ui.showModal('confirmation-modal');
        });
    }

    setupAchievementListeners() {
        // Timer updates trigger achievement checks
        setInterval(() => {
            if (this.timer.isRunning()) {
                this.checkForNewAchievements();
                this.updateTimerUI();
                this.updateProgressUI();
            }
        }, 1000);
    }

    setupModalListeners() {
        // Confirmation modal
        document.getElementById('confirm-reset')?.addEventListener('click', () => {
            this.handleReset();
        });

        document.getElementById('cancel-reset')?.addEventListener('click', () => {
            this.ui.hideModal('confirmation-modal');
        });

        // Success modal
        document.getElementById('close-success')?.addEventListener('click', () => {
            this.ui.hideModal('success-modal');
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.ui.hideModal(modal.id);
                }
            });
        });
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const user = this.auth.login(username, password);
            if (user) {
                this.currentUser = user;
                await this.startMainApp();
            } else {
                alert('Invalid username or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please try again.');
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (!username || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        try {
            const user = this.auth.register(username, email, password);
            if (user) {
                this.currentUser = user;
                await this.startMainApp();
            } else {
                alert('Username already exists');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed. Please try again.');
        }
    }

    handleLogout() {
        this.auth.logout();
        this.currentUser = null;
        this.timer.stop();
        this.ui.showScreen('login-screen');

        // Clear forms
        document.querySelectorAll('form').forEach(form => form.reset());
    }

    handleReset() {
        try {
            const stats = this.timer.reset(this.currentUser.username);
            this.achievements.reset(this.currentUser.username);
            
            this.ui.hideModal('confirmation-modal');
            this.updateAllUI();
            
            // Add activity log entry
            this.addActivityLog('Reset progress and started fresh', 'refresh-cw');
            
        } catch (error) {
            console.error('Reset error:', error);
            alert('Failed to reset progress. Please try again.');
        }
    }

    async startMainApp() {
        this.ui.showScreen('main-app');
        this.ui.showView('dashboard');
        
        // Load user data
        await this.loadUserData();
        
        // Update all UI components
        this.updateAllUI();
        
        // Start quote rotation
        this.quotes.startRotation();
    }

    async loadUserData() {
        try {
            // Load timer state
            this.timer.loadState(this.currentUser.username);
            
            // Check for achievements that should be unlocked
            this.checkForNewAchievements();
            
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    updateAllUI() {
        this.updateUserUI();
        this.updateTimerUI();
        this.updateProgressUI();
        this.updateStatsUI();
        this.updateAchievementsUI();
        this.updateQuoteUI();
    }

    updateUserUI() {
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay && this.currentUser) {
            usernameDisplay.textContent = this.currentUser.username;
        }
    }

    updateTimerUI() {
        const timerDisplay = document.getElementById('timer-display');
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');
        const resumeBtn = document.getElementById('resume-timer');

        if (!timerDisplay) return;

        const elapsed = this.timer.getElapsed();
        timerDisplay.textContent = this.formatTime(elapsed);

        // Update button visibility
        const isRunning = this.timer.isRunning();
        const isPaused = this.timer.isPaused();

        if (startBtn) startBtn.style.display = (!isRunning && !isPaused) ? 'inline-flex' : 'none';
        if (pauseBtn) pauseBtn.style.display = isRunning ? 'inline-flex' : 'none';
        if (resumeBtn) resumeBtn.style.display = isPaused ? 'inline-flex' : 'none';
    }

    updateProgressUI() {
        const nextMilestone = document.getElementById('next-milestone');
        const timeRemaining = document.getElementById('time-remaining');
        const progressFill = document.getElementById('progress-fill');

        if (!nextMilestone || !timeRemaining || !progressFill) return;

        const elapsed = this.timer.getElapsed();
        const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
        
        let targetDays = 1;
        if (days >= 1) {
            targetDays = Math.ceil((days + 1) / 7) * 7;
        }

        const progress = (days / targetDays) * 100;
        const remaining = targetDays - days;

        nextMilestone.textContent = `${targetDays} Day${targetDays === 1 ? '' : 's'}`;
        
        if (remaining > 0) {
            timeRemaining.textContent = `${remaining} day${remaining === 1 ? '' : 's'} to go`;
        } else {
            timeRemaining.textContent = 'Milestone reached!';
        }

        progressFill.style.width = `${Math.min(progress, 100)}%`;
    }

    updateStatsUI() {
        const stats = this.timer.getStats(this.currentUser.username);
        const achievementCount = this.achievements.getUnlockedCount(this.currentUser.username);

        // Dashboard quick stats
        const currentStreakStat = document.getElementById('current-streak-stat');
        const longestStreakStat = document.getElementById('longest-streak-stat');
        const achievementsCount = document.getElementById('achievements-count');

        if (currentStreakStat) {
            const days = Math.floor(stats.currentStreak / (1000 * 60 * 60 * 24));
            currentStreakStat.textContent = `${days} day${days === 1 ? '' : 's'}`;
        }

        if (longestStreakStat) {
            const days = Math.floor(stats.longestStreak / (1000 * 60 * 60 * 24));
            longestStreakStat.textContent = `${days} day${days === 1 ? '' : 's'}`;
        }

        if (achievementsCount) {
            achievementsCount.textContent = achievementCount;
        }

        // Statistics page
        this.updateStatisticsPage(stats, achievementCount);
    }

    updateStatisticsPage(stats, achievementCount) {
        const totalAttempts = document.getElementById('total-attempts');
        const currentDays = document.getElementById('current-days');
        const bestStreak = document.getElementById('best-streak');
        const totalAchievements = document.getElementById('total-achievements');

        if (totalAttempts) totalAttempts.textContent = stats.totalAttempts;
        
        if (currentDays) {
            const days = Math.floor(stats.currentStreak / (1000 * 60 * 60 * 24));
            currentDays.textContent = days;
        }
        
        if (bestStreak) {
            const days = Math.floor(stats.longestStreak / (1000 * 60 * 60 * 24));
            bestStreak.textContent = days;
        }
        
        if (totalAchievements) totalAchievements.textContent = achievementCount;
    }

    updateAchievementsUI() {
        const achievementsGrid = document.getElementById('achievements-grid');
        if (!achievementsGrid) return;

        const userAchievements = this.achievements.getUserAchievements(this.currentUser.username);
        const milestones = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365];

        achievementsGrid.innerHTML = '';

        milestones.forEach(days => {
            const achievement = userAchievements.find(a => a.milestone === days);
            const isUnlocked = !!achievement;

            const card = document.createElement('div');
            card.className = `achievement-card ${isUnlocked ? 'unlocked' : ''}`;

            card.innerHTML = `
                <div class="achievement-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="8" r="7"/>
                        <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"/>
                    </svg>
                </div>
                <div class="achievement-title">${days} Day${days === 1 ? '' : 's'}</div>
                <div class="achievement-description">
                    ${days === 1 ? 'Your first day of recovery' : 
                      days < 7 ? `${days} days clean` :
                      days < 30 ? `${days / 7} week${days === 7 ? '' : 's'} of progress` :
                      days < 365 ? `${days / 30} month${days === 30 ? '' : 's'} strong` :
                      'One full year of recovery'
                    }
                </div>
                ${isUnlocked ? `<div class="achievement-date">Unlocked ${this.formatDate(achievement.unlockedAt)}</div>` : ''}
            `;

            achievementsGrid.appendChild(card);
        });
    }

    updateQuoteUI() {
        const quoteElement = document.getElementById('daily-quote');
        if (quoteElement) {
            const quote = this.quotes.getCurrentQuote();
            quoteElement.innerHTML = `
                <p>"${quote.text}"</p>
                <cite>— ${quote.author}</cite>
            `;
        }
    }

    updateViewContent(viewName) {
        switch (viewName) {
            case 'dashboard':
                this.updateAllUI();
                break;
            case 'achievements':
                this.updateAchievementsUI();
                break;
            case 'statistics':
                this.updateStatsUI();
                this.updateActivityLog();
                break;
            case 'donate':
                this.payments.loadDonationHistory();
                break;
        }
    }

    checkForNewAchievements() {
        const elapsed = this.timer.getElapsed();
        const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
        
        const milestones = [1, 3, 7, 14, 21, 30, 60, 90, 180, 365];
        const currentMilestones = milestones.filter(m => days >= m);
        
        currentMilestones.forEach(milestone => {
            const wasUnlocked = this.achievements.unlockAchievement(this.currentUser.username, milestone);
            if (wasUnlocked) {
                this.showAchievementUnlocked(milestone);
                this.addActivityLog(`Unlocked ${milestone} day achievement!`, 'award');
            }
        });
    }

    showAchievementUnlocked(days) {
        const modal = document.getElementById('success-modal');
        const title = document.getElementById('success-title');
        const message = document.getElementById('success-message');

        if (title) title.textContent = `${days} Day Achievement Unlocked!`;
        if (message) {
            message.textContent = `Congratulations on reaching ${days} day${days === 1 ? '' : 's'} of recovery! Keep up the amazing work.`;
        }

        this.ui.showModal('success-modal');
        
        // Auto-close after 3 seconds
        setTimeout(() => {
            this.ui.hideModal('success-modal');
        }, 3000);
    }

    addActivityLog(text, icon = 'clock') {
        const activity = {
            text,
            icon,
            timestamp: new Date().toISOString()
        };

        const activities = this.storage.get(`activities_${this.currentUser.username}`) || [];
        activities.unshift(activity);
        
        // Keep only last 10 activities
        if (activities.length > 10) {
            activities.splice(10);
        }

        this.storage.set(`activities_${this.currentUser.username}`, activities);
    }

    updateActivityLog() {
        const activityLog = document.getElementById('activity-log');
        if (!activityLog) return;

        const activities = this.storage.get(`activities_${this.currentUser.username}`) || [];
        
        if (activities.length === 0) {
            activityLog.innerHTML = '<p class="text-center text-neutral-500">No recent activity</p>';
            return;
        }

        activityLog.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        ${this.getIconPath(activity.icon)}
                    </svg>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${this.formatRelativeTime(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    getIconPath(iconName) {
        const icons = {
            'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>',
            'award': '<circle cx="12" cy="8" r="7"/><polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"/>',
            'refresh-cw': '<polyline points="23,4 23,10 17,10"/><polyline points="1,20 1,14 7,14"/><path d="m3.51,9a9,9,0,0,1,14.85-3.36L23,10M1,14l4.64,4.36A9,9,0,0,0,20.49,15"/>',
            'play': '<polygon points="5,3 19,12 5,21"/>',
            'pause': '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
        };
        return icons[iconName] || icons['clock'];
    }

    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const days = Math.floor(totalSeconds / (24 * 60 * 60));
        const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
        const seconds = totalSeconds % 60;

        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new NeverRelapseApp();
});