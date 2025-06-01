// frontend/public/js/components/attendee-dashboard.js - Complete updated version with announcements
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
     * Render dashboard template (updated with announcements)
     */
    async render() {
        try {
            const content = await Utils.loadTemplate('templates/attendee-dashboard.html');
            document.getElementById('app').innerHTML = content;
        } catch (error) {
            console.warn('Template loading failed, using fallback');
            this.renderFallback();
        }
    },

    /**
     * Fallback render with announcements section
     */
    renderFallback() {
        document.getElementById('app').innerHTML = `
            <div class="dashboard">
                <div class="dashboard-header">
                    <div>
                        <h1 class="dashboard-title">Welcome, <span id="attendee-name-display">Loading...</span></h1>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem;">Your retreat information and latest updates</p>
                    </div>
                    <div class="dashboard-actions">
                        <button class="btn btn-secondary" id="refresh-dashboard" title="Refresh all information">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                        <button class="btn btn-secondary" id="attendee-logout">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>

                <!-- Announcements Section (New) -->
                <div id="announcements-section" style="margin-bottom: 2rem;">
                    <div class="data-table">
                        <div class="table-header">
                            <h3 class="table-title">
                                <i class="fas fa-bullhorn"></i> Latest Updates & Announcements
                            </h3>
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <span id="announcements-count" class="badge badge-secondary" style="display: none;">0 updates</span>
                                <button class="btn btn-sm btn-secondary" id="refresh-announcements" title="Refresh announcements">
                                    <i class="fas fa-sync-alt"></i>
                                </button>
                            </div>
                        </div>
                        <div id="announcements-content" class="table-content">
                            <div class="loading-placeholder">
                                <i class="fas fa-spinner fa-spin"></i> Loading announcements...
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Info Cards -->
                <div class="info-grid">
                    <div class="info-card" id="room-info-card">
                        <h3><i class="fas fa-bed"></i> Room Allocation</h3>
                        <div id="room-info-content">
                            <div class="loading-placeholder">Loading room information...</div>
                        </div>
                    </div>

                    <div class="info-card" id="payment-info-card">
                        <h3><i class="fas fa-credit-card"></i> Payment Information</h3>
                        <div id="payment-info-content">
                            <div class="loading-placeholder">Loading payment information...</div>
                        </div>
                    </div>

                    <div class="info-card" id="group-info-card">
                        <h3><i class="fas fa-users"></i> Group Information</h3>
                        <div id="group-info-content">
                            <div class="loading-placeholder">Loading group information...</div>
                        </div>
                    </div>
                </div>

                <!-- Detailed Information -->
                <div class="data-table" id="detailed-info">
                    <div class="table-header">
                        <h3 class="table-title">Detailed Information</h3>
                    </div>
                    <div class="table-content" id="detailed-info-content">
                        <div class="loading-placeholder">Loading detailed information...</div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Load attendee data from API (now includes announcements)
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
     * Update dashboard display with data (updated with announcements)
     */
    updateDisplay() {
        if (!this.data) return;

        // Update name
        const nameDisplay = document.getElementById('attendee-name-display');
        if (nameDisplay) nameDisplay.textContent = this.data.name;

        // Update announcements (new)
        this.updateAnnouncementsDisplay();
        
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
     * Update announcements display (new method)
     */
    updateAnnouncementsDisplay() {
        const content = document.getElementById('announcements-content');
        const countBadge = document.getElementById('announcements-count');
        if (!content) return;

        const announcements = this.data.announcements || [];
        
        // Update count badge
        if (countBadge) {
            if (announcements.length > 0) {
                countBadge.textContent = `${announcements.length} update${announcements.length !== 1 ? 's' : ''}`;
                countBadge.style.display = 'inline-flex';
                
                // Color badge based on priority
                const hasUrgent = announcements.some(a => a.priority >= 5);
                const hasHigh = announcements.some(a => a.priority >= 4);
                
                if (hasUrgent) {
                    countBadge.className = 'badge badge-warning';
                } else if (hasHigh) {
                    countBadge.className = 'badge badge-primary';
                } else {
                    countBadge.className = 'badge badge-secondary';
                }
            } else {
                countBadge.style.display = 'none';
            }
        }
        
        if (announcements.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p style="margin-bottom: 0.5rem; font-size: 1.1rem;">No current announcements</p>
                    <small>Check back later for updates from the retreat organizers</small>
                </div>
            `;
            return;
        }

        // Sort announcements by priority and date
        const sortedAnnouncements = [...announcements].sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority; // Higher priority first
            }
            return new Date(b.created_at) - new Date(a.created_at); // Newer first
        });

        content.innerHTML = `
            <div class="announcements-list">
                ${sortedAnnouncements.map(announcement => this.renderAnnouncementCard(announcement)).join('')}
            </div>
        `;
    },

    /**
     * Render individual announcement card
     */
    renderAnnouncementCard(announcement) {
        const typeBadge = this.getAnnouncementTypeBadge(announcement.type);
        const priorityClass = this.getAnnouncementPriorityClass(announcement.priority);
        const timeAgo = this.getTimeAgo(announcement.created_at);
        const isNew = announcement.is_new;
        const isUrgent = announcement.priority >= 5;
        const isHigh = announcement.priority >= 4;
        
        return `
            <div class="announcement-card ${priorityClass}" ${isNew ? 'data-new="true"' : ''}>
                <div class="announcement-header">
                    <div class="announcement-title-row">
                        <h4 class="announcement-title">
                            ${isNew ? '<span class="new-badge">NEW</span>' : ''}
                            ${isUrgent ? '<i class="fas fa-exclamation-triangle" style="color: var(--error); margin-right: 0.5rem;"></i>' : ''}
                            ${Utils.escapeHtml(announcement.title)}
                        </h4>
                        <div class="announcement-badges">
                            <span class="badge ${typeBadge.class}">
                                <i class="${typeBadge.icon}"></i> ${typeBadge.text}
                            </span>
                            ${isUrgent ? '<span class="badge badge-warning"><i class="fas fa-bolt"></i> URGENT</span>' : ''}
                            ${isHigh && !isUrgent ? '<span class="badge badge-primary">HIGH PRIORITY</span>' : ''}
                        </div>
                    </div>
                    <div class="announcement-meta">
                        <small>
                            <i class="fas fa-user"></i> ${Utils.escapeHtml(announcement.author_name)}
                            <span style="margin: 0 0.5rem; opacity: 0.5;">•</span>
                            <i class="fas fa-clock"></i> ${timeAgo}
                        </small>
                    </div>
                </div>
                <div class="announcement-content">
                    ${this.formatAnnouncementContent(announcement.content)}
                </div>
                ${announcement.expires_at ? `
                    <div class="announcement-footer">
                        <small style="color: var(--text-secondary);">
                            <i class="fas fa-calendar-times"></i> 
                            Expires: ${this.formatDate(announcement.expires_at)}
                        </small>
                    </div>
                ` : ''}
                ${this.shouldShowExtraInfo(announcement) ? `
                    <div class="announcement-actions">
                        <small style="color: var(--text-secondary); font-style: italic;">
                            ${this.getAnnouncementExtraInfo(announcement)}
                        </small>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Format announcement content (convert line breaks, basic markdown)
     */
    formatAnnouncementContent(content) {
        return Utils.escapeHtml(content)
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>') // Links
            .replace(/^(.+)$/, '<p>$1</p>'); // Wrap in paragraphs
    },

    /**
     * Get announcement type badge configuration
     */
    getAnnouncementTypeBadge(type) {
        const badges = {
            'general': { text: 'General', class: 'badge-secondary', icon: 'fas fa-info-circle' },
            'urgent': { text: 'Urgent', class: 'badge-warning', icon: 'fas fa-exclamation-triangle' },
            'event': { text: 'Event', class: 'badge-primary', icon: 'fas fa-calendar' },
            'reminder': { text: 'Reminder', class: 'badge-success', icon: 'fas fa-clock' }
        };
        return badges[type] || badges['general'];
    },

    /**
     * Get priority class for announcement card
     */
    getAnnouncementPriorityClass(priority) {
        if (priority >= 5) return 'priority-urgent';
        if (priority >= 4) return 'priority-high';
        if (priority >= 3) return 'priority-normal';
        return 'priority-low';
    },

    /**
     * Calculate time ago string
     */
    getTimeAgo(datetime) {
        const now = new Date();
        const created = new Date(datetime);
        const diffMs = now - created;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    },

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Tomorrow at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays > 1 && diffDays <= 7) {
            return `In ${diffDays} days (${date.toLocaleDateString()})`;
        } else {
            return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
        }
    },

    /**
     * Check if should show extra info for announcement
     */
    shouldShowExtraInfo(announcement) {
        return announcement.type === 'event' || 
               announcement.priority >= 4 || 
               announcement.expires_at;
    },

    /**
     * Get extra info text for announcement
     */
    getAnnouncementExtraInfo(announcement) {
        const infos = [];
        
        if (announcement.type === 'event') {
            infos.push('📅 Event information');
        }
        
        if (announcement.priority >= 5) {
            infos.push('⚡ Requires immediate attention');
        } else if (announcement.priority >= 4) {
            infos.push('⭐ Important information');
        }
        
        return infos.join(' • ');
    },

    /**
     * Bind event listeners (updated with announcements)
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

        // Refresh dashboard button
        const refreshDashboardBtn = document.getElementById('refresh-dashboard');
        if (refreshDashboardBtn) {
            refreshDashboardBtn.addEventListener('click', () => {
                this.refresh();
            });
        }

        // Refresh announcements button
        const refreshBtn = document.getElementById('refresh-announcements');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshAnnouncements();
            });
        }

        // Auto-refresh announcements every 5 minutes
        setInterval(() => {
            this.refreshAnnouncementsQuietly();
        }, 5 * 60 * 1000);
    },

    /**
     * Refresh entire dashboard
     */
    async refresh() {
        const refreshBtn = document.getElementById('refresh-dashboard');
        
        try {
            if (refreshBtn) {
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            }

            // Reload data
            await this.loadData();
            
            Utils.showAlert('Dashboard refreshed', 'success');
            
        } catch (error) {
            Utils.showAlert('Failed to refresh dashboard', 'error');
            console.error('Error refreshing dashboard:', error);
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            }
        }
    },

    /**
     * Refresh announcements only (with user feedback)
     */
    async refreshAnnouncements() {
        const refreshBtn = document.getElementById('refresh-announcements');
        const content = document.getElementById('announcements-content');
        
        try {
            if (refreshBtn) {
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
            
            if (content) {
                content.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Refreshing announcements...</div>';
            }

            // Reload data
            await this.loadData();
            
            Utils.showAlert('Announcements refreshed', 'success');
            
        } catch (error) {
            Utils.showAlert('Failed to refresh announcements', 'error');
            console.error('Error refreshing announcements:', error);
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }
        }
    },

    /**
     * Refresh announcements quietly (no user feedback) - for auto-refresh
     */
    async refreshAnnouncementsQuietly() {
        try {
            const oldCount = this.data?.announcements?.length || 0;
            await this.loadData();
            const newCount = this.data?.announcements?.length || 0;
            
            // Show notification if new announcements appeared
            if (newCount > oldCount) {
                const diff = newCount - oldCount;
                Utils.showAlert(`${diff} new announcement${diff > 1 ? 's' : ''} received`, 'success');
            }
        } catch (error) {
            console.error('Quiet refresh failed:', error);
            // Don't show error to user for background refresh
        }
    },

    /**
     * Update room information section
     */
    updateRoomInfo() {
        const content = document.getElementById('room-info-content');
        if (!content) return;
        
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
                    <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                        Room assignments will be available closer to your arrival date
                    </small>
                </div>
            `;
        }
    },

    /**
     * Update payment information section
     */
    updatePaymentInfo() {
        const content = document.getElementById('payment-info-content');
        if (!content) return;
        
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
                ${paymentDue > 0 ? `
                    <small style="display: block; margin-top: 0.5rem; color: var(--text-secondary);">
                        Please contact the organizers for payment instructions
                    </small>
                ` : ''}
            </div>
        `;
    },

    /**
     * Update group information section
     */
    updateGroupInfo() {
        const content = document.getElementById('group-info-content');
        if (!content) return;
        
        if (this.data.group && this.data.group.members && this.data.group.members.length > 0) {
            // Calculate group financial summary
            const groupFinancial = this.data.group.financial || {};
            const totalOutstanding = groupFinancial.totalOutstanding || 0;
            const membersWithPayments = groupFinancial.membersWithPayments || 0;
            const totalMembers = this.data.group.members.length + 1; // +1 for current user
            
            content.innerHTML = `
                <div class="info-item">
                    <div class="info-label">Group Name</div>
                    <div class="info-value">${Utils.escapeHtml(this.data.group.name)}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Total Members</div>
                    <div class="info-value">${totalMembers} members</div>
                </div>
                
                <!-- Enhanced Financial Information -->
                <div class="info-item" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                    <div class="info-label">
                        <i class="fas fa-pound-sign"></i> Group Outstanding Balance
                    </div>
                    <div class="info-value" style="font-size: 1.3rem; font-weight: 700; color: ${totalOutstanding > 0 ? 'var(--warning)' : 'var(--success)'};">
                        ${Utils.formatCurrency(totalOutstanding)}
                    </div>
                    ${totalOutstanding > 0 ? `
                        <div style="margin-top: 0.5rem;">
                            <span class="badge badge-warning">
                                <i class="fas fa-exclamation-triangle"></i> 
                                ${membersWithPayments} member${membersWithPayments !== 1 ? 's' : ''} with pending payments
                            </span>
                        </div>
                    ` : `
                        <div style="margin-top: 0.5rem;">
                            <span class="badge badge-success">
                                <i class="fas fa-check-circle"></i> 
                                All payments complete
                            </span>
                        </div>
                    `}
                </div>
                
                <div class="info-item">
                    <div class="info-label">Fellow Members (${this.data.group.members.length})</div>
                    <ul class="member-list enhanced-member-list">
                        ${this.data.group.members.map(member => {
                            const paymentDue = member.payment_due || 0;
                            const hasPayment = paymentDue > 0;
                            
                            return `
                                <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                                    <div>
                                        <span style="font-weight: 500;">${Utils.escapeHtml(member.name)}</span>
                                        <br>
                                        <small style="color: var(--text-secondary);">${Utils.escapeHtml(member.ref_number)}</small>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 600; color: ${hasPayment ? 'var(--warning)' : 'var(--success)'};">
                                            ${Utils.formatCurrency(paymentDue)}
                                        </div>
                                        <span class="badge badge-${hasPayment ? 'warning' : 'success'}" style="font-size: 0.7rem;">
                                            ${hasPayment ? 'Pending' : 'Paid'}
                                        </span>
                                    </div>
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </div>
                
                <!-- Group Payment Summary -->
                ${totalOutstanding > 0 ? `
                    <div class="info-item" style="margin-top: 1rem; padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: var(--border-radius); border: 1px solid rgba(245, 158, 11, 0.2);">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-info-circle" style="color: var(--warning);"></i>
                            <strong style="color: var(--warning);">Group Payment Status</strong>
                        </div>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-primary);">
                            Your group has <strong>${Utils.formatCurrency(totalOutstanding)}</strong> in outstanding payments. 
                            ${membersWithPayments} out of ${totalMembers} members still need to complete their payments.
                        </p>
                        ${membersWithPayments > 0 ? `
                            <small style="color: var(--text-secondary); display: block; margin-top: 0.5rem;">
                                Contact the retreat organizers if you need assistance with group payment coordination.
                            </small>
                        ` : ''}
                    </div>
                ` : `
                    <div class="info-item" style="margin-top: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: var(--border-radius); border: 1px solid rgba(16, 185, 129, 0.2);">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-check-circle" style="color: var(--success);"></i>
                            <strong style="color: var(--success);">All Payments Complete!</strong>
                        </div>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-primary);">
                            Excellent! All members in your group have completed their payments. 
                            You're all set for the retreat.
                        </p>
                    </div>
                `}
            `;
        } else if (this.data.group) {
            // User is in a group but is the only member
            const userPayment = this.data.payment_due || 0;
            
            content.innerHTML = `
                <div class="info-item">
                    <div class="info-label">Group Name</div>
                    <div class="info-value">${Utils.escapeHtml(this.data.group.name)}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">
                        <i class="fas fa-pound-sign"></i> Group Outstanding Balance
                    </div>
                    <div class="info-value" style="font-size: 1.3rem; font-weight: 700; color: ${userPayment > 0 ? 'var(--warning)' : 'var(--success)'};">
                        ${Utils.formatCurrency(userPayment)}
                    </div>
                    <span class="badge badge-${userPayment > 0 ? 'warning' : 'success'}">
                        ${userPayment > 0 ? 'Your payment pending' : 'Payment complete'}
                    </span>
                </div>
                
                <div class="info-item">
                    <div class="info-value" style="color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> You're the only member in this group so far
                    </div>
                    <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                        Other members may be added as they register for the retreat
                    </small>
                </div>
            `;
        } else {
            // No group assignment
            content.innerHTML = `
                <div class="info-item">
                    <div class="info-value" style="color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> No group assignment yet
                    </div>
                    <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                        Group assignments help organize activities and meals
                    </small>
                </div>
            `;
        }
    },

    /**
     * Update detailed information section
     */
    updateDetailedInfo() {
        const content = document.getElementById('detailed-info-content');
        if (!content) return;
        
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
                    <div class="info-item">
                        <div class="info-label">Account Status</div>
                        <div class="info-value">
                            <span class="badge badge-success">
                                <i class="fas fa-check-circle"></i> Active
                            </span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 style="color: var(--primary); margin-bottom: 1rem;">
                        <i class="fas fa-bed"></i> Accommodation
                    </h4>
                    ${this.data.room ? `
                        <div class="info-item">
                            <div class="info-label">Room Number</div>
                            <div class="info-value">${Utils.escapeHtml(this.data.room.number)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Room Type</div>
                            <div class="info-value">${Utils.escapeHtml(this.data.room.description || 'Standard Room')}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Status</div>
                            <div class="info-value">
                                <span class="badge badge-success">
                                    <i class="fas fa-key"></i> Assigned
                                </span>
                            </div>
                        </div>
                    ` : `
                        <div class="info-item">
                            <div class="info-value" style="color: var(--text-secondary);">
                                <i class="fas fa-clock"></i> Room assignment pending
                            </div>
                            <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                                Rooms are typically assigned 1-2 weeks before arrival
                            </small>
                        </div>
                    `}
                </div>
                
                <div>
                    <h4 style="color: var(--primary); margin-bottom: 1rem;">
                        <i class="fas fa-users"></i> Group & Activities
                    </h4>
                    ${this.data.group ? `
                        <div class="info-item">
                            <div class="info-label">Group Name</div>
                            <div class="info-value">${Utils.escapeHtml(this.data.group.name)}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Group Size</div>
                            <div class="info-value">${this.data.group.members.length + 1} members total</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Status</div>
                            <div class="info-value">
                                <span class="badge badge-primary">
                                    <i class="fas fa-users"></i> Active Member
                                </span>
                            </div>
                        </div>
                    ` : `
                        <div class="info-item">
                            <div class="info-value" style="color: var(--text-secondary);">
                                <i class="fas fa-clock"></i> No group assigned yet
                            </div>
                            <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                                Groups help coordinate activities, meals, and excursions
                            </small>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
};

// Make component globally available
window.AttendeeDashboard = AttendeeDashboard;