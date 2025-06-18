// frontend/public/js/components/admin-dashboard.js - Complete updated version with announcements
const AdminDashboard = {
    data: {
        attendees: [],
        rooms: [],
        groups: [],
        announcements: [],
        stats: {}
    },
    currentTab: 'dashboard',
    
    /**
     * Initialize admin dashboard
     */
    async init() {
        try {
            await this.render();
            await this.loadAllData();
            this.bindEvents();
            this.setupSidebarNavigation();
            
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
            <div class="dashboard-container">
                <nav class="sidebar">
                    <ul class="sidebar-menu">
                        <li class="sidebar-item active" data-tab="dashboard"><i class="fas fa-home"></i> Dashboard</li>
                        <li class="sidebar-item" data-tab="attendees"><i class="fas fa-users"></i> Attendees</li>
                        <li class="sidebar-item" data-tab="rooms"><i class="fas fa-door-open"></i> Room Management</li>
                        <li class="sidebar-item" data-tab="groups"><i class="fas fa-user-friends"></i> Group Management</li>
                        <li class="sidebar-item" data-tab="announcements"><i class="fas fa-bullhorn"></i> Announcements</li>
                        <li class="sidebar-item" data-tab="emails"><i class="fas fa-envelope"></i> Email Management</li>
                        <li class="sidebar-item" data-tab="analytics"><i class="fas fa-chart-line"></i> Analytics</li>
                    </ul>
                </nav>
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
                        <div class="stat-icon icon-purple"><i class="fas fa-users"></i></div>
                        <div class="stat-content">
                            <div class="stat-value" id="total-attendees">0</div>
                            <div class="stat-label">Total Attendees</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon icon-purple"><i class="fas fa-pound-sign"></i></div>
                        <div class="stat-content">
                            <div class="stat-value" id="total-revenue">£0</div>
                            <div class="stat-label">Total Revenue</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon icon-orange"><i class="fas fa-hourglass-half"></i></div>
                        <div class="stat-content">
                            <div class="stat-value" id="pending-payments">0</div>
                            <div class="stat-label">Pending Payments</div>
                            <div class="stat-trend" id="pending-payments-trend"></div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon icon-green"><i class="fas fa-bullhorn"></i></div>
                        <div class="stat-content">
                            <div class="stat-value" id="active-announcements">0</div>
                            <div class="stat-label">Active Announcements</div>
                            <div class="stat-trend" id="active-announcements-trend"></div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar Navigation -->
                <nav class="sidebar">
                    <ul class="sidebar-menu">
                        <li class="sidebar-item active" data-tab="dashboard"><i class="fas fa-home"></i> Dashboard</li>
                        <li class="sidebar-item" data-tab="attendees"><i class="fas fa-users"></i> Attendees</li>
                        <li class="sidebar-item" data-tab="rooms"><i class="fas fa-door-open"></i> Room Management</li>
                        <li class="sidebar-item" data-tab="groups"><i class="fas fa-user-friends"></i> Group Management</li>
                        <li class="sidebar-item" data-tab="announcements"><i class="fas fa-bullhorn"></i> Announcements</li>
                        <li class="sidebar-item" data-tab="emails"><i class="fas fa-envelope"></i> Email Management</li>
                        <li class="sidebar-item" data-tab="analytics"><i class="fas fa-chart-line"></i> Analytics</li>
                    </ul>
                </nav>

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

    /**
     * Load all data from API (updated to include announcements)
     */
    async loadAllData() {
        try {
            await Promise.all([
                this.loadAttendees(),
                this.loadRooms(),
                this.loadGroups(),
                this.loadAnnouncements()
            ]);
            
            this.calculateStats();
            this.updateAllDisplays();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            Utils.showAlert('Failed to load some data. Please refresh the page.', 'error');
        }
    },

    /**
     * Load attendees data
     */
    async loadAttendees() {
        try {
            this.data.attendees = await API.get('/admin/attendees');
            console.log('Loaded attendees:', this.data.attendees.length);
        } catch (error) {
            console.error('Failed to load attendees:', error);
            this.data.attendees = [];
        }
    },

    /**
     * Load rooms data
     */
    async loadRooms() {
        try {
            this.data.rooms = await API.get('/admin/rooms');
            console.log('Loaded rooms:', this.data.rooms.length);
        } catch (error) {
            console.error('Failed to load rooms:', error);
            this.data.rooms = [];
        }
    },

    /**
     * Load groups data
     */
    async loadGroups() {
        try {
            this.data.groups = await API.get('/admin/groups');
            console.log('Loaded groups:', this.data.groups.length);
        } catch (error) {
            console.error('Failed to load groups:', error);
            this.data.groups = [];
        }
    },

    /**
     * Load announcements data
     */
    async loadAnnouncements() {
        try {
            this.data.announcements = await API.get('/admin/announcements');
            console.log('Loaded announcements:', this.data.announcements.length);
        } catch (error) {
            console.error('Failed to load announcements:', error);
            this.data.announcements = [];
        }
    },

    /**
     * Calculate dashboard statistics (updated with announcements)
     */
    calculateStats() {
        const attendees = this.data.attendees;
        const rooms = this.data.rooms;
        const announcements = this.data.announcements;
        
        this.data.stats = {
            totalAttendees: attendees.length,
            totalRevenue: attendees.reduce((sum, a) => sum + (a.payment_due || 0), 0),
            pendingPayments: attendees.filter(a => (a.payment_due || 0) > 0).length,
            roomsOccupied: attendees.filter(a => a.room).length,
            totalRooms: rooms.length,
            occupancyRate: rooms.length > 0 ? Math.round((attendees.filter(a => a.room).length / rooms.length) * 100) : 0,
            activeAnnouncements: announcements.filter(a => a.is_active).length,
            totalAnnouncements: announcements.length
        };
    },

    /**
     * Update all displays with current data (updated to include announcements)
     */
    updateAllDisplays() {
        this.updateStatsDisplay();
        this.updateAttendeesDisplay();
        this.updateAnnouncementsDisplay();
        this.updateRoomsDisplay();
        this.updateGroupsDisplay();
    },

    /**
     * Update statistics display (updated with announcements)
     */
    updateStatsDisplay() {
        const stats = this.data.stats;
        
        const totalAttendeesEl = document.getElementById('total-attendees');
        const totalRevenueEl = document.getElementById('total-revenue');
        const pendingPaymentsEl = document.getElementById('pending-payments');
        const activeAnnouncementsEl = document.getElementById('active-announcements');
        const pendingTrendEl = document.getElementById('pending-payments-trend');
        const activeTrendEl = document.getElementById('active-announcements-trend');

        if (totalAttendeesEl) totalAttendeesEl.textContent = stats.totalAttendees;
        if (totalRevenueEl) totalRevenueEl.textContent = Utils.formatCurrency(stats.totalRevenue);
        if (pendingPaymentsEl) pendingPaymentsEl.textContent = stats.pendingPayments;
        if (activeAnnouncementsEl) activeAnnouncementsEl.textContent = stats.activeAnnouncements;

        const pendingPct = stats.totalAttendees > 0 ? Math.round((stats.pendingPayments / stats.totalAttendees) * 100) : 0;
        const activePct = stats.totalAnnouncements > 0 ? Math.round((stats.activeAnnouncements / stats.totalAnnouncements) * 100) : 0;

        if (pendingTrendEl) pendingTrendEl.innerHTML = `<i class="fas fa-arrow-up"></i> ${pendingPct}%`;
        if (activeTrendEl) activeTrendEl.innerHTML = `<i class="fas fa-arrow-up"></i> ${activePct}%`;
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
                ? `<span class="badge badge-due"><i class="fas fa-exclamation-triangle"></i> Due</span>`
                : `<span class="badge badge-paid"><i class="fas fa-check"></i> Paid</span>`;
                
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
                    <td><div class="avatar">${Utils.getInitials(attendee.name)}</div>${Utils.escapeHtml(attendee.name)}</td>
                    <td>${emailDisplay}</td>
                    <td>${attendee.room ? Utils.escapeHtml(attendee.room.number) : '<span class="badge badge-secondary">Unassigned</span>'}</td>
                    <td><strong>${Utils.formatCurrency(paymentDue)}</strong></td>
                    <td>${attendee.group ? Utils.escapeHtml(attendee.group.name) : '<span class="badge badge-secondary">No Group</span>'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="action-buttons" style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                            <button class="btn btn-sm btn-outline-primary edit-attendee" data-id="${attendee.id}" title="Edit Attendee">
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
                            <button class="btn btn-sm btn-outline-primary edit-announcement" data-id="${announcement.id}" title="Edit Announcement">
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
                            <button class="btn btn-sm btn-outline-primary edit-room" data-id="${room.id}" title="Edit Room">
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
                            <button class="btn btn-sm btn-outline-primary edit-group" data-id="${group.id}" title="Edit Group">
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
     * Set up sidebar navigation
     */
    setupSidebarNavigation() {
        const menuItems = document.querySelectorAll('.sidebar-item');
        const sections = document.querySelectorAll('.tab-content');

        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabName = item.dataset.tab;

                menuItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                sections.forEach(sec => sec.classList.remove('active'));
                const target = document.getElementById(`${tabName}-tab`);
                if (target) {
                    target.classList.add('active');
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
     * Bind search boxes (updated with announcements)
     */
    bindSearchBoxes() {
        const searchAttendees = document.getElementById('search-attendees');
        const searchAnnouncements = document.getElementById('search-announcements');
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

        const rows = tbody.querySelectorAll('tr[data-attendee-id], tr[data-announcement-id], tr[data-room-id], tr[data-group-id]');
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
     * Edit methods
     */
    async editAttendee(id) {
        try {
            const attendee = await API.get(`/admin/attendees/${id}`);
            if (window.AttendeeManagement) {
                await window.AttendeeManagement.showModal(attendee, this.data.rooms, this.data.groups);
            } else {
                Utils.showAlert('Attendee management component not loaded', 'error');
            }
        } catch (error) {
            Utils.showAlert('Failed to load attendee details', 'error');
        }
    },

    async editAnnouncement(id) {
        try {
            const announcement = await API.get(`/admin/announcements/${id}`);
            if (window.AnnouncementManagement) {
                await window.AnnouncementManagement.showModal(announcement, this.data.groups);
            } else {
                Utils.showAlert('Announcement management component not loaded', 'error');
            }
        } catch (error) {
            Utils.showAlert('Failed to load announcement details', 'error');
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
            Utils.showAlert('Failed to load room details', 'error');
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
            Utils.showAlert('Failed to load group details', 'error');
        }
    },

    /**
     * Delete methods
     */
    async deleteAttendee(id) {
        const attendee = this.data.attendees.find(a => a.id == id);
        if (!attendee) return;

        if (!confirm(`Are you sure you want to delete ${attendee.name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await API.delete(`/admin/attendees/${id}`);
            Utils.showAlert('Attendee deleted successfully', 'success');
            await this.refresh();
        } catch (error) {
            Utils.showAlert('Failed to delete attendee: ' + error.message, 'error');
        }
    },

    async toggleAnnouncement(id) {
        try {
            const announcement = this.data.announcements.find(a => a.id == id);
            if (!announcement) return;

            const newStatus = !announcement.is_active;
            await API.put(`/admin/announcements/${id}`, { is_active: newStatus });
            
            const action = newStatus ? 'activated' : 'deactivated';
            Utils.showAlert(`Announcement ${action} successfully`, 'success');
            await this.refresh();
        } catch (error) {
            Utils.showAlert('Failed to toggle announcement: ' + error.message, 'error');
        }
    },

    async deleteAnnouncement(id) {
        const announcement = this.data.announcements.find(a => a.id == id);
        if (!announcement) return;

        if (!confirm(`Are you sure you want to delete "${announcement.title}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await API.delete(`/admin/announcements/${id}`);
            Utils.showAlert('Announcement deleted successfully', 'success');
            await this.refresh();
        } catch (error) {
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

        try {
            await API.delete(`/admin/rooms/${id}`);
            Utils.showAlert('Room deleted successfully', 'success');
            await this.refresh();
        } catch (error) {
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

        try {
            await API.delete(`/admin/groups/${id}`);
            Utils.showAlert('Group deleted successfully', 'success');
            await this.refresh();
        } catch (error) {
            Utils.showAlert('Failed to delete group: ' + error.message, 'error');
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
     * Refresh dashboard data
     */
    async refresh() {
        try {
            await this.loadAllData();
            Utils.showAlert('Data refreshed successfully', 'success');
        } catch (error) {
            Utils.showAlert('Failed to refresh data', 'error');
        }
    }
};

// Make component globally available
window.AdminDashboard = AdminDashboard;
