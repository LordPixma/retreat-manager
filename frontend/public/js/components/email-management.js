// frontend/public/js/components/email-management.js
window.EmailManagement = {
    isInitialized: false,
    availableGroups: [],
    availableAttendees: [],

    /**
     * Initialize the email management component
     */
    async init() {
        if (this.isInitialized) return;
        
        console.log('Initializing Email Management...');
        
        // Load required data
        await Promise.all([
            this.loadGroups(),
            this.loadAttendees()
        ]);
        
        this.attachEventListeners();
        this.isInitialized = true;
        
        console.log('Email Management initialized');
    },

    /**
     * Load available groups for targeting
     */
    async loadGroups() {
        try {
            const groups = await API.get('/admin/groups');
            this.availableGroups = groups || [];
        } catch (error) {
            console.error('Failed to load groups:', error);
            this.availableGroups = [];
        }
    },

    /**
     * Load available attendees for individual targeting
     */
    async loadAttendees() {
        try {
            const attendees = await API.get('/admin/attendees');
            this.availableAttendees = (attendees || []).filter(a => a.email);
        } catch (error) {
            console.error('Failed to load attendees:', error);
            this.availableAttendees = [];
        }
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Bulk email button
        const bulkEmailBtn = document.getElementById('bulk-email-btn');
        if (bulkEmailBtn) {
            bulkEmailBtn.addEventListener('click', () => this.showBulkEmailModal());
        }

        // Email test functionality
        const testEmailBtn = document.getElementById('test-email-btn');
        if (testEmailBtn) {
            testEmailBtn.addEventListener('click', () => this.showEmailTestModal());
        }

        // Target audience change handler
        document.addEventListener('change', (e) => {
            if (e.target.id === 'email-audience') {
                this.handleAudienceChange(e.target.value);
            }
        });

        // Form submission handlers
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'bulk-email-form') {
                e.preventDefault();
                this.handleBulkEmailSubmit();
            } else if (e.target.id === 'test-email-form') {
                e.preventDefault();
                this.handleTestEmailSubmit();
            }
        });

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || 
                e.target.classList.contains('modal-close')) {
                this.closeAllModals();
            }
        });
    },

    /**
     * Show bulk email modal
     */
    showBulkEmailModal() {
        this.renderBulkEmailModal();
        const modal = document.getElementById('bulk-email-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Show email test modal
     */
    showEmailTestModal() {
        this.renderEmailTestModal();
        const modal = document.getElementById('email-test-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Render bulk email modal
     */
    renderBulkEmailModal() {
        const existingModal = document.getElementById('bulk-email-modal');
        if (existingModal) existingModal.remove();

        const modalHtml = `
            <div class="modal-overlay hidden" id="bulk-email-modal">
                <div class="modal" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-envelope-bulk"></i> Send Bulk Email
                        </h3>
                        <button type="button" class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="bulk-email-alert" class="alert hidden"></div>
                        
                        <form id="bulk-email-form">
                            <div class="form-group">
                                <label for="email-subject" class="form-label">
                                    <i class="fas fa-tag"></i> Subject
                                </label>
                                <input type="text" id="email-subject" class="form-input" required 
                                       placeholder="Enter email subject...">
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="email-audience" class="form-label">
                                        <i class="fas fa-users"></i> Target Audience
                                    </label>
                                    <select id="email-audience" class="form-input" required>
                                        <option value="all">All Attendees with Email</option>
                                        <option value="vip">VIP Group Only</option>
                                        <option value="groups">Specific Groups</option>
                                        <option value="individuals">Individual Attendees</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="email-type" class="form-label">
                                        <i class="fas fa-flag"></i> Email Type
                                    </label>
                                    <select id="email-type" class="form-input">
                                        <option value="announcement">General Announcement</option>
                                        <option value="urgent">Urgent Notice</option>
                                        <option value="reminder">Reminder</option>
                                        <option value="welcome">Welcome Message</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Target Groups Section -->
                            <div class="form-group hidden" id="target-groups-section">
                                <label class="form-label">
                                    <i class="fas fa-layer-group"></i> Select Groups
                                </label>
                                <div id="email-groups-list" class="form-checkbox-group">
                                    ${this.availableGroups.map(group => `
                                        <label class="checkbox-item">
                                            <input type="checkbox" name="target_groups" value="${group.name}">
                                            <span class="checkbox-label">${group.name}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Individual Attendees Section -->
                            <div class="form-group hidden" id="target-individuals-section">
                                <label class="form-label">
                                    <i class="fas fa-user-check"></i> Select Attendees
                                </label>
                                <div class="attendee-selector">
                                    <input type="text" id="attendee-search" class="form-input" 
                                           placeholder="Search attendees by name or email...">
                                    <div id="email-attendees-list" class="attendee-list">
                                        ${this.availableAttendees.map(attendee => `
                                            <label class="checkbox-item attendee-item">
                                                <input type="checkbox" name="target_attendees" value="${attendee.id}">
                                                <div class="attendee-info">
                                                    <span class="attendee-name">${attendee.name}</span>
                                                    <span class="attendee-email">${attendee.email}</span>
                                                    <span class="attendee-ref">${attendee.ref_number}</span>
                                                </div>
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="email-message" class="form-label">
                                    <i class="fas fa-edit"></i> Message
                                </label>
                                <textarea id="email-message" class="form-input" rows="8" required
                                          placeholder="Enter your email message here...

This message will be formatted nicely and include attendee-specific details like their name and reference number."></textarea>
                                <small class="form-help">
                                    The email will be automatically formatted with the retreat branding and attendee details.
                                </small>
                            </div>

                            <div class="form-group">
                                <div class="email-preview-container">
                                    <button type="button" class="btn btn-secondary btn-sm" id="preview-email-btn">
                                        <i class="fas fa-eye"></i> Preview Email
                                    </button>
                                    <span class="recipient-count" id="recipient-count">Recipients: All attendees with email addresses</span>
                                </div>
                            </div>

                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary modal-close">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-paper-plane"></i> Send Email
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.attachSearchHandler();
    },

    /**
     * Render email test modal
     */
    renderEmailTestModal() {
        const existingModal = document.getElementById('email-test-modal');
        if (existingModal) existingModal.remove();

        const modalHtml = `
            <div class="modal-overlay hidden" id="email-test-modal">
                <div class="modal" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-flask"></i> Test Email System
                        </h3>
                        <button type="button" class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="test-email-alert" class="alert hidden"></div>
                        
                        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                            Send a test email to verify your email system is working correctly.
                        </p>
                        
                        <form id="test-email-form">
                            <div class="form-group">
                                <label for="test-email-address" class="form-label">
                                    <i class="fas fa-envelope"></i> Test Email Address
                                </label>
                                <input type="email" id="test-email-address" class="form-input" required 
                                       placeholder="Enter email address for testing...">
                                <small class="form-help">
                                    We'll send a formatted test email to this address to verify the system is working.
                                </small>
                            </div>

                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary modal-close">
                                    <i class="fas fa-times"></i> Cancel
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-flask"></i> Send Test Email
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Handle audience selection change
     */
    handleAudienceChange(audience) {
        const groupsSection = document.getElementById('target-groups-section');
        const individualsSection = document.getElementById('target-individuals-section');
        const recipientCount = document.getElementById('recipient-count');

        // Hide all sections first
        if (groupsSection) groupsSection.classList.add('hidden');
        if (individualsSection) individualsSection.classList.add('hidden');

        // Show relevant section and update count
        switch (audience) {
            case 'groups':
                if (groupsSection) groupsSection.classList.remove('hidden');
                if (recipientCount) recipientCount.textContent = 'Recipients: Select groups above';
                break;
            case 'individuals':
                if (individualsSection) individualsSection.classList.remove('hidden');
                if (recipientCount) recipientCount.textContent = 'Recipients: Select attendees above';
                break;
            case 'vip':
                if (recipientCount) recipientCount.textContent = 'Recipients: VIP Group members only';
                break;
            default:
                if (recipientCount) recipientCount.textContent = 'Recipients: All attendees with email addresses';
        }
    },

    /**
     * Attach search handler for attendee search
     */
    attachSearchHandler() {
        const searchInput = document.getElementById('attendee-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const attendeeItems = document.querySelectorAll('.attendee-item');
                
                attendeeItems.forEach(item => {
                    const name = item.querySelector('.attendee-name').textContent.toLowerCase();
                    const email = item.querySelector('.attendee-email').textContent.toLowerCase();
                    const ref = item.querySelector('.attendee-ref').textContent.toLowerCase();
                    
                    if (name.includes(query) || email.includes(query) || ref.includes(query)) {
                        item.classList.remove('hidden');
                    } else {
                        item.classList.add('hidden');
                    }
                });
            });
        }
    },

    /**
     * Handle bulk email form submission
     */
    async handleBulkEmailSubmit() {
        const submitBtn = document.querySelector('#bulk-email-form button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            // Collect form data
            const formData = this.collectBulkEmailData();
            
            if (!this.validateBulkEmailData(formData)) {
                return;
            }

            // Send email
            const response = await API.post('/admin/email/send', formData);

            this.showAlert('bulk-email-alert', 
                `Emails sent successfully! ${response.results.successful} sent, ${response.results.failed} failed.`, 
                'success'
            );

            // Auto-close modal after success
            setTimeout(() => {
                this.closeAllModals();
            }, 2000);

        } catch (error) {
            console.error('Failed to send bulk email:', error);
            this.showAlert('bulk-email-alert', error.message || 'Failed to send emails', 'error');
        } finally {
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    },

    /**
     * Handle test email form submission
     */
    async handleTestEmailSubmit() {
        const submitBtn = document.querySelector('#test-email-form button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        try {
            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            const testEmail = document.getElementById('test-email-address').value;

            // Send test email
            const response = await API.post('/email/test', { testEmail });

            this.showAlert('test-email-alert', 
                `Test email sent successfully to ${testEmail}!`, 
                'success'
            );

        } catch (error) {
            console.error('Failed to send test email:', error);
            this.showAlert('test-email-alert', error.message || 'Failed to send test email', 'error');
        } finally {
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    },

    /**
     * Collect bulk email form data
     */
    collectBulkEmailData() {
        const audience = document.getElementById('email-audience').value;
        const subject = document.getElementById('email-subject').value;
        const message = document.getElementById('email-message').value;
        const emailType = document.getElementById('email-type').value;

        let targetData = { target_audience: audience };

        if (audience === 'groups') {
            const selectedGroups = Array.from(document.querySelectorAll('input[name="target_groups"]:checked'))
                .map(cb => cb.value);
            targetData.target_groups = selectedGroups;
        } else if (audience === 'individuals') {
            const selectedAttendees = Array.from(document.querySelectorAll('input[name="target_attendees"]:checked'))
                .map(cb => parseInt(cb.value));
            targetData.attendee_ids = selectedAttendees;
        }

        return {
            subject: subject.trim(),
            message: message.trim(),
            email_type: emailType,
            ...targetData
        };
    },

    /**
     * Validate bulk email data
     */
    validateBulkEmailData(data) {
        if (!data.subject) {
            this.showAlert('bulk-email-alert', 'Subject is required', 'error');
            return false;
        }

        if (!data.message) {
            this.showAlert('bulk-email-alert', 'Message is required', 'error');
            return false;
        }

        if (data.target_audience === 'groups' && (!data.target_groups || data.target_groups.length === 0)) {
            this.showAlert('bulk-email-alert', 'Please select at least one group', 'error');
            return false;
        }

        if (data.target_audience === 'individuals' && (!data.attendee_ids || data.attendee_ids.length === 0)) {
            this.showAlert('bulk-email-alert', 'Please select at least one attendee', 'error');
            return false;
        }

        return true;
    },

    /**
     * Send automatic notification
     */
    async sendNotification(type, attendeeId = null, customData = {}) {
        try {
            const response = await API.post('/admin/email/notifications', {
                notification_type: type,
                attendee_id: attendeeId,
                custom_data: customData
            });

            if (response.success) {
                console.log('Notification sent:', response.message);
                return true;
            } else {
                console.error('Notification failed:', response.message);
                return false;
            }
        } catch (error) {
            console.error('Failed to send notification:', error);
            return false;
        }
    },

    /**
     * Show alert message
     */
    showAlert(containerId, message, type) {
        const container = document.getElementById(containerId);
        if (container) {
            container.className = `alert alert-${type}`;
            container.textContent = message;
            container.classList.remove('hidden');
        }
    },

    /**
     * Close all email modals
     */
    closeAllModals() {
        const modals = ['bulk-email-modal', 'email-test-modal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
            }
        });
        document.body.style.overflow = '';
    }
};