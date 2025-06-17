// frontend/public/js/components/announcement-management.js
const AnnouncementManagement = {
    isEditing: false,
    editingId: null,
    groupsData: [],

    /**
     * Show announcement modal
     */
    async showModal(editData = null, groups = []) {
        this.groupsData = groups;
        this.isEditing = !!editData;
        this.editingId = editData?.id || null;

        try {
            await this.renderModal();
            this.populateForm(editData);
            this.bindEvents();
            this.setupValidation();
        } catch (error) {
            console.error('Failed to show announcement modal:', error);
            Utils.showAlert('Failed to load announcement form', 'error');
        }
    },

    /**
     * Render modal template
     */
    async renderModal() {
        const modalHtml = `
            <div class="modal-overlay" id="announcement-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title" id="announcement-modal-title">Add New Announcement</h3>
                        <button type="button" class="modal-close" id="close-announcement-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="announcement-modal-alert" class="alert alert-error hidden"></div>
                        <form id="announcement-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="announcement-title" class="form-label">
                                        <i class="fas fa-heading"></i> Title
                                    </label>
                                    <input type="text" id="announcement-title" name="title" class="form-input" required 
                                           placeholder="e.g., Dinner Schedule Update">
                                </div>
                                
                                <div class="form-group">
                                    <label for="announcement-type" class="form-label">
                                        <i class="fas fa-tag"></i> Type
                                    </label>
                                    <select id="announcement-type" name="type" class="form-input" required>
                                        <option value="general">General</option>
                                        <option value="urgent">Urgent</option>
                                        <option value="event">Event</option>
                                        <option value="reminder">Reminder</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="announcement-content" class="form-label">
                                    <i class="fas fa-edit"></i> Content
                                </label>
                                <textarea id="announcement-content" name="content" class="form-input" rows="4" required 
                                          placeholder="Enter the announcement content..."></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="announcement-priority" class="form-label">
                                        <i class="fas fa-exclamation"></i> Priority (1-5)
                                    </label>
                                    <input type="number" id="announcement-priority" name="priority" class="form-input" 
                                           min="1" max="5" value="1" required>
                                    <small class="form-help">1 = Low priority, 5 = Highest priority</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="announcement-audience" class="form-label">
                                        <i class="fas fa-users"></i> Target Audience
                                    </label>
                                    <select id="announcement-audience" name="target_audience" class="form-input" required>
                                        <option value="all">All Attendees</option>
                                        <option value="vip">VIP Group Only</option>
                                        <option value="groups">Specific Groups</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group" id="target-groups-section" style="display: none;">
                                <label for="announcement-groups" class="form-label">
                                    <i class="fas fa-layer-group"></i> Select Groups
                                </label>
                                <div id="announcement-groups" class="form-checkbox-group">
                                    <!-- Dynamic group checkboxes will be inserted here -->
                                </div>
                                <small class="form-help">Select which groups should see this announcement</small>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="announcement-starts" class="form-label">
                                        <i class="fas fa-calendar-alt"></i> Start Date/Time (Optional)
                                    </label>
                                    <input type="datetime-local" id="announcement-starts" name="starts_at" class="form-input">
                                    <small class="form-help">Leave blank to show immediately</small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="announcement-expires" class="form-label">
                                        <i class="fas fa-calendar-times"></i> Expiry Date/Time (Optional)
                                    </label>
                                    <input type="datetime-local" id="announcement-expires" name="expires_at" class="form-input">
                                    <small class="form-help">Leave blank to never expire</small>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-checkbox">
                                    <input type="checkbox" id="announcement-active" name="is_active" checked>
                                    <span class="form-checkbox-label">
                                        <i class="fas fa-eye"></i> Active (visible to attendees)
                                    </span>
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-announcement-modal">Cancel</button>
                        <button type="submit" form="announcement-form" class="btn btn-primary" id="save-announcement">
                            <span>Save Announcement</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('announcement-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        document.getElementById('announcement-modal').classList.remove('hidden');
    },

    /**
     * Populate form with data
     */
    populateForm(editData) {
        // Update modal title
        const title = this.isEditing ? 'Edit Announcement' : 'Add New Announcement';
        document.getElementById('announcement-modal-title').textContent = title;

        // Populate group checkboxes
        this.populateGroupCheckboxes();

        // Fill form if editing
        if (editData) {
            document.getElementById('announcement-title').value = editData.title || '';
            document.getElementById('announcement-content').value = editData.content || '';
            document.getElementById('announcement-type').value = editData.type || 'general';
            document.getElementById('announcement-priority').value = editData.priority || 1;
            document.getElementById('announcement-audience').value = editData.target_audience || 'all';
            document.getElementById('announcement-active').checked = editData.is_active !== false;
            
            // Format datetime values
            if (editData.starts_at) {
                document.getElementById('announcement-starts').value = this.formatDatetimeLocal(editData.starts_at);
            }
            if (editData.expires_at) {
                document.getElementById('announcement-expires').value = this.formatDatetimeLocal(editData.expires_at);
            }
            
            // Handle target groups
            if (editData.target_audience === 'groups' && editData.target_groups) {
                this.showTargetGroupsSection();
                editData.target_groups.forEach(groupId => {
                    const checkbox = document.querySelector(`#group-${groupId}`);
                    if (checkbox) checkbox.checked = true;
                });
            }
        } else {
            // Reset form for new announcement
            document.getElementById('announcement-form').reset();
            document.getElementById('announcement-priority').value = 1;
            document.getElementById('announcement-active').checked = true;
        }
        
        // Update target groups visibility
        this.updateTargetGroupsVisibility();
    },

    /**
     * Populate group checkboxes
     */
    populateGroupCheckboxes() {
        const container = document.getElementById('announcement-groups');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.groupsData.forEach(group => {
            const checkboxHtml = `
                <label class="form-checkbox">
                    <input type="checkbox" id="group-${group.id}" value="${group.id}">
                    <span class="form-checkbox-label">${Utils.escapeHtml(group.name)}</span>
                </label>
            `;
            container.insertAdjacentHTML('beforeend', checkboxHtml);
        });
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form submission
        document.getElementById('announcement-form').addEventListener('submit', this.handleSubmit.bind(this));
        
        // Close buttons
        document.getElementById('close-announcement-modal').addEventListener('click', this.hideModal.bind(this));
        document.getElementById('cancel-announcement-modal').addEventListener('click', this.hideModal.bind(this));
        
        // Target audience change
        document.getElementById('announcement-audience').addEventListener('change', this.updateTargetGroupsVisibility.bind(this));
        
        // Close on overlay click
        document.getElementById('announcement-modal').addEventListener('click', (e) => {
            if (e.target.id === 'announcement-modal') {
                this.hideModal();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    },

    /**
     * Update target groups section visibility
     */
    updateTargetGroupsVisibility() {
        const audience = document.getElementById('announcement-audience').value;
        const section = document.getElementById('target-groups-section');
        
        if (audience === 'groups') {
            this.showTargetGroupsSection();
        } else {
            this.hideTargetGroupsSection();
        }
    },

    showTargetGroupsSection() {
        const section = document.getElementById('target-groups-section');
        section.style.display = 'block';
    },

    hideTargetGroupsSection() {
        const section = document.getElementById('target-groups-section');
        section.style.display = 'none';
        // Uncheck all group checkboxes
        document.querySelectorAll('#announcement-groups input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    },

    /**
     * Handle form submission
     */
    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Convert values
        data.priority = parseInt(data.priority);
        data.is_active = document.getElementById('announcement-active').checked;
        
        // Handle target groups
        if (data.target_audience === 'groups') {
            const selectedGroups = [];
            document.querySelectorAll('#announcement-groups input[type="checkbox"]:checked').forEach(cb => {
                selectedGroups.push(parseInt(cb.value));
            });
            data.target_groups = selectedGroups;
        } else {
            delete data.target_groups;
        }
        
        // Convert empty dates to null
        ['starts_at', 'expires_at'].forEach(field => {
            if (!data[field]) {
                data[field] = null;
            }
        });

        const submitBtn = document.getElementById('save-announcement');
        
        try {
            Utils.showLoading(submitBtn);
            
            const endpoint = this.isEditing ? `/admin/announcements/${this.editingId}` : '/admin/announcements';
            const method = this.isEditing ? 'PUT' : 'POST';
            
            await API.request(endpoint, {
                method,
                body: JSON.stringify(data)
            });
            
            const action = this.isEditing ? 'updated' : 'created';
            Utils.showAlert(`Announcement ${action} successfully`, 'success');
            
            this.hideModal();
            
            // Refresh admin dashboard if available
            if (window.AdminDashboard) {
                await AdminDashboard.refresh();
            }
            
        } catch (error) {
            this.showAlert(error.message, 'error');
        } finally {
            Utils.hideLoading(submitBtn);
        }
    },

    /**
     * Validate form
     */
    validateForm() {
        let isValid = true;
        
        // Clear previous alerts
        this.hideAlert();
        
        // Required fields
        const requiredFields = [
            { id: 'announcement-title', name: 'Title' },
            { id: 'announcement-content', name: 'Content' },
            { id: 'announcement-type', name: 'Type' },
            { id: 'announcement-priority', name: 'Priority' }
        ];
        
        requiredFields.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input.value.trim()) {
                this.showFieldError(input, `${field.name} is required`);
                isValid = false;
            } else {
                this.clearFieldError(input);
            }
        });
        
        // Validate priority range
        const priority = parseInt(document.getElementById('announcement-priority').value);
        if (priority < 1 || priority > 5) {
            const input = document.getElementById('announcement-priority');
            this.showFieldError(input, 'Priority must be between 1 and 5');
            isValid = false;
        }
        
        // Validate target groups if needed
        const audience = document.getElementById('announcement-audience').value;
        if (audience === 'groups') {
            const checkedGroups = document.querySelectorAll('#announcement-groups input[type="checkbox"]:checked');
            if (checkedGroups.length === 0) {
                this.showAlert('Please select at least one group', 'error');
                isValid = false;
            }
        }
        
        return isValid;
    },

    /**
     * Setup real-time validation
     */
    setupValidation() {
        const inputs = document.querySelectorAll('#announcement-form .form-input');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    },

    /**
     * Validate individual field
     */
    validateField(input) {
        const value = input.value.trim();
        
        switch (input.id) {
            case 'announcement-title':
            case 'announcement-content':
                if (!value) {
                    this.showFieldError(input, 'This field is required');
                    return false;
                }
                break;
                
            case 'announcement-priority':
                const priority = parseInt(value);
                if (!value || priority < 1 || priority > 5) {
                    this.showFieldError(input, 'Priority must be between 1 and 5');
                    return false;
                }
                break;
        }
        
        this.clearFieldError(input);
        return true;
    },

    /**
     * Utility methods
     */
    formatDatetimeLocal(datetime) {
        const date = new Date(datetime);
        return date.toISOString().slice(0, 16);
    },

    showFieldError(input, message) {
        input.classList.add('invalid');
        
        const existingError = input.parentNode.querySelector('.form-validation-message');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-validation-message error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        input.parentNode.appendChild(errorDiv);
    },

    clearFieldError(input) {
        input.classList.remove('invalid');
        
        const errorMessage = input.parentNode.querySelector('.form-validation-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    },

    showAlert(message, type = 'error') {
        const alert = document.getElementById('announcement-modal-alert');
        if (alert) {
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
            alert.classList.remove('hidden');
        }
    },

    hideAlert() {
        const alert = document.getElementById('announcement-modal-alert');
        if (alert) {
            alert.classList.add('hidden');
        }
    },

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.hideModal();
        }
    },

    hideModal() {
        const modal = document.getElementById('announcement-modal');
        if (modal) {
            modal.remove();
        }
        
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        
        this.isEditing = false;
        this.editingId = null;
    }
};

// Make component globally available
window.AnnouncementManagement = AnnouncementManagement;
