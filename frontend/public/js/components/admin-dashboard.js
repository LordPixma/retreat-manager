// frontend/public/js/components/admin-dashboard.js
const AdminDashboard = {
    data: {
        attendees: [],
        rooms: [],
        groups: [],
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
     * Fallback render if template fails
     */
    renderFallback() {
        document.getElementById('app').innerHTML = `
            <div class="dashboard">
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
                        <div class="stat-value" id="room-occupancy">0%</div>
                        <div class="stat-label">Room Occupancy</div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="tab-navigation">
                    <button class="tab-btn active" data-tab="attendees">
                        <i class="fas fa-users"></i> Attendees
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
     * Load all data from API
     */
    async loadAllData() {
        try {
            await Promise.all([
                this.loadAttendees(),
                this.loadRooms(),
                this.loadGroups()
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
     * Calculate dashboard statistics
     */
    calculateStats() {
        const attendees = this.data.attendees;
        const rooms = this.data.rooms;
        
        this.data.stats = {
            totalAttendees: attendees.length,
            totalRevenue: attendees.reduce((sum, a) => sum + (a.payment_due || 0), 0),
            pendingPayments: attendees.filter(a => (a.payment_due || 0) > 0).length,
            roomsOccupied: attendees.filter(a => a.room).length,
            totalRooms: rooms.length,
            occupancyRate: rooms.length > 0 ? Math.round((attendees.filter(a => a.room).length / rooms.length) * 100) : 0
        };
    },

    /**
     * Update all displays with current data
     */
    updateAllDisplays() {
        this.updateStatsDisplay();
        this.updateAttendeesDisplay();
        this.updateRoomsDisplay();
        this.updateGroupsDisplay();
    },

    /**
     * Update statistics display
     */
    updateStatsDisplay() {
        const stats = this.data.stats;
        
        const totalAttendeesEl = document.getElementById('total-attendees');
        const totalRevenueEl = document.getElementById('total-revenue');
        const pendingPaymentsEl = document.getElementById('pending-payments');
        const roomOccupancyEl = document.getElementById('room-occupancy');
        
        if (totalAttendeesEl) totalAttendeesEl.textContent = stats.totalAttendees;
        if (totalRevenueEl) totalRevenueEl.textContent = Utils.formatCurrency(stats.totalRevenue);
        if (pendingPaymentsEl) pendingPaymentsEl.textContent = stats.pendingPayments;
        if (roomOccupancyEl) roomOccupancyEl.textContent = `${stats.occupancyRate}%`;
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
                    <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
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
                
            return `
                <tr data-attendee-id="${attendee.id}">
                    <td><strong>${Utils.escapeHtml(attendee.ref_number)}</strong></td>
                    <td>${Utils.escapeHtml(attendee.name)}</td>
                    <td>${attendee.email ? Utils.escapeHtml(attendee.email) : '<span class="text-secondary">—</span>'}</td>
                    <td>${attendee.room ? Utils.escapeHtml(attendee.room.number) : '<span class="badge badge-secondary">Unassigned</span>'}</td>
                    <td><strong>${Utils.formatCurrency(paymentDue)}</strong></td>
                    <td>${attendee.group ? Utils.escapeHtml(attendee.group.name) : '<span class="badge badge-secondary">No Group</span>'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary edit-attendee" data-id="${attendee.id}" title="Edit Attendee">
                                <i class="fas fa-edit"></i>
                            </button>
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
                    <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        No groups found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.data.groups.map(group => {
            const memberCount = group.member_count || 0;
            const membersList = group.members && group.members.length > 0
                ? group.members.slice(0, 3).map(member => Utils.escapeHtml(member.name)).join(', ') + 
                  (group.members.length > 3 ? ` +${group.members.length - 3} more` : '')
                : '<span class="text-secondary">No members</span>';
                
            return `
                <tr data-group-id="${group.id}">
                    <td><strong>${Utils.escapeHtml(group.name)}</strong></td>
                    <td><span class="badge badge-secondary">${memberCount} members</span></td>
                    <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis;">${membersList}</td>
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
        
        // Action buttons (edit/delete)
        this.bindActionButtons();
        
        // Search boxes
        this.bindSearchBoxes();
    },

    /**
     * Bind add buttons
     */
    bindAddButtons() {
        // Add attendee buttons
        document.querySelectorAll('#add-attendee-btn, #add-attendee-btn-2').forEach(btn => {
            btn.addEventListener('click', () => this.showAddAttendeeModal());
        });

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
     * Bind action buttons (edit/delete)
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
     * Bind search boxes
     */
    bindSearchBoxes() {
        const searchAttendees = document.getElementById('search-attendees');
        const searchRooms = document.getElementById('search-rooms');
        const searchGroups = document.getElementById('search-groups');

        if (searchAttendees) {
            searchAttendees.addEventListener('input', Utils.debounce((e) => {
                this.filterTable('attendees-table-body', e.target.value);
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

        const rows = tbody.querySelectorAll('tr[data-attendee-id], tr[data-room-id], tr[data-group-id]');
        const searchTerm = query.toLowerCase().trim();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const visible = !searchTerm || text.includes(searchTerm);
            row.style.display = visible ? '' : 'none';
        });
    },

    /**
     * Modal management methods
     */
    async showAddAttendeeModal() {
        if (window.AttendeeManagement) {
            await window.AttendeeManagement.showModal(null, this.data.rooms, this.data.groups);
        } else {
            Utils.showAlert('Attendee management component not loaded', 'error');
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