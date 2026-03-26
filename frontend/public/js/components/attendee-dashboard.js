// frontend/public/js/components/attendee-dashboard.js - v2 with Stripe payments
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
                        <p class="dashboard-subtitle">Your retreat portal</p>
                    </div>
                    <div class="dashboard-actions">
                        <button class="btn btn-ghost" id="refresh-dashboard"><i class="fas fa-sync-alt"></i></button>
                        <button class="btn btn-ghost" id="attendee-logout"><i class="fas fa-sign-out-alt"></i> Logout</button>
                    </div>
                </div>

                <div id="payment-banner" style="display: none; margin-bottom: 1.5rem;">
                    <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(118, 75, 162, 0.08) 100%); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: #a78bfa; font-weight: 600; margin-bottom: 0.25rem;">Outstanding Balance</div>
                            <div id="banner-amount" style="font-size: 2rem; font-weight: 700; color: #fff;">£0.00</div>
                        </div>
                        <div id="banner-pay-buttons" style="display: flex; gap: 0.5rem; flex-wrap: wrap;"></div>
                    </div>
                </div>

                <div id="announcements-section" style="margin-bottom: 1.5rem;">
                    <div class="data-table">
                        <div class="table-header">
                            <h3 class="table-title"><i class="fas fa-bullhorn"></i> Announcements</h3>
                            <span id="announcements-count" class="badge badge-secondary" style="display: none;">0</span>
                        </div>
                        <div id="announcements-content" class="table-content">
                            <div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
                        </div>
                    </div>
                </div>

                <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-bottom: 1.5rem;">
                    <div class="stat-card" id="payment-info-card" style="padding: 0; border: none;">
                        <div style="padding: 1.25rem 1.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem;">
                                <div class="stat-icon-modern" style="background: rgba(139, 92, 246, 0.15); color: #a78bfa;"><i class="fas fa-credit-card"></i></div>
                                <div style="font-size: 0.85rem; font-weight: 600; color: #fff;">Payment</div>
                            </div>
                            <div id="payment-info-content"><div class="loading-placeholder" style="padding: 0;">Loading...</div></div>
                        </div>
                    </div>
                    <div class="stat-card" id="room-info-card" style="padding: 0; border: none;">
                        <div style="padding: 1.25rem 1.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem;">
                                <div class="stat-icon-modern" style="background: rgba(59, 130, 246, 0.15); color: #93c5fd;"><i class="fas fa-bed"></i></div>
                                <div style="font-size: 0.85rem; font-weight: 600; color: #fff;">Room</div>
                            </div>
                            <div id="room-info-content"><div class="loading-placeholder" style="padding: 0;">Loading...</div></div>
                        </div>
                    </div>
                    <div class="stat-card" id="group-info-card" style="padding: 0; border: none;">
                        <div style="padding: 1.25rem 1.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem;">
                                <div class="stat-icon-modern" style="background: rgba(16, 185, 129, 0.15); color: #6ee7b7;"><i class="fas fa-users"></i></div>
                                <div style="font-size: 0.85rem; font-weight: 600; color: #fff;">Group</div>
                            </div>
                            <div id="group-info-content"><div class="loading-placeholder" style="padding: 0;">Loading...</div></div>
                        </div>
                    </div>
                </div>

                <div class="data-table" id="detailed-info">
                    <div class="table-header"><h3 class="table-title">Your Details</h3></div>
                    <div class="table-content" id="detailed-info-content"><div class="loading-placeholder">Loading...</div></div>
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

        // Update family registration summary
        this.updateFamilySummary();

        // New features
        this.updateCountdown();
        this.updateQRCode();
        this.updateActivityTeams();
        this.updatePackingChecklist();
        this.bindProfileEdit();
        this.bindDownloadConfirmation();
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

        // Auto-refresh announcements every 5 minutes (only if still on attendee view)
        this._refreshInterval = setInterval(() => {
            if (Auth.isAuthenticated('attendee') && document.getElementById('attendee-name-display')) {
                this.refreshAnnouncementsQuietly();
            }
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
        // Skip if no longer authenticated as attendee
        if (!Auth.isAuthenticated('attendee')) return;

        try {
            const oldCount = this.data?.announcements?.length || 0;

            // Direct fetch to avoid triggering global 401 handler
            const response = await fetch('/api/me', {
                headers: { 'Authorization': `Bearer ${Auth.getToken('attendee')}` }
            });
            if (!response.ok) return; // Silently fail

            const newData = await response.json();
            this.data = newData;
            this.updateAnnouncementsDisplay();

            const newCount = this.data?.announcements?.length || 0;
            if (newCount > oldCount) {
                const diff = newCount - oldCount;
                Utils.showAlert(`${diff} new announcement${diff > 1 ? 's' : ''} received`, 'success');
            }
        } catch {
            // Silently fail for background refresh
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
        const paymentOption = this.data.payment_option || 'full';

        // Update the top banner
        const banner = document.getElementById('payment-banner');
        const bannerAmount = document.getElementById('banner-amount');
        const bannerButtons = document.getElementById('banner-pay-buttons');

        if (banner && paymentDue > 0 && paymentOption !== 'sponsorship') {
            banner.style.display = 'block';
            if (bannerAmount) bannerAmount.textContent = Utils.formatCurrency(paymentDue);
            if (bannerButtons) {
                bannerButtons.innerHTML = `
                    <button class="btn btn-success show-payment-options-btn"><i class="fas fa-sterling-sign"></i> Pay Now</button>
                `;
                bannerButtons.querySelector('.show-payment-options-btn').addEventListener('click', () => this.showPaymentOptions());
            }
        } else if (banner) {
            banner.style.display = 'none';
        }

        // Update the card
        content.innerHTML = `
            <div style="font-size: 1.5rem; font-weight: 700; color: ${paymentDue > 0 ? '#fbbf24' : '#6ee7b7'}; margin-bottom: 0.4rem;">
                ${Utils.formatCurrency(paymentDue)}
            </div>
            <span class="badge ${paymentDue > 0 ? 'badge-warning' : 'badge-success'}">
                <i class="fas fa-${paymentDue > 0 ? 'clock' : 'check'}"></i>
                ${paymentDue > 0 ? 'Due' : 'Paid'}
            </span>
            ${paymentDue > 0 && paymentOption !== 'sponsorship' ? `
                <div style="margin-top: 1rem;">
                    <button class="btn btn-sm btn-success show-payment-options-btn" style="width: 100%;">
                        <i class="fas fa-sterling-sign"></i> Pay Now
                    </button>
                </div>
            ` : ''}
            ${paymentOption === 'sponsorship' ? '<div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-tertiary);">Sponsorship requested</div>' : ''}
            <div id="payment-history-section" style="margin-top: 0.75rem;"></div>
        `;

        content.querySelectorAll('.show-payment-options-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showPaymentOptions());
        });
        this.loadPaymentHistory();
    },

    showPaymentOptions() {
        const paymentDue = this.data.payment_due || 0;
        const paymentOption = this.data.payment_option || 'full';

        // Build installment buttons
        let installmentBtns = '';
        if (paymentOption === 'installments') {
            installmentBtns = `
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.05em;">Installment Plans</div>
                    <div style="display: flex; gap: 0.4rem;">
                        <button class="btn btn-sm btn-primary pay-card-installment" data-count="3" style="flex:1;">3 x ${Utils.formatCurrency(Math.ceil(paymentDue / 3 * 100) / 100)}</button>
                        <button class="btn btn-sm btn-primary pay-card-installment" data-count="4" style="flex:1;">4 x ${Utils.formatCurrency(Math.ceil(paymentDue / 4 * 100) / 100)}</button>
                    </div>
                </div>
            `;
        }

        const modalHtml = `
            <div class="modal-overlay" id="payment-options-modal" style="z-index: 500;">
                <div class="modal" style="max-width: 480px;">
                    <div class="modal-header">
                        <h3 class="modal-title">Choose Payment Method</h3>
                        <button type="button" class="modal-close" id="close-payment-modal"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body" style="padding: 1.5rem;">
                        <div style="text-align: center; margin-bottom: 1.5rem;">
                            <div style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Amount Due</div>
                            <div style="font-size: 2rem; font-weight: 700; color: #fff;">${Utils.formatCurrency(paymentDue)}</div>
                        </div>

                        <!-- Card Payment -->
                        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem; margin-bottom: 0.75rem;">
                            <div style="font-size: 0.85rem; font-weight: 600; color: #fff; margin-bottom: 0.5rem;"><i class="fas fa-credit-card" style="color: #a78bfa;"></i> Pay by Card</div>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 1rem;">Secure payment via Stripe. Instant confirmation.</div>
                            ${installmentBtns}
                            <button class="btn btn-success pay-card-full" style="width: 100%;">
                                <i class="fas fa-credit-card"></i> Pay ${Utils.formatCurrency(paymentDue)} by Card
                            </button>
                        </div>

                        <!-- Bank Transfer -->
                        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem;">
                            <div style="font-size: 0.85rem; font-weight: 600; color: #fff; margin-bottom: 0.5rem;"><i class="fas fa-building-columns" style="color: #6ee7b7;"></i> Pay by Bank Transfer</div>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 1rem;">No fees. Transfer directly to our account. Admin confirms receipt.</div>
                            <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 0.85rem; margin-bottom: 1rem; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.7;">
                                <strong style="color: #fff;">Account Name:</strong> Cloverleaf Christian Centre<br>
                                <strong style="color: #fff;">Sort Code:</strong> <span style="font-family: monospace;">82-12-08</span><br>
                                <strong style="color: #fff;">Account No:</strong> <span style="font-family: monospace;">50180560</span><br>
                                <strong style="color: #fff;">Reference:</strong> <span style="font-family: monospace; color: #fbbf24;">${this.data.ref_number || ''}</span>
                            </div>
                            <button class="btn btn-primary pay-bank-full" style="width: 100%;">
                                <i class="fas fa-check"></i> I've Made the Transfer
                            </button>
                            ${paymentOption === 'installments' ? `
                                <div style="display: flex; gap: 0.4rem; margin-top: 0.5rem;">
                                    <button class="btn btn-sm btn-ghost pay-bank-installment" data-count="3" style="flex:1;">I've paid 3-instalment amount</button>
                                    <button class="btn btn-sm btn-ghost pay-bank-installment" data-count="4" style="flex:1;">I've paid 4-instalment amount</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('payment-options-modal');
        const close = () => modal.remove();

        document.getElementById('close-payment-modal').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

        // Card payment buttons
        modal.querySelector('.pay-card-full')?.addEventListener('click', (e) => { close(); this.handlePayment('full', null, e); });
        modal.querySelectorAll('.pay-card-installment').forEach(btn => {
            btn.addEventListener('click', (e) => { close(); this.handlePayment('installment', parseInt(btn.dataset.count), e); });
        });

        // Bank transfer buttons
        modal.querySelector('.pay-bank-full')?.addEventListener('click', (e) => { close(); this.handleBankTransfer('full', null, e); });
        modal.querySelectorAll('.pay-bank-installment').forEach(btn => {
            btn.addEventListener('click', (e) => { close(); this.handleBankTransfer('installment', parseInt(btn.dataset.count), e); });
        });
    },

    async handleBankTransfer(type, installmentCount, e) {
        try {
            const body = { payment_type: type };
            if (type === 'installment') body.installment_count = installmentCount;

            await API.post('/payments/bank-transfer', body);
            Utils.showAlert('Bank transfer recorded! We\'ll confirm once payment is received.', 'success');

            // Reload data
            this.data = await API.get('/me');
            this.updatePaymentInfo();
        } catch (error) {
            Utils.showAlert(error.message || 'Failed to record bank transfer', 'error');
        }
    },

    bindPayButtons(container) {
        container.querySelectorAll('.pay-full-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePayment('full', null, e));
        });
        container.querySelectorAll('.pay-installment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const count = parseInt(e.currentTarget.dataset.count);
                this.handlePayment('installment', count, e);
            });
        });
    },

    async handlePayment(type, installmentCount, e) {
        try {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirecting...';

            const body = { payment_type: type };
            if (type === 'installment') body.installment_count = installmentCount;

            const response = await API.post('/payments/checkout', body);

            if (response.checkout_url) {
                window.location.href = response.checkout_url;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error) {
            console.error('Payment error:', error);
            Utils.showAlert(error.message || 'Failed to start payment. Please try again.', 'error');
            document.querySelectorAll('.pay-full-btn, .pay-installment-btn').forEach(b => {
                b.disabled = false;
            });
            this.updatePaymentInfo();
        }
    },

    async loadPaymentHistory() {
        const section = document.getElementById('payment-history-section');
        if (!section) return;

        try {
            const response = await API.get('/payments/history');
            const payments = response.payments || [];

            if (payments.length === 0) return;

            const rows = payments.map(p => {
                const amount = (p.amount / 100).toFixed(2);
                const statusBadge = {
                    'succeeded': '<span class="badge badge-success">Paid</span>',
                    'pending': '<span class="badge badge-warning">Pending</span>',
                    'failed': '<span class="badge badge-danger">Failed</span>',
                    'cancelled': '<span class="badge badge-secondary">Cancelled</span>',
                }[p.status] || '<span class="badge badge-secondary">' + p.status + '</span>';

                const date = p.paid_at || p.created_at;
                const dateStr = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

                return `<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <div style="font-size: 0.85rem; font-weight: 500;">£${amount}</div>
                        <div style="font-size: 0.7rem; color: var(--text-tertiary);">${dateStr}</div>
                    </div>
                    ${statusBadge}
                </div>`;
            }).join('');

            section.innerHTML = `
                <div style="padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
                    <div class="info-label" style="margin-bottom: 0.5rem;">Payment History</div>
                    ${rows}
                </div>
            `;
        } catch (error) {
            // Silently fail - payment history is supplementary
            console.warn('Could not load payment history:', error);
        }
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
        
        const d = this.data;
        const field = (label, value) => value ? `<div class="info-item"><div class="info-label">${label}</div><div class="info-value">${Utils.escapeHtml(value)}</div></div>` : '';

        content.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; padding: 1rem;">
                <div>
                    <h4 style="color: var(--primary-400); margin-bottom: 0.75rem; font-size: 0.85rem;">
                        <i class="fas fa-user"></i> Personal
                    </h4>
                    ${field('Full Name', d.name)}
                    ${field('Reference', d.ref_number)}
                    ${field('Email', d.email)}
                    ${field('Phone', d.phone)}
                </div>
                <div>
                    <h4 style="color: var(--primary-400); margin-bottom: 0.75rem; font-size: 0.85rem;">
                        <i class="fas fa-heart"></i> Health & Safety
                    </h4>
                    ${field('Emergency Contact', d.emergency_contact)}
                    ${field('Dietary Requirements', d.dietary_requirements)}
                    ${field('Special Requests', d.special_requests)}
                    ${!d.emergency_contact && !d.dietary_requirements && !d.special_requests ? '<div style="font-size: 0.8rem; color: var(--text-tertiary);">No details provided — click Edit to add</div>' : ''}
                </div>
                <div>
                    <h4 style="color: var(--primary-400); margin-bottom: 0.75rem; font-size: 0.85rem;">
                        <i class="fas fa-bed"></i> Accommodation
                    </h4>
                    ${d.room
                        ? field('Room', d.room.number) + field('Type', d.room.description || 'Standard')
                        : '<div style="font-size: 0.8rem; color: var(--text-tertiary);"><i class="fas fa-clock"></i> Room assignment pending</div>'}
                </div>
                <div>
                    <h4 style="color: var(--primary-400); margin-bottom: 0.75rem; font-size: 0.85rem;">
                        <i class="fas fa-users"></i> Group
                    </h4>
                    ${d.group
                        ? field('Group', d.group.name) + `<div class="info-item"><div class="info-label">Members</div><div class="info-value">${d.group.members.length + 1}</div></div>`
                        : '<div style="font-size: 0.8rem; color: var(--text-tertiary);"><i class="fas fa-clock"></i> No group assigned yet</div>'}
                </div>
            </div>
        `;
    },

    // ==================== NEW FEATURES ====================

    updateCountdown() {
        const display = document.getElementById('countdown-display');
        if (!display) return;

        const retreatDate = new Date('2026-07-31T15:00:00');
        const update = () => {
            const now = new Date();
            const diff = retreatDate - now;
            if (diff <= 0) {
                display.innerHTML = '<div style="font-size: 1.25rem; font-weight: 700; color: #6ee7b7;">The retreat is here!</div>';
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            const unit = (val, label) => `
                <div style="text-align: center;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: #fff; line-height: 1;">${val}</div>
                    <div style="font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-tertiary); margin-top: 0.2rem;">${label}</div>
                </div>`;
            display.innerHTML = unit(days, 'Days') + unit(hours, 'Hours') + unit(mins, 'Mins') + unit(secs, 'Secs');
        };
        update();
        setInterval(update, 1000);
    },

    updateQRCode() {
        const container = document.getElementById('qr-code-container');
        const refDisplay = document.getElementById('qr-ref-display');
        if (!container || !this.data.ref_number) return;

        if (refDisplay) refDisplay.textContent = this.data.ref_number;

        // Generate QR code using a simple SVG-based approach (no library needed)
        // We'll use an inline canvas QR generator
        const qrData = JSON.stringify({
            ref: this.data.ref_number,
            name: this.data.name,
            t: Date.now()
        });

        // Use a lightweight QR code via Google Charts API fallback
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=1e1e2e`;
        container.innerHTML = `<img src="${qrUrl}" alt="QR Code" style="width: 140px; height: 140px; display: block;">`;
    },

    updateActivityTeams() {
        const container = document.getElementById('activity-teams-content');
        if (!container) return;

        const teams = this.data.activity_teams || [];
        if (teams.length === 0) {
            container.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-tertiary);">No activity teams assigned yet</div>';
            return;
        }

        container.innerHTML = teams.map(team => `
            <div style="margin-bottom: 0.75rem; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05);">
                <div style="font-size: 0.85rem; font-weight: 600; color: #fff; margin-bottom: 0.3rem;">
                    ${Utils.escapeHtml(team.name)}
                    ${team.is_leader ? ' <span class="badge badge-primary" style="font-size: 0.55rem;"><i class="fas fa-crown"></i> Leader</span>' : ''}
                </div>
                ${team.description ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.3rem;">${Utils.escapeHtml(team.description)}</div>` : ''}
                <div style="font-size: 0.7rem; color: var(--text-tertiary);">
                    <i class="fas fa-user-shield"></i> Leader: ${Utils.escapeHtml(team.leader_name || 'TBD')}
                    &nbsp;&middot;&nbsp; ${team.members.length} members
                </div>
                <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-top: 0.2rem;">
                    ${team.members.map(n => Utils.escapeHtml(n)).join(', ')}
                </div>
            </div>
        `).join('');
    },

    updatePackingChecklist() {
        const container = document.getElementById('packing-list');
        const progressEl = document.getElementById('packing-progress');
        if (!container) return;

        const items = [
            { category: 'Essentials', items: ['Bible', 'Notebook & Pen', 'Phone Charger', 'ID / Driving Licence', 'Cash / Card'] },
            { category: 'Clothing', items: ['Comfortable day clothes', 'Smart casual evening wear', 'Warm jacket / layers', 'Comfortable shoes', 'Sleepwear'] },
            { category: 'Toiletries', items: ['Toothbrush & Toothpaste', 'Shower gel / Shampoo', 'Towel', 'Any medications'] },
            { category: 'Optional', items: ['Snacks to share', 'Musical instrument', 'Board games', 'Walking shoes', 'Umbrella / Raincoat'] },
        ];

        const storageKey = `packing_${this.data.ref_number || 'guest'}`;
        let checked = {};
        try { checked = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch {}

        const allItems = items.flatMap(c => c.items);
        const checkedCount = allItems.filter(i => checked[i]).length;
        if (progressEl) progressEl.textContent = `${checkedCount}/${allItems.length} packed`;

        container.innerHTML = items.map(cat => `
            <div style="margin-bottom: 0.5rem;">
                <div style="font-size: 0.7rem; font-weight: 600; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.3rem;">${cat.category}</div>
                ${cat.items.map(item => `
                    <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0; cursor: pointer; font-size: 0.8rem; color: ${checked[item] ? 'var(--text-tertiary)' : 'var(--text-secondary)'}; ${checked[item] ? 'text-decoration: line-through;' : ''}">
                        <input type="checkbox" class="packing-item" data-item="${Utils.escapeHtml(item)}" ${checked[item] ? 'checked' : ''} style="accent-color: var(--primary-500);">
                        ${Utils.escapeHtml(item)}
                    </label>
                `).join('')}
            </div>
        `).join('');

        // Bind checkbox changes
        container.querySelectorAll('.packing-item').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const item = e.target.dataset.item;
                if (e.target.checked) checked[item] = true;
                else delete checked[item];
                localStorage.setItem(storageKey, JSON.stringify(checked));
                this.updatePackingChecklist();
            });
        });
    },

    bindProfileEdit() {
        const editBtn = document.getElementById('edit-profile-btn');
        if (!editBtn) return;

        editBtn.addEventListener('click', () => {
            const content = document.getElementById('detailed-info-content');
            if (!content) return;

            content.innerHTML = `
                <form id="profile-edit-form" style="padding: 1rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Phone</label>
                            <input type="tel" name="phone" class="form-input" value="${Utils.escapeHtml(this.data.phone || '')}" placeholder="Your phone number">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Emergency Contact</label>
                            <input type="text" name="emergency_contact" class="form-input" value="${Utils.escapeHtml(this.data.emergency_contact || '')}" placeholder="Name and number">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dietary Requirements</label>
                            <input type="text" name="dietary_requirements" class="form-input" value="${Utils.escapeHtml(this.data.dietary_requirements || '')}" placeholder="Any dietary needs">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Special Requests</label>
                            <input type="text" name="special_requests" class="form-input" value="${Utils.escapeHtml(this.data.special_requests || '')}" placeholder="Any special needs">
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button type="submit" class="btn btn-primary btn-sm"><i class="fas fa-save"></i> Save Changes</button>
                        <button type="button" class="btn btn-ghost btn-sm" id="cancel-profile-edit"><i class="fas fa-times"></i> Cancel</button>
                    </div>
                </form>
            `;

            document.getElementById('cancel-profile-edit').addEventListener('click', () => {
                this.updateDetailedInfo();
            });

            document.getElementById('profile-edit-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                try {
                    await API.request('/profile', { method: 'PUT', body: JSON.stringify(data) });
                    Utils.showAlert('Profile updated successfully', 'success');
                    // Reload data
                    this.data = await API.get('/me');
                    this.updateDetailedInfo();
                } catch (error) {
                    Utils.showAlert(error.message || 'Failed to update profile', 'error');
                }
            });
        });
    },

    bindDownloadConfirmation() {
        const btn = document.getElementById('download-confirmation-btn');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const d = this.data;
            const reg = d.family_registration;
            const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

            let familyRows = '';
            if (reg && reg.family_members) {
                familyRows = reg.family_members.map(m =>
                    `<tr><td style="padding:8px;border:1px solid #ddd;">${m.name}</td><td style="padding:8px;border:1px solid #ddd;">${m.member_type}</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">£${(m.price || 0).toFixed(2)}</td></tr>`
                ).join('');
            }

            const html = `
                <html><head><meta charset="UTF-8"><title>Booking Confirmation - ${d.ref_number}</title>
                <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{color:#667eea}table{border-collapse:collapse;width:100%}th{background:#667eea;color:#fff;padding:10px;text-align:left}td{padding:8px;border:1px solid #ddd}.header{text-align:center;margin-bottom:30px}.info{margin:20px 0;padding:15px;background:#f8f9fa;border-radius:8px}.footer{margin-top:40px;text-align:center;color:#999;font-size:12px}</style></head>
                <body>
                <div class="header">
                    <h1>Growth & Wisdom Family Retreat 2026</h1>
                    <p>Booking Confirmation</p>
                </div>
                <div class="info">
                    <strong>Reference:</strong> ${d.ref_number}<br>
                    <strong>Name:</strong> ${d.name}<br>
                    ${d.email ? `<strong>Email:</strong> ${d.email}<br>` : ''}
                    <strong>Payment Status:</strong> ${d.payment_due > 0 ? '£' + d.payment_due.toFixed(2) + ' outstanding' : 'Paid in Full'}<br>
                    <strong>Payment Plan:</strong> ${d.payment_option === 'installments' ? 'Installments' : d.payment_option === 'sponsorship' ? 'Sponsorship' : 'Full Payment'}<br>
                    ${d.room ? `<strong>Room:</strong> ${d.room.number}<br>` : ''}
                    ${d.group ? `<strong>Group:</strong> ${d.group.name}<br>` : ''}
                </div>
                ${familyRows ? `
                <h3>Family Members</h3>
                <table><thead><tr><th>Name</th><th>Type</th><th style="text-align:right">Cost</th></tr></thead>
                <tbody>${familyRows}</tbody>
                <tfoot><tr><td colspan="2" style="padding:8px;border:1px solid #ddd;font-weight:bold">Total</td><td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">£${(reg.total_amount || 0).toFixed(2)}</td></tr></tfoot>
                </table>` : ''}
                <div class="info" style="margin-top:20px;">
                    <strong>Venue:</strong> The Hayes Conference Centre, Swanwick, Derbyshire DE55 1AU<br>
                    <strong>Dates:</strong> July 31 – August 2, 2026<br>
                    <strong>Check-in:</strong> 3:00 PM on Friday, July 31
                </div>
                <div class="footer">
                    Generated on ${now} | Growth & Wisdom Family Retreat 2026<br>
                    Hosted by Cloverleaf Christian Centre
                </div>
                </body></html>
            `;

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                    URL.revokeObjectURL(url);
                };
            }
        });
    },

    updateFamilySummary() {
        const reg = this.data.family_registration;
        if (!reg || !reg.family_members || reg.family_members.length <= 1) return;

        // Only show for primary attendees with a family registration
        const container = document.getElementById('detailed-info');
        if (!container) return;

        const typeBadges = {
            'adult': '<span class="badge badge-primary">Adult</span>',
            'child': '<span class="badge badge-info">Child</span>',
            'infant': '<span class="badge badge-success">Infant</span>',
        };

        const planLabels = {
            'full': 'Full Payment',
            'installments': 'Monthly Installments',
            'sponsorship': 'Sponsorship Requested',
        };

        const registeredDate = new Date(reg.submitted_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        const memberRows = reg.family_members.map((m, i) => `
            <tr>
                <td style="padding: 0.6rem 1rem;">
                    ${Utils.escapeHtml(m.name)}
                    ${i === 0 ? ' <span class="badge badge-primary" style="font-size: 0.55rem;">Primary</span>' : ''}
                </td>
                <td style="padding: 0.6rem 1rem;">${typeBadges[m.member_type] || m.member_type}</td>
                <td style="padding: 0.6rem 1rem;">${m.dietary_requirements ? Utils.escapeHtml(m.dietary_requirements) : '<span style="color: var(--text-tertiary);">None</span>'}</td>
                <td style="padding: 0.6rem 1rem; text-align: right; font-weight: 600;">${m.price === 0 ? '<span style="color: var(--success);">FREE</span>' : Utils.formatCurrency(m.price)}</td>
            </tr>
        `).join('');

        const totalPaid = reg.total_amount - (this.data.payment_due || 0);

        const familyHtml = `
            <div class="data-table" style="margin-top: 1.5rem;">
                <div class="table-header">
                    <h3 class="table-title"><i class="fas fa-people-roof"></i> Family Registration Summary</h3>
                    <span class="badge badge-secondary">Registered ${registeredDate}</span>
                </div>
                <div style="padding: 1rem 1.25rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
                        <div style="text-align: center; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 10px;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: #fff;">${reg.member_count}</div>
                            <div style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Family Members</div>
                        </div>
                        <div style="text-align: center; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 10px;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: #fff;">${Utils.formatCurrency(reg.total_amount)}</div>
                            <div style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Total Cost</div>
                        </div>
                        <div style="text-align: center; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 10px;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: #a78bfa;">${planLabels[reg.payment_option] || reg.payment_option}</div>
                            <div style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Payment Plan</div>
                        </div>
                    </div>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Dietary</th>
                                <th style="text-align: right;">Cost</th>
                            </tr>
                        </thead>
                        <tbody>${memberRows}</tbody>
                        <tfoot>
                            <tr style="border-top: 2px solid rgba(255,255,255,0.1);">
                                <td colspan="3" style="padding: 0.75rem 1rem; font-weight: 600;">Total</td>
                                <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; font-size: 1.1rem;">${Utils.formatCurrency(reg.total_amount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('afterend', familyHtml);
    }
};

// Make component globally available
window.AttendeeDashboard = AttendeeDashboard;
