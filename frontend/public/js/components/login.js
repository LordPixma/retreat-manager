const Login = {
    currentView: 'attendee', // 'attendee' or 'admin'

    /**
     * Initialize login component
     */
    async init(view = 'attendee') {
        this.currentView = view;
        await this.render();
        document.body.classList.add('login-page');
        this.bindEvents();
        this.setupValidation();
        this.setupAccessibility();
    },

    /**
     * Render login template
     */
    async render() {
        const templatePath = this.currentView === 'admin' 
            ? 'templates/admin-login.html' 
            : 'templates/login.html';
        
        const content = await Utils.loadTemplate(templatePath);
        document.getElementById('app').innerHTML = content;
    },

    /**
     * Bind form events
     */
    bindEvents() {
        this.bindFormSubmission();
        this.bindPasswordToggle();
        this.bindNavigation();
        this.bindKeyboardShortcuts();
    },

    /**
     * Bind form submission events
     */
    bindFormSubmission() {
        const form = this.currentView === 'admin' 
            ? document.getElementById('admin-login-form')
            : document.getElementById('login-form');

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                if (this.currentView === 'admin') {
                    await this.handleAdminLogin(e);
                } else {
                    await this.handleAttendeeLogin(e);
                }
            });
        }
    },

    /**
     * Handle attendee login
     */
    async handleAttendeeLogin(e) {
        const formData = new FormData(e.target);
        const ref = formData.get('ref').trim();
        const password = formData.get('password');
        
        // Clear previous alerts
        this.hideAlert('login-alert');
        
        // Validate inputs
        if (!this.validateAttendeeInputs(ref, password)) {
            return;
        }
        
        const submitBtn = document.getElementById('login-btn');
        
        try {
            this.showButtonLoading(submitBtn, 'login-spinner', 'login-text');
            
            await Auth.attendeeLogin(ref, password);
            
            this.showAlert('login-alert', 'Login successful! Redirecting...', 'success');
            
            // Small delay to show success message
            setTimeout(async () => {
                document.body.classList.remove('login-page');
                await App.loadAttendeeView();
            }, 1000);
            
        } catch (error) {
            this.showAlert('login-alert', error.message, 'error');
            
            // Focus back to form for accessibility
            document.getElementById('login-ref').focus();
            
        } finally {
            this.hideButtonLoading(submitBtn, 'login-spinner', 'login-text', 'Sign In');
        }
    },

    /**
     * Handle admin login
     */
    async handleAdminLogin(e) {
        const formData = new FormData(e.target);
        const user = formData.get('user').trim();
        const pass = formData.get('pass');
        
        // Clear previous alerts
        this.hideAlert('admin-login-alert');
        
        // Validate inputs
        if (!this.validateAdminInputs(user, pass)) {
            return;
        }
        
        const submitBtn = document.getElementById('admin-login-btn');
        
        try {
            this.showButtonLoading(submitBtn, 'admin-login-spinner', 'admin-login-text');
            
            await Auth.adminLogin(user, pass);
            
            this.showAlert('admin-login-alert', 'Login successful! Redirecting...', 'success');
            
            // Small delay to show success message
            setTimeout(async () => {
                document.body.classList.remove('login-page');
                await App.loadAdminView();
            }, 1000);
            
        } catch (error) {
            this.showAlert('admin-login-alert', error.message, 'error');
            
            // Focus back to form for accessibility
            document.getElementById('admin-user').focus();
            
        } finally {
            this.hideButtonLoading(submitBtn, 'admin-login-spinner', 'admin-login-text', 'Sign In');
        }
    },

    /**
     * Validate attendee inputs
     */
    validateAttendeeInputs(ref, password) {
        let isValid = true;
        
        // Reference number validation
        const refInput = document.getElementById('login-ref');
        if (!ref || ref.length < 3) {
            this.showFieldError(refInput, 'Reference number must be at least 3 characters');
            isValid = false;
        } else {
            this.clearFieldError(refInput);
        }
        
        // Password validation
        const passwordInput = document.getElementById('login-password');
        if (!password || password.length < 1) {
            this.showFieldError(passwordInput, 'Password is required');
            isValid = false;
        } else {
            this.clearFieldError(passwordInput);
        }
        
        return isValid;
    },

    /**
     * Validate admin inputs
     */
    validateAdminInputs(user, pass) {
        let isValid = true;
        
        // Username validation
        const userInput = document.getElementById('admin-user');
        if (!user || user.length < 2) {
            this.showFieldError(userInput, 'Username must be at least 2 characters');
            isValid = false;
        } else {
            this.clearFieldError(userInput);
        }
        
        // Password validation
        const passInput = document.getElementById('admin-pass');
        if (!pass || pass.length < 1) {
            this.showFieldError(passInput, 'Password is required');
            isValid = false;
        } else {
            this.clearFieldError(passInput);
        }
        
        return isValid;
    },

    /**
     * Show field error
     */
    showFieldError(input, message) {
        input.classList.add('invalid');
        input.classList.remove('valid');
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.form-validation-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-validation-message error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        input.parentNode.appendChild(errorDiv);
    },

    /**
     * Clear field error
     */
    clearFieldError(input) {
        input.classList.remove('invalid');
        input.classList.add('valid');
        
        const errorMessage = input.parentNode.querySelector('.form-validation-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    },

    /**
     * Bind password toggle functionality
     */
    bindPasswordToggle() {
        const toggleButtons = ['toggle-password', 'toggle-admin-password'];
        
        toggleButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    const passwordInput = button.parentNode.querySelector('input[type="password"], input[type="text"]');
                    const icon = button.querySelector('i');
                    
                    if (passwordInput.type === 'password') {
                        passwordInput.type = 'text';
                        icon.className = 'fas fa-eye-slash';
                        button.setAttribute('aria-label', 'Hide password');
                    } else {
                        passwordInput.type = 'password';
                        icon.className = 'fas fa-eye';
                        button.setAttribute('aria-label', 'Show password');
                    }
                });
            }
        });
    },

    /**
     * Bind navigation events
     */
    bindNavigation() {
        const adminLink = document.getElementById('admin-link');
        const attendeeLink = document.getElementById('attendee-link');
        
        if (adminLink) {
            adminLink.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.switchToAdmin();
            });
        }
        
        if (attendeeLink) {
            attendeeLink.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.switchToAttendee();
            });
        }
    },

    /**
     * Switch to admin login
     */
    async switchToAdmin() {
        this.currentView = 'admin';
        await this.render();
        this.bindEvents();
        this.setupValidation();
        this.setupAccessibility();
        
        // Focus on username field
        setTimeout(() => {
            document.getElementById('admin-user').focus();
        }, 100);
    },

    /**
     * Switch to attendee login
     */
    async switchToAttendee() {
        this.currentView = 'attendee';
        await this.render();
        this.bindEvents();
        this.setupValidation();
        this.setupAccessibility();
        
        // Focus on reference field
        setTimeout(() => {
            document.getElementById('login-ref').focus();
        }, 100);
    },

    /**
     * Setup real-time validation
     */
    setupValidation() {
        const inputs = document.querySelectorAll('.form-input');
        
        inputs.forEach(input => {
            // Clear validation on input
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
            
            // Validate on blur
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    },

    /**
     * Validate individual field
     */
    validateField(input) {
        const value = input.value.trim();
        
        if (input.hasAttribute('required') && !value) {
            this.showFieldError(input, 'This field is required');
            return false;
        }
        
        // Specific validation based on field type
        if (input.id === 'login-ref' && value && value.length < 3) {
            this.showFieldError(input, 'Reference number must be at least 3 characters');
            return false;
        }
        
        if (input.id === 'admin-user' && value && value.length < 2) {
            this.showFieldError(input, 'Username must be at least 2 characters');
            return false;
        }
        
        this.clearFieldError(input);
        return true;
    },

    /**
     * Setup accessibility features
     */
    setupAccessibility() {
        // Add ARIA labels
        const passwordToggles = document.querySelectorAll('.password-toggle');
        passwordToggles.forEach(toggle => {
            toggle.setAttribute('aria-label', 'Show password');
            toggle.setAttribute('tabindex', '0');
        });
        
        // Add form labels and descriptions
        const form = document.querySelector('form');
        if (form) {
            form.setAttribute('novalidate', 'true'); // We handle validation
        }
        
        // Set up Enter key handling for password toggles
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle.click();
                }
            });
        });
    },

    /**
     * Bind keyboard shortcuts
     */
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search (if available)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const firstInput = document.querySelector('.form-input');
                if (firstInput) {
                    firstInput.focus();
                }
            }
            
            // Escape to clear form
            if (e.key === 'Escape') {
                const form = document.querySelector('form');
                if (form) {
                    form.reset();
                    const firstInput = form.querySelector('.form-input');
                    if (firstInput) {
                        firstInput.focus();
                    }
                }
            }
        });
    },

    /**
     * Show alert message
     */
    showAlert(alertId, message, type = 'error') {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `<i class="fas fa-${this.getAlertIcon(type)}"></i> ${message}`;
            alert.classList.remove('hidden');
            
            // Auto-hide success messages
            if (type === 'success') {
                setTimeout(() => {
                    this.hideAlert(alertId);
                }, 3000);
            }
        }
    },

    /**
     * Hide alert message
     */
    hideAlert(alertId) {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.classList.add('hidden');
        }
    },

    /**
     * Get icon for alert type
     */
    getAlertIcon(type) {
        const icons = {
            error: 'exclamation-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    /**
     * Show button loading state
     */
    showButtonLoading(button, spinnerId, textId) {
        if (button) {
            button.disabled = true;
            button.classList.add('loading');
            
            const spinner = document.getElementById(spinnerId);
            const text = document.getElementById(textId);
            
            if (spinner) spinner.classList.remove('hidden');
            if (text) text.style.opacity = '0.7';
        }
    },

    /**
     * Hide button loading state
     */
    hideButtonLoading(button, spinnerId, textId, originalText) {
        if (button) {
            button.disabled = false;
            button.classList.remove('loading');
            
            const spinner = document.getElementById(spinnerId);
            const text = document.getElementById(textId);
            
            if (spinner) spinner.classList.add('hidden');
            if (text) {
                text.style.opacity = '1';
                if (originalText) text.textContent = originalText;
            }
        }
    }
};

// Make Login component globally available
window.Login = Login;
