// frontend/public/js/components/email-management.js
window.EmailManagement = {
    isInitialized: false,
    eventListenersAttached: false,
    availableGroups: [],
    availableAttendees: [],

    /**
     * Initialize the email management component
     */
    async init() {
        if (this.isInitialized) {
            console.log('EmailManagement already initialized');
            return;
        }
        
        console.log('Initializing Email Management...');
        
        try {
            // Load required data with timeout
            const loadPromises = [
                this.loadGroups(),
                this.loadAttendees()
            ];
            
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Initialization timeout')), 10000)
            );
            
            await Promise.race([
                Promise.all(loadPromises),
                timeoutPromise
            ]);
            
            this.attachEventListeners();
            this.updateEmailStats();
            this.isInitialized = true;
            
            console.log('Email Management initialized successfully');
        } catch (error) {
            console.error('Email Management initialization failed:', error);
            this.isInitialized = false;
            
            // Set some defaults so the component can still work partially
            this.availableGroups = [];
            this.availableAttendees = [];
            
            // Still attach event listeners
            this.attachEventListeners();
            
            throw error; // Re-throw to let caller handle
        }
    },

    /**
     * Ensure initialization before operations
     */
    async ensureInitialized() {
        if (!this.isInitialized) {
            console.log('EmailManagement not initialized, initializing now...');
            await this.init();
        }
    },

    /**
     * Load available groups for targeting
     */
    async loadGroups() {
        try {
            const response = await fetch('/api/admin/groups', {
                headers: {
                    'Authorization': `Bearer ${Auth.getToken('admin')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load groups: ${response.status}`);
            }
            
            const data = await response.json();
            this.availableGroups = data.data || data || [];
            console.log(`Loaded ${this.availableGroups.length} groups`);
        } catch (error) {
            console.error('Failed to load groups:', error);
            this.availableGroups = [];
            // Don't throw - allow component to work without groups
        }
    },

    /**
     * Load available attendees for individual targeting
     */
    async loadAttendees() {
        try {
            const response = await fetch('/api/admin/attendees', {
                headers: {
                    'Authorization': `Bearer ${Auth.getToken('admin')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load attendees: ${response.status}`);
            }
            
            const data = await response.json();
            const attendees = data.data || data || [];
            this.availableAttendees = attendees.filter(a => a.email);
            console.log(`Loaded ${this.availableAttendees.length} attendees with email`);
        } catch (error) {
            console.error('Failed to load attendees:', error);
            this.availableAttendees = [];
            // Don't throw - allow component to work without attendees
        }
    },

    /**
     * Update email statistics in the dashboard
     */
    async updateEmailStats() {
        try {
            // Update attendees with email count
            const attendeesWithEmailEl = document.getElementById('attendees-with-email');
            if (attendeesWithEmailEl) {
                attendeesWithEmailEl.textContent = this.availableAttendees.length;
            }

            // Set other stats (placeholder values for now)
            const totalEmailsSentEl = document.getElementById('total-emails-sent');
            if (totalEmailsSentEl) {
                totalEmailsSentEl.textContent = '0';
            }

            const pendingNotificationsEl = document.getElementById('pending-notifications');
            if (pendingNotificationsEl) {
                pendingNotificationsEl.textContent = '0';
            }
        } catch (error) {
            console.error('Failed to update email stats:', error);
        }
    },

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        if (this.eventListenersAttached) {
            return;
        }

        // Header buttons
        this.attachButtonListener('test-email-btn', () => this.showEmailTestModal());
        this.attachButtonListener('bulk-email-btn', () => this.showBulkEmailModal());
        
        // Action card buttons
        this.attachButtonListener('bulk-email-action-btn', () => this.showBulkEmailModal());
        this.attachButtonListener('test-email-action-btn', () => this.showEmailTestModal());
        this.attachButtonListener('payment-reminders-btn', () => this.sendPaymentReminders());
        this.attachButtonListener('welcome-emails-btn', () => this.showWelcomeEmailInfo());

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
            } else if (e.target.id === 'individual-email-form') {
                e.preventDefault();
                const attendeeId = e.target.dataset.attendeeId;
                this.handleIndividualEmailSubmit(e.target, attendeeId);
            }
        });

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') ||
                e.target.classList.contains('modal-close')) {
                this.closeAllModals();
            }
        });

        this.eventListenersAttached = true;
    },

    /**
     * Attach button listener safely
     */
    attachButtonListener(buttonId, handler) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', handler);
        }
    },

    /**
     * Show individual email modal
     */
    async showIndividualEmailModal(attendeeId, email, name) {
        try {
            // Ensure we're initialized first
            await this.ensureInitialized();
            
            this.renderIndividualEmailModal(attendeeId, email, name);
            const modal = document.getElementById('individual-email-modal');
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        } catch (error) {
            console.error('Failed to show email modal:', error);
            Utils.showAlert('Failed to open email form. Please try again.', 'error');
        }
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
     * Render individual email modal
     */
    renderIndividualEmailModal(attendeeId, email, name) {
        const existingModal = document.getElementById('individual-email-modal');
        if (existingModal) existingModal.remove();

        const modalHtml = `
            <div class="modal-overlay hidden" id="individual-email-modal">
                <div class="modal" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-envelope"></i> Send Email to ${this.escapeHtml(name)}
                        </h3>
                        <button type="button" class="modal-close" onclick="EmailManagement.closeAllModals()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" style="padding: 2rem; padding-bottom: 1rem;">
                        <div id="individual-email-alert" class="alert hidden"></div>
                        
                        <!-- Recipient Info -->
                        <div class="recipient-info" style="background: var(--background); padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1.5rem;">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <div style="background: var(--primary); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i class="fas fa-user"></i>
                                </div>
                                <div>
                                    <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(name)}</div>
                                    <div style="color: var(--text-secondary); font-size: 0.9rem;">${this.escapeHtml(email)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <form id="individual-email-form" data-attendee-id="${attendeeId}">
                            <div class="form-group">
                                <label for="individual-email-subject" class="form-label">
                                    <i class="fas fa-tag"></i> Subject
                                </label>
                                <input type="text" id="individual-email-subject" class="form-input" required 
                                       placeholder="Enter email subject...">
                            </div>

                            <div class="form-group">
                                <label for="individual-email-type" class="form-label">
                                    <i class="fas fa-flag"></i> Email Type
                                </label>
                                <select id="individual-email-type" class="form-input">
                                    <option value="announcement">General Message</option>
                                    <option value="reminder">Reminder</option>
                                    <option value="urgent">Urgent Notice</option>
                                    <option value="payment">Payment Related</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="individual-email-message" class="form-label">
                                    <i class="fas fa-edit"></i> Message
                                </label>
                                <textarea id="individual-email-message" class="form-input" rows="8" required
                                          placeholder="Enter your personal message to ${this.escapeHtml(name)}..."></textarea>
                                <small class="form-help">
                                    The email will include the attendee's name, reference number, and any room/group assignments.
                                </small>
                            </div>

                            <!-- Quick Message Templates -->
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="fas fa-bolt"></i> Quick Templates
                                </label>
                                <div class="template-buttons" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                    <button type="button" class="btn btn-sm btn-secondary" onclick="EmailManagement.insertTemplate('welcome')">
                                        Welcome Message
                                    </button>
                                    <button type="button" class="btn btn-sm btn-secondary" onclick="EmailManagement.insertTemplate('payment')">
                                        Payment Reminder
                                    </button>
                                    <button type="button" class="btn btn-sm btn-secondary" onclick="EmailManagement.insertTemplate('checkin')">
                                        Check-in Info
                                    </button>
                                    <button type="button" class="btn btn-sm btn-secondary" onclick="EmailManagement.insertTemplate('update')">
                                        General Update
                                    </button>
                                </div>
                            </div>

                            <div class="form-actions" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                                <button type="button" class="btn btn-secondary" onclick="EmailManagement.closeAllModals()">
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
    },

    /**
     * Render bulk email modal
     */
    renderBulkEmailModal() {
        const existingModal = document.getElementById('bulk-email-modal');
        if (existingModal) existingModal.remove();

        const modalHtml = `
            <div class="modal-overlay hidden" id="bulk-email-modal">
                <div class="modal" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-envelope-bulk"></i> Send Bulk Email
                        </h3>
                        <button type="button" class="modal-close" onclick="EmailManagement.closeAllModals()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" style="padding: 2rem; padding-bottom: 1rem;">
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
                                    <span class="recipient-count" id="recipient-count">Recipients: All attendees with email addresses</span>
                                </div>
                            </div>

                            <div class="form-actions" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                                <button type="button" class="btn btn-secondary" onclick="EmailManagement.closeAllModals()">
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
                        <button type="button" class="modal-close" onclick="EmailManagement.closeAllModals()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" style="padding: 2rem;">
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

                            <div class="form-actions" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                                <button type="button" class="btn btn-secondary" onclick="EmailManagement.closeAllModals()">
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
        const recipientCount = document.getElementById('recipient-count');

        // Hide all sections first
        if (groupsSection) groupsSection.classList.add('hidden');

        // Show relevant section and update count
        switch (audience) {
            case 'groups':
                if (groupsSection) groupsSection.classList.remove('hidden');
                if (recipientCount) recipientCount.textContent = 'Recipients: Select groups above';
                break;
            case 'vip':
                if (recipientCount) recipientCount.textContent = 'Recipients: VIP Group members only';
                break;
            default:
                if (recipientCount) recipientCount.textContent = 'Recipients: All attendees with email addresses';
        }
    },

    /**
     * Handle individual email form submission
     */
    async handleIndividualEmailSubmit(form, attendeeId) {
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        try {
            // Disable form
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            
            const formData = {
                attendee_id: attendeeId,
                subject: document.getElementById('individual-email-subject').value.trim(),
                message: document.getElementById('individual-email-message').value.trim(),
                email_type: document.getElementById('individual-email-type').value
            };
            
            // Validate
            if (!formData.subject) {
                throw new Error('Subject is required');
            }
            if (!formData.message) {
                throw new Error('Message is required');
            }
            
            const response = await fetch('/api/admin/email/individual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken('admin')}`
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.showModalAlert('individual-email-alert', 'Email sent successfully!', 'success');
                
                // Close modal after 2 seconds
                setTimeout(() => {
                    this.closeAllModals();
                    Utils.showAlert('Email sent successfully!', 'success');
                }, 2000);
                
                // Update stats
                this.updateEmailStats();
            } else {
                throw new Error(result.error || 'Failed to send email');
            }
        } catch (error) {
            console.error('Email sending error:', error);
            this.showModalAlert('individual-email-alert', 
                error.message || 'Failed to send email. Please try again.', 
                'error'
            );
        } finally {
            // Re-enable form
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
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

            // Send email via API
            const response = await API.post('/admin/email/send', formData);
            
            this.showModalAlert('bulk-email-alert', 
                `Emails sent successfully to ${response.results.successful} attendees!`, 
                'success'
            );

            // Auto-close modal after success
            setTimeout(() => {
                this.closeAllModals();
                Utils.showAlert(`Bulk email sent to ${response.results.successful} attendees!`, 'success');
            }, 2000);

        } catch (error) {
            console.error('Failed to send bulk email:', error);
            this.showModalAlert('bulk-email-alert', error.message || 'Failed to send emails', 'error');
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

            // Send test email via API
            const response = await API.post('/email/test', { testEmail });
            
            this.showModalAlert('test-email-alert', 
                `Test email sent successfully to ${testEmail}!`, 
                'success'
            );

            // Close modal after 3 seconds
            setTimeout(() => {
                this.closeAllModals();
            }, 3000);

        } catch (error) {
            console.error('Failed to send test email:', error);
            this.showModalAlert('test-email-alert', error.message || 'Failed to send test email', 'error');
        } finally {
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    },

    /**
     * Send payment reminders
     */
    async sendPaymentReminders() {
        if (confirm('Send payment reminders to all attendees with outstanding balances?')) {
            try {
                const response = await API.post('/admin/email/notifications', {
                    notification_type: 'payment_reminder'
                });
                
                if (response.success) {
                    Utils.showAlert(`Payment reminders sent to ${response.results.successful} attendees!`, 'success');
                } else {
                    Utils.showAlert('Failed to send payment reminders: ' + response.message, 'error');
                }
            } catch (error) {
                console.error('Failed to send payment reminders:', error);
                Utils.showAlert('Failed to send payment reminders: ' + error.message, 'error');
            }
        }
    },

    /**
     * Show welcome email info
     */
    showWelcomeEmailInfo() {
        if (confirm('Send welcome emails to attendees who haven\'t received them yet?')) {
            Utils.showAlert('Welcome email feature will be enhanced to send to specific attendees. For now, welcome emails are sent automatically when creating new attendees.', 'info');
        }
    },

    /**
     * Insert email template
     */
    insertTemplate(templateType) {
        const messageTextarea = document.getElementById('individual-email-message');
        const subjectInput = document.getElementById('individual-email-subject');
        const typeSelect = document.getElementById('individual-email-type');
        
        const templates = {
            welcome: {
                subject: 'Welcome to Growth and Wisdom Retreat!',
                message: `Welcome to the Growth and Wisdom Retreat!

We're excited to have you join us for this transformative experience. Here are some important details for your upcoming retreat:

- Check-in begins at 3:00 PM on the first day
- Please bring comfortable clothing and any personal items you need
- All meals will be provided during your stay
- Feel free to reach out if you have any questions

Looking forward to seeing you soon!

Best regards,
The Retreat Team`,
                type: 'announcement'
            },
            payment: {
                subject: 'Payment Reminder - Growth and Wisdom Retreat',
                message: `I hope this message finds you well.

This is a friendly reminder regarding your outstanding payment for the Growth and Wisdom Retreat. 

Please let us know if you have any questions about your payment or if you need assistance with payment arrangements.

Thank you for your attention to this matter.

Best regards,
The Retreat Team`,
                type: 'payment'
            },
            checkin: {
                subject: 'Check-in Information - Growth and Wisdom Retreat',
                message: `Your retreat check-in information:

📅 Check-in Date: [Please update with specific date]
🕒 Check-in Time: 3:00 PM onwards
📍 Location: [Please update with specific location]

What to bring:
- Valid ID for check-in
- Comfortable clothing for activities
- Personal toiletries
- Any medications you need

We're looking forward to welcoming you!

Best regards,
The Retreat Team`,
                type: 'reminder'
            },
            update: {
                subject: 'Important Update - Growth and Wisdom Retreat',
                message: `I wanted to reach out with an important update regarding your upcoming retreat.

[Please add your specific update information here]

If you have any questions or concerns, please don't hesitate to contact us.

Best regards,
The Retreat Team`,
                type: 'announcement'
            }
        };
        
        const template = templates[templateType];
        if (template && messageTextarea && subjectInput && typeSelect) {
            subjectInput.value = template.subject;
            messageTextarea.value = template.message;
            typeSelect.value = template.type;
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
            this.showModalAlert('bulk-email-alert', 'Subject is required', 'error');
            return false;
        }

        if (!data.message) {
            this.showModalAlert('bulk-email-alert', 'Message is required', 'error');
            return false;
        }

        if (data.target_audience === 'groups' && (!data.target_groups || data.target_groups.length === 0)) {
            this.showModalAlert('bulk-email-alert', 'Please select at least one group', 'error');
            return false;
        }

        return true;
    },

    /**
     * Show modal alert message
     */
    showModalAlert(containerId, message, type) {
        const container = document.getElementById(containerId);
        if (container) {
            container.className = `alert alert-${type}`;
            container.textContent = message;
            container.classList.remove('hidden');
            
            // Auto-hide error messages after 5 seconds
            if (type === 'error') {
                setTimeout(() => {
                    container.classList.add('hidden');
                }, 5000);
            }
        }
    },

    /**
     * Show general alert (delegates to Utils.showAlert)
     */
    showAlert(message, type) {
        if (window.Utils && window.Utils.showAlert) {
            Utils.showAlert(message, type);
        } else {
            // Fallback to console if Utils not available
            console[type === 'error' ? 'error' : 'log'](message);
        }
    },

    /**
     * Close all email modals
     */
    closeAllModals() {
        const modals = ['bulk-email-modal', 'email-test-modal', 'individual-email-modal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
                // Also remove the modal to clean up DOM
                setTimeout(() => {
                    if (modal && modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            }
        });
        document.body.style.overflow = '';
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Format date for display
     */
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Reload component data (for refreshing after actions)
     */
    async reload() {
        this.isInitialized = false;
        await this.init();
    }
};
