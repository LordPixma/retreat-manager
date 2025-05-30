// Fixed app.js - Main Application Controller
const App = {
    currentView: 'login',
    currentUser: null,
    
    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Retreat Portal...');
        
        try {
            // Check for existing authentication
            await this.checkAuthentication();
        } catch (error) {
            console.error('Initialization error:', error);
            await this.showLoginView();
        }
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
        
        // Check if Login component is available
        if (window.Login) {
            try {
                await Login.init('attendee');
            } catch (error) {
                console.error('Error loading Login component:', error);
                this.showFallbackLogin();
            }
        } else {
            console.warn('Login component not found, using fallback');
            this.showFallbackLogin();
        }
    },

    /**
     * Show admin login view
     */
    async showAdminLoginView() {
        this.currentView = 'admin-login';
        
        // Check if Login component is available
        if (window.Login) {
            try {
                await Login.init('admin');
            } catch (error) {
                console.error('Error loading Admin Login component:', error);
                this.showFallbackAdminLogin();
            }
        } else {
            console.warn('Login component not found, using fallback');
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
                        <div id="login-alert" class="hidden"></div>
                        <form id="login-form">
                            <div class="form-group">
                                <label for="ref" class="form-label">
                                    <i class="fas fa-id-card"></i> Reference Number
                                </label>
                                <input type="text" id="ref" name="ref" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label for="password" class="form-label">
                                    <i class="fas fa-lock"></i> Password
                                </label>
                                <input type="password" id="password" name="password" class="form-input" required>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%;">
                                Sign In
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
                        <div id="admin-login-alert" class="hidden"></div>
                        <form id="admin-login-form">
                            <div class="form-group">
                                <label for="admin-user" class="form-label">
                                    <i class="fas fa-user"></i> Username
                                </label>
                                <input type="text" id="admin-user" name="user" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label for="admin-pass" class="form-label">
                                    <i class="fas fa-lock"></i> Password
                                </label>
                                <input type="password" id="admin-pass" name="pass" class="form-input" required>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%;">
                                Sign In
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

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const ref = formData.get('ref');
                const password = formData.get('password');
                
                const submitBtn = e.target.querySelector('button[type="submit"]');
                
                try {
                    Utils.showLoading(submitBtn);
                    await Auth.attendeeLogin(ref, password);
                    Utils.showAlert('Login successful!', 'success');
                    await this.loadAttendeeView();
                } catch (error) {
                    Utils.showAlert(error.message, 'error');
                } finally {
                    Utils.hideLoading(submitBtn);
                }
            });
        }

        if (adminLink) {
            adminLink.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.showAdminLoginView();
            });
        }
    },

    /**
     * Bind fallback admin login events
     */
    bindFallbackAdminLoginEvents() {
        const adminForm = document.getElementById('admin-login-form');
        const attendeeLink = document.getElementById('attendee-link');

        if (adminForm) {
            adminForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const user = formData.get('user');
                const pass = formData.get('pass');
                
                const submitBtn = e.target.querySelector('button[type="submit"]');
                
                try {
                    Utils.showLoading(submitBtn);
                    await Auth.adminLogin(user, pass);
                    Utils.showAlert('Login successful!', 'success');
                    await this.loadAdminView();
                } catch (error) {
                    Utils.showAlert(error.message, 'error');
                } finally {
                    Utils.hideLoading(submitBtn);
                }
            });
        }

        if (attendeeLink) {
            attendeeLink.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.showLoginView();
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

            // For now, show a simple dashboard
            // In Phase 3, we'll load this from a template and component
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

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${attendeeData.room ? attendeeData.room.number : 'Not assigned'}</div>
                            <div class="stat-label">Room Assignment</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${Utils.formatCurrency(attendeeData.payment_due)}</div>
                            <div class="stat-label">Payment Due</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${attendeeData.group ? attendeeData.group.name : 'No Group'}</div>
                            <div class="stat-label">Group Assignment</div>
                        </div>
                    </div>

                    <div class="data-table">
                        <div class="table-header">
                            <h3 class="table-title">Your Information</h3>
                        </div>
                        <div style="padding: 2rem;">
                            ${attendeeData.room ? `
                                <div style="margin-bottom: 1.5rem;">
                                    <h4 style="color: var(--primary); margin-bottom: 0.5rem;">
                                        <i class="fas fa-bed"></i> Room Details
                                    </h4>
                                    <p><strong>Room:</strong> ${attendeeData.room.number}</p>
                                    <p><strong>Description:</strong> ${attendeeData.room.description || 'No description available'}</p>
                                </div>
                            ` : '<p>No room assigned yet.</p>'}
                            
                            ${attendeeData.group && attendeeData.group.members && attendeeData.group.members.length > 0 ? `
                                <div style="margin-bottom: 1.5rem;">
                                    <h4 style="color: var(--primary); margin-bottom: 0.5rem;">
                                        <i class="fas fa-users"></i> Group Members
                                    </h4>
                                    <ul style="list-style: none; padding: 0;">
                                        ${attendeeData.group.members.map(member => `
                                            <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                                                ${Utils.escapeHtml(member.name)} (${Utils.escapeHtml(member.ref_number)})
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : '<p>No group members assigned.</p>'}
                        </div>
                    </div>
                </div>
            `;

            // Bind logout event
            document.getElementById('attendee-logout').addEventListener('click', () => {
                Auth.logout();
            });

        } catch (error) {
            console.error('Failed to load attendee view:', error);
            Utils.showAlert('Failed to load dashboard. Please try logging in again.', 'error');
            Auth.clearAllTokens();
            await this.showLoginView();
        }
    },

    /**
     * Load admin dashboard view
     */
    async loadAdminView() {
        this.currentView = 'admin';
        
        try {
            // Get admin data
            const attendeesData = await API.get('/admin/attendees');

            // Calculate stats
            const totalAttendees = attendeesData.length;
            const totalRevenue = attendeesData.reduce((sum, a) => sum + (a.payment_due || 0), 0);
            const pendingPayments = attendeesData.filter(a => (a.payment_due || 0) > 0).length;
            const roomsOccupied = attendeesData.filter(a => a.room).length;
            const occupancyRate = totalAttendees > 0 ? Math.round((roomsOccupied / totalAttendees) * 100) : 0;

            // For now, show a simple admin dashboard
            // In Phase 3, we'll load this from a template and component
            document.getElementById('app').innerHTML = `
                <div class="dashboard" style="background: var(--background); min-height: 100vh;">
                    <div class="dashboard-header">
                        <div>
                            <h1 class="dashboard-title">Admin Dashboard</h1>
                            <p style="color: var(--text-secondary); margin-top: 0.5rem;">Manage attendees, rooms, and groups</p>
                        </div>
                        <div class="dashboard-actions">
                            <button class="btn btn-primary" id="add-attendee-btn">
                                <i class="fas fa-plus"></i> Add Attendee
                            </button>
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
                            <div class="stat-value">${occupancyRate}%</div>
                            <div class="stat-label">Room Occupancy</div>
                        </div>
                    </div>

                    <div class="data-table">
                        <div class="table-header">
                            <h3 class="table-title">Attendees</h3>
                            <input type="search" class="search-box" id="search-attendees" placeholder="Search attendees...">
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
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${attendeesData.map(attendee => {
                                    const paymentDue = attendee.payment_due || 0;
                                    const statusBadge = paymentDue > 0 
                                        ? `<span class="badge badge-warning"><i class="fas fa-exclamation-triangle"></i> Payment Due</span>`
                                        : `<span class="badge badge-success"><i class="fas fa-check"></i> Paid</span>`;
                                        
                                    return `
                                        <tr>
                                            <td><strong>${Utils.escapeHtml(attendee.ref_number)}</strong></td>
                                            <td>${Utils.escapeHtml(attendee.name)}</td>
                                            <td>${attendee.room ? Utils.escapeHtml(attendee.room.number) : '<span class="badge badge-secondary">Unassigned</span>'}</td>
                                            <td><strong>${Utils.formatCurrency(paymentDue)}</strong></td>
                                            <td>${attendee.group ? Utils.escapeHtml(attendee.group.name) : '<span class="badge badge-secondary">No Group</span>'}</td>
                                            <td>${statusBadge}</td>
                                            <td>
                                                <div class="action-buttons">
                                                    <button class="btn btn-sm btn-primary edit-attendee" data-id="${attendee.id}">
                                                        <i class="fas fa-edit"></i> Edit
                                                    </button>
                                                    <button class="btn btn-sm btn-danger delete-attendee" data-id="${attendee.id}">
                                                        <i class="fas fa-trash"></i> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            // Bind admin dashboard events
            this.bindAdminDashboardEvents(attendeesData);

        } catch (error) {
            console.error('Failed to load admin view:', error);
            Utils.showAlert('Failed to load admin dashboard. Please try logging in again.', 'error');
            Auth.clearAllTokens();
            await this.showLoginView();
        }
    },

    /**
     * Bind admin dashboard events
     */
    bindAdminDashboardEvents(attendeesData) {
        // Logout event
        const logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Auth.logout();
            });
        }

        // Add attendee event
        const addBtn = document.getElementById('add-attendee-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                Utils.showAlert('Add attendee functionality will be implemented in Phase 3', 'warning');
            });
        }

        // Edit attendee events
        document.querySelectorAll('.edit-attendee').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                Utils.showAlert(`Edit attendee ${id} functionality will be implemented in Phase 3`, 'warning');
            });
        });

        // Delete attendee events
        document.querySelectorAll('.delete-attendee').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const attendee = attendeesData.find(a => a.id == id);
                
                if (!confirm(`Are you sure you want to delete ${attendee ? attendee.name : 'this attendee'}?`)) {
                    return;
                }

                try {
                    Utils.showLoading(btn);
                    await API.delete(`/admin/attendees/${id}`);
                    Utils.showAlert('Attendee deleted successfully', 'success');
                    // Reload the admin view
                    await this.loadAdminView();
                } catch (error) {
                    Utils.showAlert('Failed to delete attendee: ' + error.message, 'error');
                } finally {
                    Utils.hideLoading(btn);
                }
            });
        });

        // Search functionality
        const searchInput = document.getElementById('search-attendees');
        if (searchInput) {
            const debouncedSearch = Utils.debounce((query) => {
                // Simple client-side search for now
                const rows = document.querySelectorAll('.table tbody tr');
                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    const visible = text.includes(query.toLowerCase());
                    row.style.display = visible ? '' : 'none';
                });
            }, 300);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
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
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});