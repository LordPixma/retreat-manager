// frontend/public/js/app.js - Fixed main application controller
const App = {
    currentView: 'login',
    currentUser: null,
    initialized: false,
    
    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Retreat Portal...');
        
        if (this.initialized) {
            console.log('App already initialized');
            return;
        }
        
        try {
            // Set up global error handling
            this.setupGlobalErrorHandling();
            
            // Check for existing authentication
            await this.checkAuthentication();
            
            this.initialized = true;
        } catch (error) {
            console.error('Initialization error:', error);
            await this.showLoginView();
        }
    },

    /**
     * Set up global error handling
     */
    setupGlobalErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            Utils.showAlert('An unexpected error occurred. Please refresh the page.', 'error');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            Utils.showAlert('A network error occurred. Please check your connection.', 'error');
        });
    },

    /**
     * Check existing authentication and route accordingly
     */
    async checkAuthentication() {
        const attendeeToken = Auth.getToken('attendee');
        const adminToken = Auth.getToken('admin');

        if (attendeeToken) {
            console.log('Found attendee token, loading attendee dashboard...');
            await this.loadAttendeeView();
        } else if (adminToken) {
            console.log('Found admin token, loading admin dashboard...');
            await this.loadAdminView();
        } else {
            console.log('No authentication found, showing login...');
            await this.showLoginView();
        }
    },

    /**
     * Show login view
     */
    async showLoginView() {
        this.currentView = 'login';
        
        try {
            // Try to use Login component if available
            if (window.Login && typeof window.Login.init === 'function') {
                await window.Login.init('attendee');
            } else {
                console.warn('Login component not available, using fallback');
                this.showFallbackLogin();
            }
        } catch (error) {
            console.error('Error loading Login component:', error);
            this.showFallbackLogin();
        }
    },

    /**
     * Show admin login view
     */
    async showAdminLoginView() {
        this.currentView = 'admin-login';
        
        try {
            // Try to use Login component if available
            if (window.Login && typeof window.Login.init === 'function') {
                await window.Login.init('admin');
            } else {
                console.warn('Login component not available, using fallback');
                this.showFallbackAdminLogin();
            }
        } catch (error) {
            console.error('Error loading Admin Login component:', error);
            this.showFallbackAdminLogin();
        }
    },

    /**
     * Fallback login form (if templates fail to load)
     */
    showFallbackLogin() {
        document.getElementById('app').innerHTML = `
            <div class="page-container">
                <div class="card">
                    <div class="card-header">
                        <h1><i class="fas fa-mountain"></i> Retreat Portal</h1>
                        <p>Welcome back</p>
                    </div>
                    <div class="card-body">
                        <div id="login-alert" class="alert alert-error hidden"></div>
                        <form id="login-form">
                            <div class="form-group">
                                <label for="ref" class="form-label">
                                    <i class="fas fa-id-card"></i> Reference Number
                                </label>
                                <input type="text" id="ref" name="ref" class="form-input" required 
                                       placeholder="Enter your reference number" autocomplete="username">
                            </div>
                            <div class="form-group">
                                <label for="password" class="form-label">
                                    <i class="fas fa-lock"></i> Password
                                </label>
                                <div class="password-input-container">
                                    <input type="password" id="password" name="password" class="form-input" required 
                                           placeholder="Enter your password" autocomplete="current-password">
                                    <button type="button" class="password-toggle" id="toggle-password">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%;" id="login-btn">
                                <span id="login-text">Sign In</span>
                                <div id="login-spinner" class="loading-spinner hidden"></div>
                            </button>
                        </form>
                        <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                            <a href="#" id="admin-link" style="color: var(--primary); text-decoration: none; font-size: 0.9rem;">
                                <i class="fas fa-cog"></i> Admin Access
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Bind login events
        this.bindFallbackLoginEvents();
    },

    /**
     * Fallback admin login form
     */
    showFallbackAdminLogin() {
        document.getElementById('app').innerHTML = `
            <div class="page-container">
                <div class="card">
                    <div class="card-header">
                        <h1><i class="fas fa-shield-alt"></i> Admin Portal</h1>
                        <p>Administrative Access</p>
                    </div>
                    <div class="card-body">
                        <div id="admin-login-alert" class="alert alert-error hidden"></div>
                        <form id="admin-login-form">
                            <div class="form-group">
                                <label for="admin-user" class="form-label">
                                    <i class="fas fa-user"></i> Username
                                </label>
                                <input type="text" id="admin-user" name="user" class="form-input" required
                                       placeholder="Enter admin username" autocomplete="username">
                            </div>
                            <div class="form-group">
                                <label for="admin-pass" class="form-label">
                                    <i class="fas fa-lock"></i> Password
                                </label>
                                <div class="password-input-container">
                                    <input type="password" id="admin-pass" name="pass" class="form-input" required
                                           placeholder="Enter admin password" autocomplete="current-password">
                                    <button type="button" class="password-toggle" id="toggle-admin-password">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%;" id="admin-login-btn">
                                <span id="admin-login-text">Sign In</span>
                                <div id="admin-login-spinner" class="loading-spinner hidden"></div>
                            </button>
                        </form>
                        <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                            <a href="#" id="attendee-link" style="color: var(--primary); text-decoration: none; font-size: 0.9rem;">
                                <i class="fas fa-arrow-left"></i> Back to Attendee Login
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.bindFallbackAdminLoginEvents();
    },

    /**
     * Bind fallback login form events
     */
    bindFallbackLoginEvents() {
        const loginForm = document.getElementById('login-form');
        const adminLink = document.getElementById('admin-link');
        const togglePassword = document.getElementById('toggle-password');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const ref = formData.get('ref').trim();
                const password = formData.get('password');
                
                const submitBtn = document.getElementById('login-btn');
                
                try {
                    this.showButtonLoading(submitBtn, 'login-spinner', 'login-text');
                    await Auth.attendeeLogin(ref, password);
                    this.showAlert('login-alert', 'Login successful! Redirecting...', 'success');
                    
                    setTimeout(async () => {
                        await this.loadAttendeeView();
                    }, 1000);
                } catch (error) {
                    this.showAlert('login-alert', error.message, 'error');
                } finally {
                    this.hideButtonLoading(submitBtn, 'login-spinner', 'login-text', 'Sign In');
                }
            });
        }

        if (adminLink) {
            adminLink.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.showAdminLoginView();
            });
        }

        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                const icon = togglePassword.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        }
    },

    /**
     * Bind fallback admin login events
     */
    bindFallbackAdminLoginEvents() {
        const adminForm = document.getElementById('admin-login-form');
        const attendeeLink = document.getElementById('attendee-link');
        const togglePassword = document.getElementById('toggle-admin-password');

        if (adminForm) {
            adminForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const user = formData.get('user').trim();
                const pass = formData.get('pass');
                
                const submitBtn = document.getElementById('admin-login-btn');
                
                try {
                    this.showButtonLoading(submitBtn, 'admin-login-spinner', 'admin-login-text');
                    await Auth.adminLogin(user, pass);
                    this.showAlert('admin-login-alert', 'Login successful! Redirecting...', 'success');
                    
                    setTimeout(async () => {
                        await this.loadAdminView();
                    }, 1000);
                } catch (error) {
                    this.showAlert('admin-login-alert', error.message, 'error');
                } finally {
                    this.hideButtonLoading(submitBtn, 'admin-login-spinner', 'admin-login-text', 'Sign In');
                }
            });
        }

        if (attendeeLink) {
            attendeeLink.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.showLoginView();
            });
        }

        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const passwordInput = document.getElementById('admin-pass');
                const icon = togglePassword.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    passwordInput.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        }
    },

    /**
     * Load attendee dashboard view
     */
    async loadAttendeeView() {
        this.currentView = 'attendee';
        
        try {
            // Get attendee data
            const attendeeData = await API.get('/me');
            this.currentUser = attendeeData;

            // Try to use AttendeeDashboard component if available
            if (window.AttendeeDashboard && typeof window.AttendeeDashboard.init === 'function') {
                await window.AttendeeDashboard.init();
            } else {
                // Fallback to simple dashboard
                this.showFallbackAttendeeDashboard(attendeeData);
            }

        } catch (error) {
            console.error('Failed to load attendee view:', error);
            Utils.showAlert('Failed to load dashboard. Please try logging in again.', 'error');
            Auth.clearAllTokens();
            await this.showLoginView();
        }
    },

    /**
     * Fallback attendee dashboard
     */
    showFallbackAttendeeDashboard(attendeeData) {
        document.getElementById('app').innerHTML = `
            <div class="dashboard" style="background: var(--background); min-height: 100vh;">
                <div class="dashboard-header">
                    <div>
                        <h1 class="dashboard-title">Welcome, ${Utils.escapeHtml(attendeeData.name)}</h1>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem;">Your retreat information and details</p>
                    </div>
                    <div class="dashboard-actions">
                        <button class="btn btn-secondary" id="attendee-logout">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>

                <div class="info-grid">
                    <div class="info-card">
                        <h3><i class="fas fa-bed"></i> Room Assignment</h3>
                        <div class="info-value">${attendeeData.room ? attendeeData.room.number : 'Not assigned'}</div>
                        ${attendeeData.room ? `<p>${attendeeData.room.description || ''}</p>` : '<p>No room assigned yet.</p>'}
                    </div>
                    <div class="info-card">
                        <h3><i class="fas fa-credit-card"></i> Payment Due</h3>
                        <div class="info-value" style="color: ${(attendeeData.payment_due || 0) > 0 ? 'var(--warning)' : 'var(--success)'};">
                            ${Utils.formatCurrency(attendeeData.payment_due)}
                        </div>
                        <span class="badge ${(attendeeData.payment_due || 0) > 0 ? 'badge-warning' : 'badge-success'}">
                            ${(attendeeData.payment_due || 0) > 0 ? 'Payment Pending' : 'Paid in Full'}
                        </span>
                    </div>
                    <div class="info-card">
                        <h3><i class="fas fa-users"></i> Group Assignment</h3>
                        <div class="info-value">${attendeeData.group ? attendeeData.group.name : 'No Group'}</div>
                        ${attendeeData.group && attendeeData.group.members && attendeeData.group.members.length > 0 ? `
                            <ul style="list-style: none; padding: 0; margin-top: 1rem;">
                                ${attendeeData.group.members.map(member => `
                                    <li style="padding: 0.25rem 0; font-size: 0.9rem;">
                                        ${Utils.escapeHtml(member.name)} (${Utils.escapeHtml(member.ref_number)})
                                    </li>
                                `).join('')}
                            </ul>
                        ` : '<p>No group members assigned.</p>'}
                    </div>
                </div>
            </div>
        `;

        // Bind logout event
        document.getElementById('attendee-logout').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                Auth.logout();
            }
        });
    },

    /**
     * Load admin dashboard view
     */
    async loadAdminView() {
        this.currentView = 'admin';
        
        try {
            // Try to use AdminDashboard component if available
            if (window.AdminDashboard && typeof window.AdminDashboard.init === 'function') {
                await window.AdminDashboard.init();
            } else {
                // Fallback to simple admin dashboard
                const attendeesData = await API.get('/admin/attendees');
                this.showFallbackAdminDashboard(attendeesData);
            }

        } catch (error) {
            console.error('Failed to load admin view:', error);
            Utils.showAlert('Failed to load admin dashboard. Please try logging in again.', 'error');
            Auth.clearAllTokens();
            await this.showLoginView();
        }
    },

    /**
     * Fallback admin dashboard
     */
    showFallbackAdminDashboard(attendeesData) {
        // Calculate stats
        const totalAttendees = attendeesData.length;
        const totalRevenue = attendeesData.reduce((sum, a) => sum + (a.payment_due || 0), 0);
        const pendingPayments = attendeesData.filter(a => (a.payment_due || 0) > 0).length;
        const roomsOccupied = attendeesData.filter(a => a.room).length;

        document.getElementById('app').innerHTML = `
            <div class="dashboard" style="background: var(--background); min-height: 100vh;">
                <div class="dashboard-header">
                    <div>
                        <h1 class="dashboard-title">Admin Dashboard</h1>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem;">Manage attendees, rooms, and groups</p>
                    </div>
                    <div class="dashboard-actions">
                        <button class="btn btn-secondary" id="admin-logout">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${totalAttendees}</div>
                        <div class="stat-label">Total Attendees</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Utils.formatCurrency(totalRevenue)}</div>
                        <div class="stat-label">Total Revenue</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${pendingPayments}</div>
                        <div class="stat-label">Pending Payments</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${roomsOccupied}</div>
                        <div class="stat-label">Rooms Occupied</div>
                    </div>
                </div>

                <div class="data-table">
                    <div class="table-header">
                        <h3 class="table-title">Attendees</h3>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Reference</th>
                                <th>Name</th>
                                <th>Room</th>
                                <th>Payment Due</th>
                                <th>Group</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${attendeesData.map(attendee => {
                                const paymentDue = attendee.payment_due || 0;
                                const statusBadge = paymentDue > 0 
                                    ? `<span class="badge badge-warning">Payment Due</span>`
                                    : `<span class="badge badge-success">Paid</span>`;
                                    
                                return `
                                    <tr>
                                        <td><strong>${Utils.escapeHtml(attendee.ref_number)}</strong></td>
                                        <td>${Utils.escapeHtml(attendee.name)}</td>
                                        <td>${attendee.room ? Utils.escapeHtml(attendee.room.number) : 'Unassigned'}</td>
                                        <td><strong>${Utils.formatCurrency(paymentDue)}</strong></td>
                                        <td>${attendee.group ? Utils.escapeHtml(attendee.group.name) : 'No Group'}</td>
                                        <td>${statusBadge}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Bind logout event
        document.getElementById('admin-logout').addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                Auth.logout();
            }
        });
    },

    /**
     * Utility functions for UI feedback
     */
    showAlert(alertId, message, type = 'error') {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `<i class="fas fa-${this.getAlertIcon(type)}"></i> ${message}`;
            alert.classList.remove('hidden');
        }
    },

    hideAlert(alertId) {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.classList.add('hidden');
        }
    },

    getAlertIcon(type) {
        const icons = {
            error: 'exclamation-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    },

    showButtonLoading(button, spinnerId, textId) {
        if (button) {
            button.disabled = true;
            const spinner = document.getElementById(spinnerId);
            const text = document.getElementById(textId);
            
            if (spinner) spinner.classList.remove('hidden');
            if (text) text.style.opacity = '0.7';
        }
    },

    hideButtonLoading(button, spinnerId, textId, originalText) {
        if (button) {
            button.disabled = false;
            const spinner = document.getElementById(spinnerId);
            const text = document.getElementById(textId);
            
            if (spinner) spinner.classList.add('hidden');
            if (text) {
                text.style.opacity = '1';
                if (originalText) text.textContent = originalText;
            }
        }
    },

    /**
     * Logout current user
     */
    logout() {
        Auth.clearAllTokens();
        this.currentUser = null;
        this.showLoginView();
    }
};

// Make App globally available
window.App = App;

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    // DOM is already loaded
    App.init();
}