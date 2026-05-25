const Login = {
    currentView: 'attendee', // 'attendee' or 'admin'

    /**
     * Initialize login component
     */
    async init(view = 'attendee') {
        this.currentView = view;
        await this.render();
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
                await App.loadAdminView();
            }, 1000);

        } catch (error) {
            // Forced-reset path: the server returned 403 reset_required because
            // the admin's row is flagged must_reset_password = 1 (either from
            // a super-admin reset or the legacy bootstrap). Walk them through
            // setting a new password right here instead of bouncing them.
            if (error.status === 403 && error.body && error.body.reset_required) {
                this.hideButtonLoading(submitBtn, 'admin-login-spinner', 'admin-login-text', 'Sign In');
                await this._handleAdminResetRequired(user, pass);
                return;
            }
            this.showAlert('admin-login-alert', error.message, 'error');
            document.getElementById('admin-user').focus();
        } finally {
            this.hideButtonLoading(submitBtn, 'admin-login-spinner', 'admin-login-text', 'Sign In');
        }
    },

    async _handleAdminResetRequired(user, currentPass) {
        // Minimal prompt-based UX. Good enough to unblock the forced-reset
        // path; a richer in-page form can replace it later.
        const newPass = prompt(`Welcome ${user}! You must set a new password to continue.\n\nMinimum 8 characters, must differ from current.`);
        if (!newPass) {
            this.showAlert('admin-login-alert', 'Password reset cancelled. You won’t be able to sign in until you set a new password.', 'warning');
            return;
        }
        if (newPass.length < 8) {
            this.showAlert('admin-login-alert', 'New password must be at least 8 characters.', 'error');
            return;
        }
        if (newPass === currentPass) {
            this.showAlert('admin-login-alert', 'New password must be different from your current password.', 'error');
            return;
        }
        const confirmPass = prompt('Confirm your new password:');
        if (confirmPass !== newPass) {
            this.showAlert('admin-login-alert', 'Passwords did not match. Try again.', 'error');
            return;
        }

        try {
            // The change-password endpoint requires an admin token. Issue a
            // throwaway token by minting one server-side via a reset-only
            // login path — we can't here, so we POST a one-shot endpoint
            // /api/admin/change-password authorising via current_password.
            //
            // Because the existing /api/admin/change-password requires a
            // bearer token, we work around by hitting it with the current
            // creds in the body and a temporary token from /api/admin/login
            // … but login refuses to issue tokens while flagged.
            //
            // Solution: use the dedicated forced-reset path (POST to
            // /api/admin/change-password with credentials embedded). The
            // server endpoint detects "no Authorization header" and
            // falls through to validating current_password against the
            // admins table, then clears the flag.
            const response = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: user,
                    current_password: currentPass,
                    new_password: newPass,
                }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                this.showAlert('admin-login-alert', body.error || `Reset failed (HTTP ${response.status})`, 'error');
                return;
            }
            this.showAlert('admin-login-alert', 'Password updated. Signing you in…', 'success');
            await Auth.adminLogin(user, newPass);
            setTimeout(async () => await App.loadAdminView(), 800);
        } catch (err) {
            this.showAlert('admin-login-alert', 'Reset failed: ' + (err.message || err), 'error');
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

        // Find the form-group container for error message placement
        const formGroup = input.closest('.form-group') || input.closest('.modern-form-group') || input.parentNode;

        // Remove existing error message
        const existingError = formGroup.querySelector('.form-validation-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-validation-message error';
        errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span class="err-msg"></span>';
        errorDiv.querySelector('.err-msg').textContent = message;
        formGroup.appendChild(errorDiv);
    },

    /**
     * Clear field error
     */
    clearFieldError(input) {
        input.classList.remove('invalid');
        input.classList.add('valid');

        // Find the form-group container for error message
        const formGroup = input.closest('.form-group') || input.closest('.modern-form-group') || input.parentNode;
        const errorMessage = formGroup.querySelector('.form-validation-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    },

    /**
     * Bind password toggle functionality
     */
    bindPasswordToggle() {
        const toggleButtons = document.querySelectorAll('.password-toggle-light, .modern-pw-toggle');

        toggleButtons.forEach(button => {
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
        const inputs = document.querySelectorAll('.form-input, .form-input-light, .modern-input-wrap input');

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
        const passwordToggles = document.querySelectorAll('.password-toggle, .password-toggle-light, .modern-pw-toggle');
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
            alert.innerHTML = `<i class="fas fa-${this.getAlertIcon(type)}"></i> <span class="alert-msg"></span>`;
            alert.querySelector('.alert-msg').textContent = message;
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
