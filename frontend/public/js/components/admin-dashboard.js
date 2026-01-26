// frontend/public/js/components/admin-dashboard.js - Complete updated version with announcements
const AdminDashboard = {
    data: {
        attendees: [],
        rooms: [],
        groups: [],
        announcements: [],
        registrations: [],
        loginHistory: [],
        stats: {}
    },
    currentTab: 'attendees',
    
    /**
     * Initialize admin dashboard
     */
    async init() {
        try {
            await this.render();
            await this.loadAllData();
            this.bindEvents();
            this.setupTabNavigation();
            
            // Initialize email management with better error handling
            if (window.EmailManagement) {
                try {
                    await window.EmailManagement.init();
                    console.log('EmailManagement initialized successfully');
                } catch (error) {
                    console.error('EmailManagement initialization failed:', error);
                    // Don't fail the entire dashboard init, just log the error
                }
            } else {
                console.warn('EmailManagement component not available at dashboard init');
                // Try to initialize it later when needed
            }
        } catch (error) {
            console.error('Failed to initialize admin dashboard:', error);
            Utils.showAlert('Failed to load admin dashboard', 'error');
        }
    },

    /**
     * Render dashboard template
     */
    async render() {
        try {
            const content = await Utils.loadTemplate('templates/admin-dashboard.html');
            document.getElementById('app').innerHTML = content;
        } catch (error) {
            console.warn('Template loading failed, using fallback');
            this.renderFallback();
        }
    },

    /**
     * Fallback render if template fails (updated with announcements tab)
     */
    renderFallback() {
        document.getElementById('app').innerHTML = `
            <div class="dashboard">
                <div class="dashboard-header">
                    <div>
                        <h1 class="dashboard-title">Admin Dashboard</h1>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem;">Manage attendees, rooms, groups, and announcements</p>
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

                <div class="stats-grid" id="admin-stats">
                    <div class="stat-card">
                        <div class="stat-value" id="total-attendees">0</div>
                        <div class="stat-label">Total Attendees</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="total-revenue">£0</div>
                        <div class="stat-label">Total Revenue</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="pending-payments">0</div>
                        <div class="stat-label">Pending Payments</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" id="active-announcements">0</div>
                        <div class="stat-label">Active Announcements</div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="tab-navigation">
                    <button class="tab-btn active" data-tab="attendees">
                        <i class="fas fa-users"></i> Attendees
                    </button>
                    <button class="tab-btn" data-tab="announcements">
                        <i class="fas fa-bullhorn"></i> Announcements
                    </button>
                    <button class="tab-btn" data-tab="rooms">
                        <i class="fas fa-bed"></i> Rooms
                    </button>
                    <button class="tab-btn" data-tab="groups">
                        <i class="fas fa-layer-group"></i> Groups
                    </button>
                </div>

                <!-- Attendees Tab -->
                <div class="tab-content active" id="attendees-tab">
                    <div class="data-table">
                        <div class="table-header">
                            <h3 class="table-title">Attendees</h3>
                            <div style="display: flex; gap: 1rem; align-items: center;">
                                <input type="search" class="search-box" id="search-attendees" placeholder="Search attendees...">
                                <button class="btn btn-primary" id="add-attendee-btn-2">
                                    <i class="fas fa-plus"></i> Add Attendee
                                </button>
                            </div>
                        </div>
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Reference</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Room</th>
                                        <th>Payment Due</th>
                                        <th>Group</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="attendees-table-body">
                                    <tr>
                                        <td colspan="8" class="loading-placeholder">
                                            <i class="fas fa-spinner fa-spin"></i> Loading attendees...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Announcements Tab -->
                <div class="tab-content" id="announcements-tab">
                    <div class="data-table">
                        <div class="table-header">
                            <h3 class="table-title">Announcements</h3>
                            <div style="display: flex; gap: 1rem; align-items: center;">
                                <input type="search" class="search-box" id="search-announcements" placeholder="Search announcements...">
                                <button class="btn btn-primary" id="add-announcement-btn">
                                    <i class="fas fa-plus"></i> Add Announcement
                                </button>
                            </div>
                        </div>
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Priority</th>
                                        <th>Target</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="announcements-table-body">
                                    <tr>
                                        <td colspan="7" class="loading-placeholder">
                                            <i class="fas fa-spinner fa-spin"></i> Loading announcements...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Rooms Tab -->
                <div class="tab-content" id="rooms-tab">
                    <div class="data-table">
                        <div class="table-header">
                            <h3 class="table-title">Rooms</h3>
                            <div style="display: flex; gap: 1rem; align-items: center;">
                                <input type="search" class="search-box" id="search-rooms" placeholder="Search rooms...">
                                <button class="btn btn-primary" id="add-room-btn">
                                    <i class="fas fa-plus"></i> Add Room
                                </button>
                            </div>
                        </div>
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Room Number</th>
                                        <th>Description</th>
                                        <th>Occupancy</th>
                                        <th>Occupants</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="rooms-table-body">
                                    <tr>
                                        <td colspan="5" class="loading-placeholder">
                                            <i class="fas fa-spinner fa-spin"></i> Loading rooms...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Groups Tab -->
                <div class="tab-content" id="groups-tab">
                    <div class="data-table">
                        <div class="table-header">
                            <h3 class="table-title">Groups</h3>
                            <div style="display: flex; gap: 1rem; align-items: center;">
                                <input type="search" class="search-box" id="search-groups" placeholder="Search groups...">
                                <button class="btn btn-primary" id="add-group-btn">
                                    <i class="fas fa-plus"></i> Add Group
                                </button>
                            </div>
                        </div>
                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Group Name</th>
                                        <th>Member Count</th>
                                        <th>Members</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="groups-table-body">
                                    <tr>
                                        <td colspan="4" class="loading-placeholder">
                                            <i class="fas fa-spinner fa-spin"></i> Loading groups...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Track loading states per section
    loadingStates: {
        attendees: false,
        rooms: false,
        groups: false,
        announcements: false,
        registrations: false,
        loginHistory: false
    },

    // Track failed loads for retry
    failedLoads: new Set(),

    /**
     * Load all data from API (updated to include announcements)
     */
    async loadAllData() {
        this.failedLoads.clear();

        const results = await Promise.allSettled([
            this.loadAttendees(),
            this.loadRooms(),
            this.loadGroups(),
            this.loadAnnouncements(),
            this.loadRegistrations(),
            this.loadLoginHistory()
        ]);

        // Check for failures
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            const failedCount = failures.length;
            Utils.showAlert(
                `${failedCount} section${failedCount > 1 ? 's' : ''} failed to load. Click retry buttons to try again.`,
                'warning'
            );
        }

        this.calculateStats();
        this.updateAllDisplays();
    },

    /**
     * Load attendees data with loading state
     */
    async loadAttendees() {
        const tableBody = 'attendees-table-body';
        this.loadingStates.attendees = true;
        Utils.showSectionLoading(tableBody, 'Loading attendees...');

        try {
            const response = await API.get('/admin/attendees');
            this.data.attendees = response.data || response;
            this.loadingStates.attendees = false;
            this.failedLoads.delete('attendees');
            console.log('Loaded attendees:', this.data.attendees.length);
        } catch (error) {
            console.error('Failed to load attendees:', error);
            this.data.attendees = [];
            this.loadingStates.attendees = false;
            this.failedLoads.add('attendees');
            Utils.showSectionError(tableBody, 'Failed to load attendees', () => {
                this.loadAttendees().then(() => this.updateAttendeesDisplay());
            });
            throw error;
        }
    },

    /**
     * Load rooms data with loading state
     */
    async loadRooms() {
        const tableBody = 'rooms-table-body';
        this.loadingStates.rooms = true;
        Utils.showSectionLoading(tableBody, 'Loading rooms...');

        try {
            const response = await API.get('/admin/rooms');
            this.data.rooms = response.data || response;
            this.loadingStates.rooms = false;
            this.failedLoads.delete('rooms');
            console.log('Loaded rooms:', this.data.rooms.length);
        } catch (error) {
            console.error('Failed to load rooms:', error);
            this.data.rooms = [];
            this.loadingStates.rooms = false;
            this.failedLoads.add('rooms');
            Utils.showSectionError(tableBody, 'Failed to load rooms', () => {
                this.loadRooms().then(() => this.updateRoomsDisplay());
            });
            throw error;
        }
    },

    /**
     * Load groups data with loading state
     */
    async loadGroups() {
        const tableBody = 'groups-table-body';
        this.loadingStates.groups = true;
        Utils.showSectionLoading(tableBody, 'Loading groups...');

        try {
            const response = await API.get('/admin/groups');
            this.data.groups = response.data || response;
            this.loadingStates.groups = false;
            this.failedLoads.delete('groups');
            console.log('Loaded groups:', this.data.groups.length);
        } catch (error) {
            console.error('Failed to load groups:', error);
            this.data.groups = [];
            this.loadingStates.groups = false;
            this.failedLoads.add('groups');
            Utils.showSectionError(tableBody, 'Failed to load groups', () => {
                this.loadGroups().then(() => this.updateGroupsDisplay());
            });
            throw error;
        }
    },

    /**
     * Load announcements data with loading state
     */
    async loadAnnouncements() {
        const tableBody = 'announcements-table-body';
        this.loadingStates.announcements = true;
        Utils.showSectionLoading(tableBody, 'Loading announcements...');

        try {
            const response = await API.get('/admin/announcements');
            this.data.announcements = response.data || response;
            this.loadingStates.announcements = false;
            this.failedLoads.delete('announcements');
            console.log('Loaded announcements:', this.data.announcements.length);
        } catch (error) {
            console.error('Failed to load announcements:', error);
            this.data.announcements = [];
            this.loadingStates.announcements = false;
            this.failedLoads.add('announcements');
            Utils.showSectionError(tableBody, 'Failed to load announcements', () => {
                this.loadAnnouncements().then(() => this.updateAnnouncementsDisplay());
            });
            throw error;
        }
    },

    /**
     * Load registrations data with loading state
     */
    async loadRegistrations(status = 'pending') {
        const tableBody = 'registrations-table-body';
        this.loadingStates.registrations = true;
        Utils.showSectionLoading(tableBody, 'Loading registrations...');

        try {
            const url = status ? `/admin/registrations?status=${status}` : '/admin/registrations';
            const response = await API.get(url);
            this.data.registrations = response.data || response;
            this.loadingStates.registrations = false;
            this.failedLoads.delete('registrations');
            console.log('Loaded registrations:', this.data.registrations.length);
        } catch (error) {
            console.error('Failed to load registrations:', error);
            this.data.registrations = [];
            this.loadingStates.registrations = false;
            this.failedLoads.add('registrations');
            Utils.showSectionError(tableBody, 'Failed to load registrations', () => {
                this.loadRegistrations(status).then(() => this.updateRegistrationsDisplay());
            });
            throw error;
        }
    },

    /**
     * Load login history data with loading state
     */
    async loadLoginHistory() {
        const tableBody = 'login-history-body';
        this.loadingStates.loginHistory = true;

        try {
            const response = await API.get('/admin/reports/login-history');
            this.data.loginHistory = response.data || response;
            this.loadingStates.loginHistory = false;
            this.failedLoads.delete('loginHistory');
            console.log('Loaded login history:', this.data.loginHistory.length);
        } catch (error) {
            console.error('Failed to load login history:', error);
            this.data.loginHistory = [];
            this.loadingStates.loginHistory = false;
            this.failedLoads.add('loginHistory');
            // Login history is less critical, don't show error in table
            throw error;
        }
    },

    /**
     * Calculate dashboard statistics (updated with announcements and registrations)
     */
    calculateStats() {
        const attendees = this.data.attendees;
        const rooms = this.data.rooms;
        const announcements = this.data.announcements;
        const registrations = this.data.registrations;
        const loginHistory = this.data.loginHistory;

        this.data.stats = {
            totalAttendees: attendees.length,
            totalRevenue: attendees.reduce((sum, a) => sum + (a.payment_due || 0), 0),
            pendingPayments: attendees.filter(a => (a.payment_due || 0) > 0).length,
            roomsOccupied: attendees.filter(a => a.room).length,
            totalRooms: rooms.length,
            occupancyRate: rooms.length > 0 ? Math.round((attendees.filter(a => a.room).length / rooms.length) * 100) : 0,
            pendingRegistrations: registrations.filter(r => r.status === 'pending').length,
            totalRegistrations: registrations.length,
            activeAnnouncements: announcements.filter(a => a.is_active).length,
            totalAnnouncements: announcements.length,
            loginsToday: loginHistory.filter(r => {
                const dt = new Date(r.login_time);
                const today = new Date();
                return dt.toDateString() === today.toDateString();
            }).length
        };
    },

    /**
     * Update all displays with current data (updated to include announcements and registrations)
     */
    updateAllDisplays() {
        this.updateStatsDisplay();
        this.updateAttendeesDisplay();
        this.updateRegistrationsDisplay();
        this.updateAnnouncementsDisplay();
        this.updateRoomsDisplay();
        this.updateGroupsDisplay();
        this.updateLoginHistoryDisplay();
    },

    /**
     * Update statistics display (updated with announcements and registrations)
     */
    updateStatsDisplay() {
        const stats = this.data.stats;

        const totalAttendeesEl = document.getElementById('total-attendees');
        const totalRevenueEl = document.getElementById('total-revenue');
        const pendingPaymentsEl = document.getElementById('pending-payments');
        const pendingRegistrationsEl = document.getElementById('pending-registrations');
        const activeAnnouncementsEl = document.getElementById('active-announcements');
        const loginsTodayEl = document.getElementById('logins-today');

        if (totalAttendeesEl) totalAttendeesEl.textContent = stats.totalAttendees;
        if (totalRevenueEl) totalRevenueEl.textContent = Utils.formatCurrency(stats.totalRevenue);
        if (pendingPaymentsEl) pendingPaymentsEl.textContent = stats.pendingPayments;
        if (pendingRegistrationsEl) pendingRegistrationsEl.textContent = stats.pendingRegistrations;
        if (activeAnnouncementsEl) activeAnnouncementsEl.textContent = stats.activeAnnouncements;
        if (loginsTodayEl) loginsTodayEl.textContent = stats.loginsToday;
    },

    /**
     * Update attendees table display
     */
    updateAttendeesDisplay() {
        const tbody = document.getElementById('attendees-table-body');
        if (!tbody) return;

        if (this.data.attendees.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        No attendees found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.attendees.map(attendee => {
            const paymentDue = attendee.payment_due || 0;
            const statusBadge = paymentDue > 0 
                ? `<span class="badge badge-warning"><i class="fas fa-exclamation-triangle"></i> Payment Due</span>`
                : `<span class="badge badge-success"><i class="fas fa-check"></i> Paid</span>`;
                
            // Enhanced email display with status indicator
            const emailDisplay = attendee.email 
                ? `<div class="email-info">
                    <div class="email-address" style="font-size: 0.9rem; margin-bottom: 0.25rem;">${Utils.escapeHtml(attendee.email)}</div>
                    <span class="email-status" title="Email address provided">
                    <i class="fas fa-check-circle" style="color: var(--success); font-size: 0.8rem;"></i>
                    <span style="font-size: 0.8rem; color: var(--success);">Verified</span>
                    </span>
                </div>`
                : `<span class="no-email" style="color: var(--text-secondary); font-style: italic;">No email</span>`;
                
            return `
                <tr data-attendee-id="${attendee.id}">
                    <td style="text-align: center;">
                        <input type="checkbox" name="attendee-select" value="${attendee.id}">
                    </td>
                    <td><strong>${Utils.escapeHtml(attendee.ref_number)}</strong></td>
                    <td>${Utils.escapeHtml(attendee.name)}</td>
                    <td>${emailDisplay}</td>
                    <td>${attendee.room ? Utils.escapeHtml(attendee.room.number) : '<span class="badge badge-secondary">Unassigned</span>'}</td>
                    <td><strong>${Utils.formatCurrency(paymentDue)}</strong></td>
                    <td>${attendee.group ? Utils.escapeHtml(attendee.group.name) : '<span class="badge badge-secondary">No Group</span>'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="action-buttons" style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                            <button class="btn btn-sm btn-primary edit-attendee" data-id="${attendee.id}" title="Edit Attendee">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${attendee.email ? `
                            <button class="btn btn-sm btn-info email-attendee" 
                                    data-id="${attendee.id}" 
                                    data-email="${Utils.escapeHtml(attendee.email)}" 
                                    data-name="${Utils.escapeHtml(attendee.name)}" 
                                    title="Send Email to ${Utils.escapeHtml(attendee.name)}">
                                <i class="fas fa-envelope"></i>
                            </button>
                            ` : ''}
                            <button class="btn btn-sm btn-danger delete-attendee" data-id="${attendee.id}" title="Delete Attendee">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Update registrations table display
     */
    updateRegistrationsDisplay() {
        const tbody = document.getElementById('registrations-table-body');
        if (!tbody) return;

        if (this.data.registrations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        <i class="fas fa-clipboard-list" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        No registrations found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.registrations.map(reg => {
            const submittedDate = new Date(reg.submitted_at).toLocaleDateString();
            const memberCount = reg.member_count || 1;
            const totalAmount = reg.total_amount || 200;
            const paymentOption = reg.payment_option || 'full';

            // Parse family members if available
            let familyMembers = [];
            try {
                if (reg.family_members) {
                    familyMembers = JSON.parse(reg.family_members);
                }
            } catch (e) {
                console.warn('Failed to parse family members:', e);
            }

            // Status badge
            const statusBadges = {
                'pending': '<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending</span>',
                'approved': '<span class="badge badge-success"><i class="fas fa-check"></i> Approved</span>',
                'rejected': '<span class="badge badge-danger"><i class="fas fa-times"></i> Rejected</span>',
                'waitlist': '<span class="badge badge-info"><i class="fas fa-list"></i> Waitlist</span>'
            };
            const statusBadge = statusBadges[reg.status] || statusBadges['pending'];

            // Payment option badge
            const paymentBadges = {
                'full': '<span class="badge badge-success">Full Payment</span>',
                'installments': '<span class="badge badge-info">Installments</span>',
                'sponsorship': '<span class="badge badge-warning">Sponsorship</span>'
            };
            const paymentBadge = paymentBadges[paymentOption] || paymentBadges['full'];

            // Create member details tooltip
            const memberDetails = familyMembers.length > 0
                ? familyMembers.map(m => `${m.name} (${m.member_type})`).join(', ')
                : reg.name;

            return `
                <tr data-registration-id="${reg.id}">
                    <td><small>${submittedDate}</small></td>
                    <td><strong>${Utils.escapeHtml(reg.name)}</strong></td>
                    <td><small>${Utils.escapeHtml(reg.email)}</small></td>
                    <td><small>${reg.phone ? Utils.escapeHtml(reg.phone) : '-'}</small></td>
                    <td title="${Utils.escapeHtml(memberDetails)}">
                        <span class="badge badge-secondary">${memberCount} member${memberCount > 1 ? 's' : ''}</span>
                    </td>
                    <td><strong>${Utils.formatCurrency(totalAmount)}</strong></td>
                    <td>${paymentBadge}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="action-buttons" style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                            <button class="btn btn-sm btn-info view-registration" data-id="${reg.id}" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${reg.status === 'pending' ? `
                            <button class="btn btn-sm btn-success approve-registration" data-id="${reg.id}" title="Approve">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger reject-registration" data-id="${reg.id}" title="Reject">
                                <i class="fas fa-times"></i>
                            </button>
                            ` : ''}
                            <button class="btn btn-sm btn-danger delete-registration" data-id="${reg.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Update announcements table display
     */
    updateAnnouncementsDisplay() {
        const tbody = document.getElementById('announcements-table-body');
        if (!tbody) return;

        if (this.data.announcements.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        No announcements found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.announcements.map(announcement => {
            const typeBadge = this.getTypeBadge(announcement.type);
            const priorityBadge = this.getPriorityBadge(announcement.priority);
            const statusBadge = announcement.is_active 
                ? `<span class="badge badge-success"><i class="fas fa-eye"></i> Active</span>`
                : `<span class="badge badge-secondary"><i class="fas fa-eye-slash"></i> Inactive</span>`;
            const targetBadge = this.getTargetBadge(announcement.target_audience, announcement.target_groups);
            
            const createdDate = new Date(announcement.created_at).toLocaleDateString();
            const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();
            
            return `
                <tr data-announcement-id="${announcement.id}" ${isExpired ? 'style="opacity: 0.6;"' : ''}>
                    <td>
                        <div style="max-width: 200px;">
                            <strong>${Utils.escapeHtml(announcement.title)}</strong>
                            ${isExpired ? '<br><small style="color: var(--error);">Expired</small>' : ''}
                        </div>
                    </td>
                    <td>
                        <span class="badge ${typeBadge.class}">
                            <i class="${typeBadge.icon}"></i> ${typeBadge.text}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${priorityBadge.class}">
                            ${priorityBadge.text}
                        </span>
                    </td>
                    <td>
                        <span class="badge ${targetBadge.class}">
                            ${targetBadge.text}
                        </span>
                    </td>
                    <td>${statusBadge}</td>
                    <td>
                        <small>${createdDate}</small><br>
                        <small style="color: var(--text-secondary);">by ${Utils.escapeHtml(announcement.author_name)}</small>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary edit-announcement" data-id="${announcement.id}" title="Edit Announcement">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-secondary toggle-announcement" data-id="${announcement.id}" title="${announcement.is_active ? 'Deactivate' : 'Activate'}">
                                <i class="fas fa-${announcement.is_active ? 'eye-slash' : 'eye'}"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-announcement" data-id="${announcement.id}" title="Delete Announcement">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Update rooms table display
     */
    updateRoomsDisplay() {
        const tbody = document.getElementById('rooms-table-body');
        if (!tbody) return;

        if (this.data.rooms.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        No rooms found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.rooms.map(room => {
            const occupancy = room.occupant_count || 0;
            const occupancyBadge = occupancy === 0 
                ? `<span class="badge badge-secondary">Empty</span>`
                : `<span class="badge badge-success">${occupancy} occupied</span>`;
                
            const occupantsList = room.occupants && room.occupants.length > 0
                ? room.occupants.slice(0, 3).map(name => Utils.escapeHtml(name)).join(', ') + 
                  (room.occupants.length > 3 ? ` +${room.occupants.length - 3} more` : '')
                : '<span class="text-secondary">No occupants</span>';
                
            return `
                <tr data-room-id="${room.id}">
                    <td><strong>${Utils.escapeHtml(room.number)}</strong></td>
                    <td>${room.description ? Utils.escapeHtml(room.description) : '<span class="text-secondary">—</span>'}</td>
                    <td>${occupancyBadge}</td>
                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${occupantsList}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary edit-room" data-id="${room.id}" title="Edit Room">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-room" data-id="${room.id}" title="Delete Room" ${occupancy > 0 ? 'disabled' : ''}>
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Update groups table display
     */
    updateGroupsDisplay() {
        const tbody = document.getElementById('groups-table-body');
        if (!tbody) return;

        if (this.data.groups.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        No groups found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.groups.map(group => {
            const memberCount = group.member_count || 0;
            const totalOutstanding = group.financial?.totalOutstanding || 0;
            const membersWithPayments = group.financial?.membersWithPayments || 0;
            
            const membersList = group.members && group.members.length > 0
                ? group.members.slice(0, 3).map(member => Utils.escapeHtml(member.name)).join(', ') + 
                (group.members.length > 3 ? ` +${group.members.length - 3} more` : '')
                : '<span class="text-secondary">No members</span>';
                
            return `
                <tr data-group-id="${group.id}">
                    <td><strong>${Utils.escapeHtml(group.name)}</strong></td>
                    <td><span class="badge badge-secondary">${memberCount} members</span></td>
                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${membersList}</td>
                    <td>
                        <div style="text-align: right;">
                            <div style="font-weight: 600; color: ${totalOutstanding > 0 ? 'var(--warning)' : 'var(--success)'};">
                                ${Utils.formatCurrency(totalOutstanding)}
                            </div>
                            ${totalOutstanding > 0 ? `
                                <small style="color: var(--text-secondary);">
                                    ${membersWithPayments}/${memberCount} pending
                                </small>
                            ` : `
                                <small style="color: var(--success);">All paid</small>
                            `}
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary edit-group" data-id="${group.id}" title="Edit Group">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-group" data-id="${group.id}" title="Delete Group" ${memberCount > 0 ? 'disabled' : ''}>
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Update login history table display
     */
    updateLoginHistoryDisplay() {
        const tbody = document.getElementById('login-history-body');
        if (!tbody) return;

        if (this.data.loginHistory.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        No login history found
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = this.data.loginHistory.map(record => {
            const time = new Date(record.login_time).toLocaleString();
            return `
                <tr>
                    <td>${Utils.escapeHtml(record.user_id)}</td>
                    <td>${Utils.escapeHtml(record.user_type)}</td>
                    <td>${time}</td>
                </tr>`;
        }).join('');
    },

    /**
     * Set up tab navigation
     */
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                
                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update active tab content
                tabContents.forEach(content => content.classList.remove('active'));
                const targetContent = document.getElementById(`${tabName}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                this.currentTab = tabName;
            });
        });
    },

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // Logout button
        const logoutBtn = document.getElementById('admin-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    Auth.logout();
                }
            });
        }

        // Add buttons
        this.bindAddButtons();
        
        // Action buttons (edit/delete/email)
        this.bindActionButtons();
        
        // Search boxes
        this.bindSearchBoxes();

        // Email selection functionality
        this.bindEmailSelection();
    },

    bindEmailSelection() {
        let selectedAttendees = new Set();

        // Handle select all checkbox
        document.addEventListener('change', (e) => {
            if (e.target.id === 'select-all-attendees') {
                const checkboxes = document.querySelectorAll('input[name="attendee-select"]');
                checkboxes.forEach(cb => {
                    cb.checked = e.target.checked;
                    if (e.target.checked) {
                        selectedAttendees.add(cb.value);
                    } else {
                        selectedAttendees.delete(cb.value);
                    }
                });
                this.updateEmailSelectedButton(selectedAttendees);
            } else if (e.target.name === 'attendee-select') {
                if (e.target.checked) {
                    selectedAttendees.add(e.target.value);
                } else {
                    selectedAttendees.delete(e.target.value);
                }
                this.updateEmailSelectedButton(selectedAttendees);
            }
        });

        // Handle email selected button click
        document.addEventListener('click', (e) => {
            if (e.target.closest('#email-selected-btn')) {
                if (selectedAttendees.size > 0 && window.EmailManagement) {
                    EmailManagement.showBulkEmailModal();
                    // Pre-select individual attendees in the modal
                    setTimeout(() => {
                        const audienceSelect = document.getElementById('email-audience');
                        if (audienceSelect) {
                            audienceSelect.value = 'individuals';
                            audienceSelect.dispatchEvent(new Event('change'));
                            
                            // Check the selected attendees
                            selectedAttendees.forEach(id => {
                                const checkbox = document.querySelector(`input[name="target_attendees"][value="${id}"]`);
                                if (checkbox) checkbox.checked = true;
                            });
                        }
                    }, 100);
                }
            }
        });
    },

    updateEmailSelectedButton(selectedAttendees) {
        const btn = document.getElementById('email-selected-btn');
        if (btn) {
            btn.disabled = selectedAttendees.size === 0;
            btn.innerHTML = `<i class="fas fa-envelope"></i> Email Selected (${selectedAttendees.size})`;
        }
    },

    /**
     * Bind add buttons (updated with announcements)
     */
    bindAddButtons() {
        // Add attendee buttons
        document.querySelectorAll('#add-attendee-btn, #add-attendee-btn-2').forEach(btn => {
            btn.addEventListener('click', () => this.showAddAttendeeModal());
        });

        // NEW: Bulk upload button
        const bulkUploadBtn = document.getElementById('bulk-upload-btn');
        if (bulkUploadBtn) {
            bulkUploadBtn.addEventListener('click', () => this.showBulkUploadModal());
        }

        // Add announcement button
        const addAnnouncementBtn = document.getElementById('add-announcement-btn');
        if (addAnnouncementBtn) {
            addAnnouncementBtn.addEventListener('click', () => this.showAddAnnouncementModal());
        }

        // Add room button
        const addRoomBtn = document.getElementById('add-room-btn');
        if (addRoomBtn) {
            addRoomBtn.addEventListener('click', () => this.showAddRoomModal());
        }

        // Add group button
        const addGroupBtn = document.getElementById('add-group-btn');
        if (addGroupBtn) {
            addGroupBtn.addEventListener('click', () => this.showAddGroupModal());
        }
    },

    /**
     * Bind action buttons (updated with announcements)
     */
    bindActionButtons() {
    // Delegate event listeners for dynamically created buttons
        document.addEventListener('click', async (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const id = target.dataset.id;
            
            if (target.classList.contains('edit-attendee')) {
                await this.editAttendee(id);
            } else if (target.classList.contains('delete-attendee')) {
                await this.deleteAttendee(id);
            } else if (target.classList.contains('email-attendee')) {
                // Handle individual email button clicks
                const attendeeId = target.dataset.id;
                const attendeeEmail = target.dataset.email;
                const attendeeName = target.dataset.name;
                
                // Check if EmailManagement is available and initialize if needed
                if (window.EmailManagement) {
                    // Ensure EmailManagement is initialized
                    if (!window.EmailManagement.isInitialized) {
                        console.log('Initializing EmailManagement for email action...');
                        try {
                            await window.EmailManagement.init();
                        } catch (error) {
                            console.error('Failed to initialize EmailManagement:', error);
                            Utils.showAlert('Failed to initialize email system. Please refresh the page and try again.', 'error');
                            return;
                        }
                    }
                    
                    // Now show the email modal
                    window.EmailManagement.showIndividualEmailModal(attendeeId, attendeeEmail, attendeeName);
                } else {
                    // EmailManagement component not loaded at all
                    console.error('EmailManagement component not found');
                    
                    // Try to load it dynamically
                    try {
                        // Check if the script exists
                        const script = document.querySelector('script[src*="email-management.js"]');
                        if (!script) {
                            // Add the script dynamically
                            const newScript = document.createElement('script');
                            newScript.src = 'js/components/email-management.js';
                            document.body.appendChild(newScript);
                            
                            // Wait for it to load
                            await new Promise((resolve, reject) => {
                                newScript.onload = resolve;
                                newScript.onerror = reject;
                                setTimeout(reject, 5000); // 5 second timeout
                            });
                        }
                        
                        // Try again after loading
                        if (window.EmailManagement) {
                            await window.EmailManagement.init();
                            window.EmailManagement.showIndividualEmailModal(attendeeId, attendeeEmail, attendeeName);
                        } else {
                            throw new Error('EmailManagement still not available after loading');
                        }
                    } catch (loadError) {
                        console.error('Failed to load EmailManagement:', loadError);
                        Utils.showAlert('Email system is not available. Please refresh the page and try again.', 'error');
                    }
                }
            } else if (target.classList.contains('view-registration')) {
                await this.viewRegistration(id);
            } else if (target.classList.contains('approve-registration')) {
                await this.approveRegistration(id);
            } else if (target.classList.contains('reject-registration')) {
                await this.rejectRegistration(id);
            } else if (target.classList.contains('delete-registration')) {
                await this.deleteRegistration(id);
            } else if (target.classList.contains('edit-announcement')) {
                await this.editAnnouncement(id);
            } else if (target.classList.contains('toggle-announcement')) {
                await this.toggleAnnouncement(id);
            } else if (target.classList.contains('delete-announcement')) {
                await this.deleteAnnouncement(id);
            } else if (target.classList.contains('edit-room')) {
                await this.editRoom(id);
            } else if (target.classList.contains('delete-room')) {
                await this.deleteRoom(id);
            } else if (target.classList.contains('edit-group')) {
                await this.editGroup(id);
            } else if (target.classList.contains('delete-group')) {
                await this.deleteGroup(id);
            }
        });
    },

    /**
     * Bind search boxes (updated with announcements and registrations)
     */
    bindSearchBoxes() {
        const searchAttendees = document.getElementById('search-attendees');
        const searchAnnouncements = document.getElementById('search-announcements');
        const searchRegistrations = document.getElementById('search-registrations');
        const filterRegistrationsStatus = document.getElementById('filter-registrations-status');
        const searchRooms = document.getElementById('search-rooms');
        const searchGroups = document.getElementById('search-groups');

        if (searchAttendees) {
            searchAttendees.addEventListener('input', Utils.debounce((e) => {
                this.filterTable('attendees-table-body', e.target.value);
            }, 300));
        }

        if (searchAnnouncements) {
            searchAnnouncements.addEventListener('input', Utils.debounce((e) => {
                this.filterTable('announcements-table-body', e.target.value);
            }, 300));
        }

        if (searchRegistrations) {
            searchRegistrations.addEventListener('input', Utils.debounce((e) => {
                this.filterTable('registrations-table-body', e.target.value);
            }, 300));
        }

        if (filterRegistrationsStatus) {
            filterRegistrationsStatus.addEventListener('change', async (e) => {
                await this.loadRegistrations(e.target.value);
                this.updateRegistrationsDisplay();
            });
        }

        if (searchRooms) {
            searchRooms.addEventListener('input', Utils.debounce((e) => {
                this.filterTable('rooms-table-body', e.target.value);
            }, 300));
        }

        if (searchGroups) {
            searchGroups.addEventListener('input', Utils.debounce((e) => {
                this.filterTable('groups-table-body', e.target.value);
            }, 300));
        }
    },

    /**
     * Filter table rows based on search query
     */
    filterTable(tableBodyId, query) {
        const tbody = document.getElementById(tableBodyId);
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr[data-attendee-id], tr[data-announcement-id], tr[data-registration-id], tr[data-room-id], tr[data-group-id]');
        const searchTerm = query.toLowerCase().trim();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const visible = !searchTerm || text.includes(searchTerm);
            row.style.display = visible ? '' : 'none';
        });
    },

    /**
     * Modal management methods (updated with announcements)
     */
    async showAddAttendeeModal() {
        if (window.AttendeeManagement) {
            await window.AttendeeManagement.showModal(null, this.data.rooms, this.data.groups);
        } else {
            Utils.showAlert('Attendee management component not loaded', 'error');
        }
    },

    async showAddAnnouncementModal() {
        if (window.AnnouncementManagement) {
            await window.AnnouncementManagement.showModal(null, this.data.groups);
        } else {
            Utils.showAlert('Announcement management component not loaded', 'error');
        }
    },

    async showAddRoomModal() {
        if (window.RoomManagement) {
            await window.RoomManagement.showModal();
        } else {
            Utils.showAlert('Room management component not loaded', 'error');
        }
    },

    async showAddGroupModal() {
        if (window.GroupManagement) {
            await window.GroupManagement.showModal();
        } else {
            Utils.showAlert('Group management component not loaded', 'error');
        }
    },

   async showBulkUploadModal() {
            // Debug: Check what's available
        console.log('Checking BulkUpload component...');
        console.log('window.BulkUpload exists:', !!window.BulkUpload);
        console.log('Available components:', window.ComponentChecker?.getAvailableComponents());
        
        // Try to wait for component if not immediately available
        try {
            let bulkUpload = window.BulkUpload;
            
            if (!bulkUpload) {
                console.log('BulkUpload not immediately available, waiting...');
                // Try to wait for it to load
                for (let i = 0; i < 10; i++) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    if (window.BulkUpload) {
                        bulkUpload = window.BulkUpload;
                        break;
                    }
                }
            }
            
            if (bulkUpload && typeof bulkUpload.showModal === 'function') {
                console.log('BulkUpload component found, showing modal...');
                await bulkUpload.showModal(this.data.rooms, this.data.groups);
            } else {
                console.error('BulkUpload component not properly loaded');
                // Fallback: Show a simple file upload
                this.showSimpleBulkUpload();
            }
        } catch (error) {
            console.error('Error showing bulk upload modal:', error);
            Utils.showAlert('Error loading bulk upload: ' + error.message, 'error');
        }
    },

    /**
     * Edit methods with loading states
     */
    async editAttendee(id) {
        Utils.showGlobalLoading('Loading attendee details...');
        try {
            const attendee = await API.get(`/admin/attendees/${id}`);
            Utils.hideGlobalLoading();
            if (window.AttendeeManagement) {
                await window.AttendeeManagement.showModal(attendee, this.data.rooms, this.data.groups);
            } else {
                Utils.showAlert('Attendee management component not loaded', 'error');
            }
        } catch (error) {
            Utils.hideGlobalLoading();
            Utils.showAlert('Failed to load attendee details: ' + error.message, 'error');
        }
    },

    async editAnnouncement(id) {
        Utils.showGlobalLoading('Loading announcement details...');
        try {
            const announcement = await API.get(`/admin/announcements/${id}`);
            Utils.hideGlobalLoading();
            if (window.AnnouncementManagement) {
                await window.AnnouncementManagement.showModal(announcement, this.data.groups);
            } else {
                Utils.showAlert('Announcement management component not loaded', 'error');
            }
        } catch (error) {
            Utils.hideGlobalLoading();
            Utils.showAlert('Failed to load announcement details: ' + error.message, 'error');
        }
    },

    async editRoom(id) {
        try {
            const room = this.data.rooms.find(r => r.id == id);
            if (room && window.RoomManagement) {
                await window.RoomManagement.showModal(room);
            } else {
                Utils.showAlert('Room management component not loaded', 'error');
            }
        } catch (error) {
            Utils.showAlert('Failed to load room details: ' + error.message, 'error');
        }
    },

    async editGroup(id) {
        try {
            const group = this.data.groups.find(g => g.id == id);
            if (group && window.GroupManagement) {
                await window.GroupManagement.showModal(group);
            } else {
                Utils.showAlert('Group management component not loaded', 'error');
            }
        } catch (error) {
            Utils.showAlert('Failed to load group details: ' + error.message, 'error');
        }
    },

    /**
     * Delete methods with loading states
     */
    async deleteAttendee(id) {
        const attendee = this.data.attendees.find(a => a.id == id);
        if (!attendee) return;

        if (!confirm(`Are you sure you want to delete ${attendee.name}? This action cannot be undone.`)) {
            return;
        }

        Utils.showGlobalLoading('Deleting attendee...');
        try {
            await API.delete(`/admin/attendees/${id}`);
            Utils.hideGlobalLoading();
            Utils.showAlert('Attendee deleted successfully', 'success');
            await this.refresh();
        } catch (error) {
            Utils.hideGlobalLoading();
            Utils.showAlert('Failed to delete attendee: ' + error.message, 'error');
        }
    },

    async toggleAnnouncement(id) {
        const announcement = this.data.announcements.find(a => a.id == id);
        if (!announcement) return;

        const newStatus = !announcement.is_active;
        const action = newStatus ? 'Activating' : 'Deactivating';
        Utils.showGlobalLoading(`${action} announcement...`);

        try {
            await API.put(`/admin/announcements/${id}`, { is_active: newStatus });
            Utils.hideGlobalLoading();
            Utils.showAlert(`Announcement ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
            await this.refresh();
        } catch (error) {
            Utils.hideGlobalLoading();
            Utils.showAlert('Failed to toggle announcement: ' + error.message, 'error');
        }
    },

    async deleteAnnouncement(id) {
        const announcement = this.data.announcements.find(a => a.id == id);
        if (!announcement) return;

        if (!confirm(`Are you sure you want to delete "${announcement.title}"? This action cannot be undone.`)) {
            return;
        }

        Utils.showGlobalLoading('Deleting announcement...');
        try {
            await API.delete(`/admin/announcements/${id}`);
            Utils.hideGlobalLoading();
            Utils.showAlert('Announcement deleted successfully', 'success');
            await this.refresh();
        } catch (error) {
            Utils.hideGlobalLoading();
            Utils.showAlert('Failed to delete announcement: ' + error.message, 'error');
        }
    },

    async deleteRoom(id) {
        const room = this.data.rooms.find(r => r.id == id);
        if (!room) return;

        if (room.occupant_count > 0) {
            Utils.showAlert('Cannot delete room with occupants. Please reassign attendees first.', 'error');
            return;
        }

        if (!confirm(`Are you sure you want to delete room ${room.number}? This action cannot be undone.`)) {
            return;
        }

        Utils.showGlobalLoading('Deleting room...');
        try {
            await API.delete(`/admin/rooms/${id}`);
            Utils.hideGlobalLoading();
            Utils.showAlert('Room deleted successfully', 'success');
            await this.refresh();
        } catch (error) {
            Utils.hideGlobalLoading();
            Utils.showAlert('Failed to delete room: ' + error.message, 'error');
        }
    },

    async deleteGroup(id) {
        const group = this.data.groups.find(g => g.id == id);
        if (!group) return;

        if (group.member_count > 0) {
            Utils.showAlert('Cannot delete group with members. Please reassign attendees first.', 'error');
            return;
        }

        if (!confirm(`Are you sure you want to delete group ${group.name}? This action cannot be undone.`)) {
            return;
        }

        Utils.showGlobalLoading('Deleting group...');
        try {
            await API.delete(`/admin/groups/${id}`);
            Utils.hideGlobalLoading();
            Utils.showAlert('Group deleted successfully', 'success');
            await this.refresh();
        } catch (error) {
            Utils.hideGlobalLoading();
            Utils.showAlert('Failed to delete group: ' + error.message, 'error');
        }
    },

    /**
     * View registration details in a modal
     */
    async viewRegistration(id) {
        const registration = this.data.registrations.find(r => r.id == id);
        if (!registration) return;

        // Parse family members
        let familyMembers = [];
        try {
            if (registration.family_members) {
                familyMembers = JSON.parse(registration.family_members);
            }
        } catch (e) {
            console.warn('Failed to parse family members:', e);
        }

        const membersHtml = familyMembers.length > 0
            ? familyMembers.map(m => `
                <tr>
                    <td>${Utils.escapeHtml(m.name)}</td>
                    <td>${m.date_of_birth || '-'}</td>
                    <td><span class="badge badge-${m.member_type === 'adult' ? 'primary' : m.member_type === 'child' ? 'info' : 'secondary'}">${m.member_type}</span></td>
                    <td>${Utils.formatCurrency(m.price || 0)}</td>
                    <td>${m.dietary || '-'}</td>
                </tr>
            `).join('')
            : `<tr><td colspan="5" style="text-align: center;">No family member details available</td></tr>`;

        const modalHtml = `
            <div class="modal-overlay" id="registration-detail-modal">
                <div class="modal" style="max-width: 700px;">
                    <div class="modal-header">
                        <h2>Registration Details</h2>
                        <button class="modal-close" onclick="document.getElementById('registration-detail-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-section">
                            <h4>Contact Information</h4>
                            <div class="detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div><strong>Name:</strong> ${Utils.escapeHtml(registration.name)}</div>
                                <div><strong>Email:</strong> ${Utils.escapeHtml(registration.email)}</div>
                                <div><strong>Phone:</strong> ${registration.phone || '-'}</div>
                                <div><strong>Emergency Contact:</strong> ${registration.emergency_contact || '-'}</div>
                            </div>
                        </div>
                        <div class="detail-section" style="margin-top: 1.5rem;">
                            <h4>Family Members (${familyMembers.length || 1})</h4>
                            <table class="table" style="margin-top: 0.5rem;">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>DOB</th>
                                        <th>Type</th>
                                        <th>Price</th>
                                        <th>Dietary</th>
                                    </tr>
                                </thead>
                                <tbody>${membersHtml}</tbody>
                            </table>
                        </div>
                        <div class="detail-section" style="margin-top: 1.5rem;">
                            <h4>Payment & Status</h4>
                            <div class="detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div><strong>Total Amount:</strong> ${Utils.formatCurrency(registration.total_amount || 200)}</div>
                                <div><strong>Payment Option:</strong> ${registration.payment_option || 'full'}</div>
                                <div><strong>Status:</strong> ${registration.status}</div>
                                <div><strong>Submitted:</strong> ${new Date(registration.submitted_at).toLocaleString()}</div>
                            </div>
                        </div>
                        ${registration.special_requests ? `
                        <div class="detail-section" style="margin-top: 1.5rem;">
                            <h4>Special Requests</h4>
                            <p>${Utils.escapeHtml(registration.special_requests)}</p>
                        </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        ${registration.status === 'pending' ? `
                        <button class="btn btn-success" onclick="AdminDashboard.approveRegistration(${registration.id}); document.getElementById('registration-detail-modal').remove();">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-danger" onclick="AdminDashboard.rejectRegistration(${registration.id}); document.getElementById('registration-detail-modal').remove();">
                            <i class="fas fa-times"></i> Reject
                        </button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="document.getElementById('registration-detail-modal').remove();">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('registration-detail-modal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Approve a registration
     */
    async approveRegistration(id) {
        const registration = this.data.registrations.find(r => r.id == id);
        if (!registration) return;

        // Parse member count for confirmation
        const memberCount = registration.member_count || 1;
        if (!confirm(`Approve registration for ${registration.name}?\n\nThis will create ${memberCount} attendee account(s) and send login credentials to ${registration.email}.`)) {
            return;
        }

        Utils.showGlobalLoading('Approving registration and creating accounts...');
        try {
            const result = await API.put(`/admin/registrations/${id}`, { action: 'approve' });
            Utils.hideGlobalLoading();

            // Show credentials for all created attendees
            if (result.attendees && result.attendees.length > 0) {
                this.showCredentialsModal(result.attendees, registration.email);
            } else {
                Utils.showAlert('Registration approved successfully', 'success');
            }

            await this.loadRegistrations(document.getElementById('filter-registrations-status')?.value || 'pending');
            await this.loadAttendees();
            this.updateRegistrationsDisplay();
            this.updateAttendeesDisplay();
            this.calculateStats();
            this.updateStatsDisplay();
        } catch (error) {
            Utils.hideGlobalLoading();
            Utils.showAlert('Failed to approve registration: ' + error.message, 'error');
        }
    },

    /**
     * Show modal with created credentials
     */
    showCredentialsModal(attendees, email) {
        const credentialsRows = attendees.map((a, i) => `
            <tr ${i === 0 ? 'style="background: rgba(102, 126, 234, 0.1);"' : ''}>
                <td style="padding: 0.75rem;">${Utils.escapeHtml(a.name)}${i === 0 ? ' <span class="badge badge-primary">Primary</span>' : ''}</td>
                <td style="padding: 0.75rem; font-family: monospace; font-weight: bold;">${a.ref_number}</td>
                <td style="padding: 0.75rem; font-family: monospace; color: var(--warning);">${a.temp_password}</td>
                <td style="padding: 0.75rem; text-align: right;">${a.payment_due === 0 ? '<span style="color: var(--success);">FREE</span>' : Utils.formatCurrency(a.payment_due)}</td>
            </tr>
        `).join('');

        const modalHtml = `
            <div class="modal-overlay" id="credentials-modal">
                <div class="modal" style="max-width: 650px;">
                    <div class="modal-header" style="background: var(--gradient-primary); color: white;">
                        <h2 style="color: white; margin: 0;"><i class="fas fa-check-circle"></i> Registration Approved!</h2>
                        <button class="modal-close" onclick="document.getElementById('credentials-modal').remove()" style="color: white;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-success" style="margin-bottom: 1rem;">
                            <i class="fas fa-envelope"></i> Credentials have been emailed to <strong>${Utils.escapeHtml(email)}</strong>
                        </div>

                        <h4 style="margin: 0 0 1rem 0;">Created ${attendees.length} Attendee Account${attendees.length > 1 ? 's' : ''}</h4>

                        <div class="table-container">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Reference #</th>
                                        <th>Password</th>
                                        <th style="text-align: right;">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>${credentialsRows}</tbody>
                            </table>
                        </div>

                        <div class="alert alert-warning" style="margin-top: 1rem;">
                            <i class="fas fa-info-circle"></i> Each family member can log in with their own Reference Number and Password.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="document.getElementById('credentials-modal').remove();">
                            <i class="fas fa-check"></i> Done
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('credentials-modal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Reject a registration
     */
    async rejectRegistration(id) {
        const registration = this.data.registrations.find(r => r.id == id);
        if (!registration) return;

        if (!confirm(`Reject registration for ${registration.name}?`)) {
            return;
        }

        Utils.showGlobalLoading('Rejecting registration...');
        try {
            await API.put(`/admin/registrations/${id}`, { action: 'reject' });
            Utils.hideGlobalLoading();
            Utils.showAlert('Registration rejected', 'success');
            await this.loadRegistrations(document.getElementById('filter-registrations-status')?.value || 'pending');
            this.updateRegistrationsDisplay();
            this.calculateStats();
            this.updateStatsDisplay();
        } catch (error) {
            Utils.hideGlobalLoading();
            Utils.showAlert('Failed to reject registration: ' + error.message, 'error');
        }
    },

    /**
     * Delete a registration
     */
    async deleteRegistration(id) {
        const registration = this.data.registrations.find(r => r.id == id);
        if (!registration) return;

        if (!confirm(`Are you sure you want to delete registration for ${registration.name}? This action cannot be undone.`)) {
            return;
        }

        Utils.showGlobalLoading('Deleting registration...');
        try {
            await API.delete(`/admin/registrations/${id}`);
            Utils.hideGlobalLoading();
            Utils.showAlert('Registration deleted successfully', 'success');
            await this.loadRegistrations(document.getElementById('filter-registrations-status')?.value || 'pending');
            this.updateRegistrationsDisplay();
            this.calculateStats();
            this.updateStatsDisplay();
        } catch (error) {
            Utils.hideGlobalLoading();
            Utils.showAlert('Failed to delete registration: ' + error.message, 'error');
        }
    },

    /**
     * Utility methods for announcement badges
     */
    getTypeBadge(type) {
        const badges = {
            'general': { text: 'General', class: 'badge-secondary', icon: 'fas fa-info-circle' },
            'urgent': { text: 'Urgent', class: 'badge-warning', icon: 'fas fa-exclamation-triangle' },
            'event': { text: 'Event', class: 'badge-primary', icon: 'fas fa-calendar' },
            'reminder': { text: 'Reminder', class: 'badge-success', icon: 'fas fa-clock' }
        };
        return badges[type] || badges['general'];
    },

    getPriorityBadge(priority) {
        if (priority >= 4) {
            return { text: 'High', class: 'badge-warning' };
        } else if (priority >= 3) {
            return { text: 'Normal', class: 'badge-secondary' };
        } else {
            return { text: 'Low', class: 'badge-secondary' };
        }
    },

    getTargetBadge(audience, targetGroups) {
        switch (audience) {
            case 'all':
                return { text: 'All Attendees', class: 'badge-primary' };
            case 'vip':
                return { text: 'VIP Only', class: 'badge-warning' };
            case 'groups':
                const groupCount = targetGroups ? targetGroups.length : 0;
                return { text: `${groupCount} Group${groupCount !== 1 ? 's' : ''}`, class: 'badge-secondary' };
            default:
                return { text: 'Unknown', class: 'badge-secondary' };
        }
    },

    /**
     * Refresh dashboard data with loading feedback
     */
    async refresh() {
        Utils.showGlobalLoading('Refreshing data...');
        try {
            await this.loadAllData();
            Utils.hideGlobalLoading();

            // Only show success if no sections failed
            if (this.failedLoads.size === 0) {
                Utils.showAlert('Data refreshed successfully', 'success');
            }
        } catch (error) {
            Utils.hideGlobalLoading();
            Utils.showAlert('Failed to refresh data', 'error');
        }
    },

    /**
     * Retry all failed loads
     */
    async retryFailedLoads() {
        if (this.failedLoads.size === 0) return;

        const toRetry = [...this.failedLoads];
        Utils.showGlobalLoading(`Retrying ${toRetry.length} failed section(s)...`);

        const retryPromises = toRetry.map(async (section) => {
            switch (section) {
                case 'attendees':
                    await this.loadAttendees();
                    this.updateAttendeesDisplay();
                    break;
                case 'rooms':
                    await this.loadRooms();
                    this.updateRoomsDisplay();
                    break;
                case 'groups':
                    await this.loadGroups();
                    this.updateGroupsDisplay();
                    break;
                case 'announcements':
                    await this.loadAnnouncements();
                    this.updateAnnouncementsDisplay();
                    break;
                case 'registrations':
                    await this.loadRegistrations();
                    this.updateRegistrationsDisplay();
                    break;
                case 'loginHistory':
                    await this.loadLoginHistory();
                    this.updateLoginHistoryDisplay();
                    break;
            }
        });

        await Promise.allSettled(retryPromises);
        Utils.hideGlobalLoading();

        this.calculateStats();
        this.updateStatsDisplay();

        if (this.failedLoads.size === 0) {
            Utils.showAlert('All sections loaded successfully', 'success');
        } else {
            Utils.showAlert(`${this.failedLoads.size} section(s) still failed to load`, 'warning');
        }
    }
};

// Make component globally available
window.AdminDashboard = AdminDashboard;
