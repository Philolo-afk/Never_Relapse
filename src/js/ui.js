// UI Manager
export class UIManager {
    constructor() {
        this.currentScreen = null;
        this.currentView = null;
        this.modals = new Map();
        
        this.init();
    }

    init() {
        this.setupModalHandlers();
        this.setupResponsiveHandlers();
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
    }

    showView(viewId) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });

        // Show target view
        const targetView = document.getElementById(`${viewId}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewId;
        }

        // Update navigation
        this.updateNavigation(viewId);
    }

    updateNavigation(activeView) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === activeView) {
                link.classList.add('active');
            }
        });
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            this.modals.set(modalId, true);
            
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            
            // Focus first focusable element
            this.focusFirstElement(modal);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            this.modals.delete(modalId);
            
            // Restore body scroll if no modals are open
            if (this.modals.size === 0) {
                document.body.style.overflow = '';
            }
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = this.createNotification(message, type);
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        // Auto remove
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);

        return notification;
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" aria-label="Close notification">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;

        // Add close handler
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        return notification;
    }

    removeNotification(notification) {
        notification.classList.add('removing');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    showLoader(target, message = 'Loading...') {
        const loader = document.createElement('div');
        loader.className = 'ui-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-spinner"></div>
                <div class="loader-message">${message}</div>
            </div>
        `;

        if (typeof target === 'string') {
            target = document.getElementById(target);
        }

        if (target) {
            target.classList.add('loading');
            target.appendChild(loader);
        }

        return loader;
    }

    hideLoader(target) {
        if (typeof target === 'string') {
            target = document.getElementById(target);
        }

        if (target) {
            target.classList.remove('loading');
            const loader = target.querySelector('.ui-loader');
            if (loader) {
                loader.remove();
            }
        }
    }

    animateValue(element, start, end, duration = 1000, formatter = null) {
        const startTime = performance.now();
        const difference = end - start;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = start + (difference * easeOut);
            
            element.textContent = formatter ? formatter(current) : Math.round(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    fadeOut(element, duration = 300) {
        const start = performance.now();
        const startOpacity = parseFloat(getComputedStyle(element).opacity);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = startOpacity * (1 - progress);
            
            if (progress >= 1) {
                element.style.display = 'none';
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    slideUp(element, duration = 300) {
        const startHeight = element.offsetHeight;
        element.style.height = startHeight + 'px';
        element.style.overflow = 'hidden';
        
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentHeight = startHeight * (1 - progress);
            element.style.height = currentHeight + 'px';
            
            if (progress >= 1) {
                element.style.display = 'none';
                element.style.height = '';
                element.style.overflow = '';
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    slideDown(element, duration = 300) {
        element.style.display = 'block';
        const targetHeight = element.scrollHeight;
        element.style.height = '0px';
        element.style.overflow = 'hidden';
        
        const start = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentHeight = targetHeight * progress;
            element.style.height = currentHeight + 'px';
            
            if (progress >= 1) {
                element.style.height = '';
                element.style.overflow = '';
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    setupModalHandlers() {
        // Handle escape key for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modals.size > 0) {
                // Close the most recently opened modal
                const lastModal = Array.from(this.modals.keys()).pop();
                this.hideModal(lastModal);
            }
        });
    }

    setupResponsiveHandlers() {
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 150);
        });

        // Handle mobile menu
        this.setupMobileMenu();
    }

    setupMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (mobileToggle && navLinks) {
            mobileToggle.addEventListener('click', () => {
                navLinks.classList.toggle('mobile-active');
                mobileToggle.classList.toggle('active');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.nav-bar')) {
                    navLinks.classList.remove('mobile-active');
                    mobileToggle.classList.remove('active');
                }
            });
        }
    }

    handleResize() {
        // Handle responsive changes
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
        
        document.body.classList.toggle('mobile', isMobile);
        document.body.classList.toggle('tablet', isTablet);
        document.body.classList.toggle('desktop', !isMobile && !isTablet);
    }

    focusFirstElement(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }

    // Utility methods
    getCurrentScreen() {
        return this.currentScreen;
    }

    getCurrentView() {
        return this.currentView;
    }

    isModalOpen(modalId) {
        return this.modals.has(modalId);
    }

    hasOpenModals() {
        return this.modals.size > 0;
    }
}