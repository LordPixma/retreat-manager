const AttendeeDashboard = {
    data: null,

    /**
     * Initialize attendee dashboard
     */
    async init() {
        try {
            await this.render();
            await this.loadData();
            this.bindEvents();
        } catch (error) {
            console.error('Failed to initialize attendee dashboard:', error);
            Utils.showAlert('Failed to load dashboard', 'error');
        }
    },

    /**
     * Render dashboard template
     */
    async render() {
        const content = await Utils.loadTemplate('templates/attendee-dashboard.html');
        document.getElementById('app').innerHTML = content;
    },

    /**
     * Load attendee data from API
     */
    async loadData() {
        try {
            this.data = await API.get('/me');
            this.updateDisplay();
        } catch (error) {
            console.error('Failed to load attendee data:', error);
            throw error;
        }
    },

    /**
     * Update dashboard display with data
     */
    updateDisplay() {
        if (!this.data) return;

        // Update name
        document.getElementById('attendee-name-display').textContent = this.data.name;

        // Update room information
        this.updateRoomInfo();
        
        // Update payment information
        this.updatePaymentInfo();
        
        // Update group information
        this.updateGroupInfo();
        
        // Update detailed information
        this.updateDetailedInfo();
    },

    /**
     * Update room information section
     */
    updateRoomInfo() {
        const content = document.getElementById('room-info-content');
        
        if (this.data.room) {
            content.innerHTML = `
                <div class="info-item">
                    <div class="info-label">Room Number</div>
                    <div class="info-value">${Utils.escapeHtml(this.data.room.number)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Description</div>
                    <div class="info-value">${Utils.escapeHtml(this.data.room.description || 'No description available')}</div>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="info-item">
                    <div class="info-value" style="color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> No room assigned yet
                    </div>
                </div>
            `;
        }
    },

    /**
     * Update payment information section
     */
    updatePaymentInfo() {
        const content = document.getElementById('payment-info-content');
        const paymentDue = this.data.payment_due || 0;
        
        content.innerHTML = `
            <div class="info-item">
                <div class="info-label">Outstanding Balance</div>
                <div class="info-value" style="font-size: 1.5rem; font-weight: 700; color: ${paymentDue > 0 ? 'var(--warning)' : 'var(--success)'};">
                    ${Utils.formatCurrency(paymentDue)}
                </div>
            </div>
            <div class="info-item" style="margin-top: 1rem;">
                <span class="badge ${paymentDue > 0 ? 'badge-warning' : 'badge-success'}">
                    <i class="fas fa-${paymentDue > 0 ? 'exclamation-triangle' : 'check'}"></i> 
                    ${paymentDue > 0 ? 'Payment Due' : 'Paid in Full'}
                </span>
            </div>
        `;
    },

    /**
     * Update group information section
     */
    updateGroupInfo() {
        const content = document.getElementById('group-info-content');
        
        if (this.data.group && this.data.group.members && this.data.group.members.length > 0) {
            content.innerHTML = `
                <div class="info-item">
                    <div class="info-label">Group Name</div>
                    <div class="info-value">${Utils.escapeHtml(this.data.group.name)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Fellow Members</div>
                    <ul class="member-list">
                        ${this.data.group.members.map(member => `
                            <li>
                                <span>${Utils.escapeHtml(member.name)}</span>
                                <small style="color: var(--text-secondary)">${Utils.escapeHtml(member.ref_number)}</small>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="info-item">
                    <div class="info-value" style="color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> No group members assigned
                    </div>
                </div>
            `;
        }
    },

    /**
     * Update detailed information section
     */
    updateDetailedInfo() {
        const content = document.getElementById('detailed-info-content');
        
        content.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; padding: 1rem;">
                <div>
                    <h4 style="color: var(--primary); margin-bottom: 1rem;">
                        <i class="fas fa-user"></i> Personal Information
                    </h4>
                    <div class="info-item">
                        <div class="info-label">Full Name</div>
                        <div class="info-value">${Utils.escapeHtml(this.data.name)}</div>
                    </div>
                    ${this.data.email ? `
                        <div class="info-item">
                            <div class="info-label">Email</div>
                            <div class="info-value">${Utils.escapeHtml(this.data.email)}</div>
                        </div>
                    ` : ''}
                </div>
                
                <div>
                    <h4 style="color: var(--primary); margin-bottom: 1rem;">
                        <i class="fas fa-bed"></i> Accommodation
                    </h4>
                    ${this.data.room ? `
                        <div class="info-item">
                            <div class="info-label">Room</div>
                            <div class="info-value">${Utils.escapeHtml(this.data.room.number)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Type</div>
                            <div class="info-value">${Utils.escapeHtml(this.data.room.description || 'Standard Room')}</div>
                        </div>
                    ` : `
                        <div class="info-item">
                            <div class="info-value" style="color: var(--text-secondary);">
                                Room assignment pending
                            </div>
                        </div>
                    `}
                </div>
                
                <div>
                    <h4 style="color: var(--primary); margin-bottom: 1rem;">
                        <i class="fas fa-users"></i> Group Activities
                    </h4>
                    ${this.data.group ? `
                        <div class="info-item">
                            <div class="info-label">Group</div>
                            <div class="info-value">${Utils.escapeHtml(this.data.group.name)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Group Size</div>
                            <div class="info-value">${this.data.group.members.length + 1} members</div>
                        </div>
                    ` : `
                        <div class="info-item">
                            <div class="info-value" style="color: var(--text-secondary);">
                                No group assigned
                            </div>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Logout button
        const logoutBtn = document.getElementById('attendee-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    Auth.logout();
                }
            });
        }
    },

    /**
     * Refresh dashboard data
     */
    async refresh() {
        try {
            await this.loadData();
            Utils.showAlert('Information updated', 'success');
        } catch (error) {
            Utils.showAlert('Failed to refresh information', 'error');
        }
    }
};

// Make component globally available
window.AttendeeDashboard = AttendeeDashboard;