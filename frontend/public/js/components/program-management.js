// frontend/public/js/components/program-management.js
const ProgramManagement = {
    isEditing: false,
    editingId: null,

    /**
     * Show program item modal
     */
    async showModal(editData = null) {
        this.isEditing = !!editData;
        this.editingId = editData?.id || null;

        try {
            await this.renderModal();
            this.populateForm(editData);
            this.bindEvents();
        } catch (error) {
            console.error('Failed to show program modal:', error);
            Utils.showAlert('Failed to load program form', 'error');
        }
    },

    /**
     * Render modal template
     */
    async renderModal() {
        const opts = (list) => list
            .map(o => `<option value="${this.escapeHtml(o.value)}">${this.escapeHtml(o.label)}</option>`)
            .join('');
        const typeOptions = opts(Utils.program.eventTypes);
        const audienceOptions = opts(Utils.program.audiences);
        const priorityOptions = opts(Utils.program.priorities);

        const modalHtml = `
            <div class="modal-overlay" id="program-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title" id="program-modal-title">Add Program Item</h3>
                        <button type="button" class="modal-close" id="close-program-modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div id="program-modal-alert" class="alert alert-error hidden"></div>
                        <form id="program-form">
                            <div class="form-group">
                                <label for="program-date" class="form-label">
                                    <i class="fas fa-calendar-day"></i> Date
                                </label>
                                <input type="date" id="program-date" name="event_date" class="form-input" required>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="program-start" class="form-label">
                                        <i class="fas fa-clock"></i> Start time
                                    </label>
                                    <input type="time" id="program-start" name="start_time" class="form-input">
                                </div>

                                <div class="form-group">
                                    <label for="program-end" class="form-label">
                                        <i class="fas fa-clock"></i> End time (Optional)
                                    </label>
                                    <input type="time" id="program-end" name="end_time" class="form-input">
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="program-title" class="form-label">
                                    <i class="fas fa-heading"></i> Title
                                </label>
                                <input type="text" id="program-title" name="title" class="form-input" required
                                       placeholder="e.g., Welcome Session">
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="program-type" class="form-label">
                                        <i class="fas fa-tag"></i> Event type
                                    </label>
                                    <select id="program-type" name="event_type" class="form-input">
                                        ${typeOptions}
                                    </select>
                                    <small class="form-help">Sets the icon shown on the schedule</small>
                                </div>

                                <div class="form-group">
                                    <label for="program-audience" class="form-label">
                                        <i class="fas fa-users"></i> Audience
                                    </label>
                                    <select id="program-audience" name="audience" class="form-input">
                                        ${audienceOptions}
                                    </select>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label for="program-priority" class="form-label">
                                        <i class="fas fa-flag"></i> Priority
                                    </label>
                                    <select id="program-priority" name="priority" class="form-input">
                                        ${priorityOptions}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="program-location" class="form-label">
                                        <i class="fas fa-location-dot"></i> Location (Optional)
                                    </label>
                                    <input type="text" id="program-location" name="location" class="form-input"
                                           placeholder="e.g., Main Hall">
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="program-contact" class="form-label">
                                    <i class="fas fa-user"></i> Key contact (Optional)
                                </label>
                                <input type="text" id="program-contact" name="contact_name" class="form-input"
                                       placeholder="e.g., Jane Smith">
                            </div>

                            <div class="form-group">
                                <label for="program-description" class="form-label">
                                    <i class="fas fa-edit"></i> Description (Optional)
                                </label>
                                <textarea id="program-description" name="description" class="form-input" rows="3"
                                          placeholder="Additional details about this item..."></textarea>
                            </div>

                            <div class="form-group">
                                <label for="program-order" class="form-label">
                                    <i class="fas fa-sort-numeric-down"></i> Order (Optional)
                                </label>
                                <input type="number" id="program-order" name="sort_order" class="form-input" min="0">
                                <small class="form-help">Leave blank to append to the end of the list</small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancel-program-modal">Cancel</button>
                        <button type="submit" form="program-form" class="btn btn-primary" id="save-program">
                            <span>Save Program Item</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if present
        const existingModal = document.getElementById('program-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        document.getElementById('program-modal').classList.remove('hidden');
    },

    /**
     * Populate form with data
     */
    populateForm(editData) {
        // Update modal title
        const title = this.isEditing ? 'Edit Program Item' : 'Add Program Item';
        document.getElementById('program-modal-title').textContent = title;

        // Fill form if editing
        if (editData) {
            document.getElementById('program-date').value = editData.event_date || '';
            document.getElementById('program-start').value = editData.start_time || '';
            document.getElementById('program-end').value = editData.end_time || '';
            document.getElementById('program-title').value = editData.title || '';
            document.getElementById('program-type').value = editData.event_type || 'general';
            document.getElementById('program-audience').value = editData.audience || 'all';
            document.getElementById('program-priority').value = editData.priority || 'normal';
            document.getElementById('program-location').value = editData.location || '';
            document.getElementById('program-contact').value = editData.contact_name || '';
            document.getElementById('program-description').value = editData.description || '';
            document.getElementById('program-order').value =
                editData.sort_order != null ? editData.sort_order : '';
        } else {
            document.getElementById('program-form').reset();
            // reset() selects each <select>'s first option; make the intended
            // defaults explicit (event_type starts at "Meal", priority at "Low").
            document.getElementById('program-type').value = 'general';
            document.getElementById('program-audience').value = 'all';
            document.getElementById('program-priority').value = 'normal';
        }
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form submission
        document.getElementById('program-form').addEventListener('submit', this.handleSubmit.bind(this));

        // Close buttons
        document.getElementById('close-program-modal').addEventListener('click', this.hideModal.bind(this));
        document.getElementById('cancel-program-modal').addEventListener('click', this.hideModal.bind(this));

        // Close on overlay click
        document.getElementById('program-modal').addEventListener('click', (e) => {
            if (e.target.id === 'program-modal') {
                this.hideModal();
            }
        });

        // Escape key to close — keep the bound reference so removeEventListener works.
        this._boundHandleKeyDown = this._boundHandleKeyDown || this.handleKeyDown.bind(this);
        document.addEventListener('keydown', this._boundHandleKeyDown);
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

        // Trim text fields; drop empty optionals so the backend defaults apply.
        ['event_date', 'start_time', 'end_time', 'title', 'location', 'contact_name', 'description'].forEach(field => {
            if (typeof data[field] === 'string') {
                data[field] = data[field].trim();
            }
        });
        // event_date and the three selects always carry a value; everything
        // else is dropped when empty so the backend stores NULL / its default.
        ['start_time', 'end_time', 'location', 'contact_name', 'description'].forEach(field => {
            if (!data[field]) delete data[field];
        });

        // sort_order: send as number when provided, otherwise omit so it
        // auto-appends to the end server-side.
        if (data.sort_order === '' || data.sort_order == null) {
            delete data.sort_order;
        } else {
            data.sort_order = parseInt(data.sort_order, 10);
        }

        const submitBtn = document.getElementById('save-program');

        try {
            Utils.showLoading(submitBtn);

            if (this.isEditing) {
                await API.put('/admin/program/' + this.editingId, data);
            } else {
                await API.post('/admin/program', data);
            }

            const action = this.isEditing ? 'updated' : 'created';
            Utils.showAlert(`Program item ${action} successfully`, 'success');

            this.hideModal();

            // Refresh admin dashboard list if available
            if (window.AdminDashboard) {
                await window.AdminDashboard.loadProgram()
                    .then(() => window.AdminDashboard.updateProgramDisplay())
                    .catch(() => {});
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
            { id: 'program-date', name: 'Date' },
            { id: 'program-title', name: 'Title' }
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

        return isValid;
    },

    /**
     * Utility methods
     */
    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    showFieldError(input, message) {
        input.classList.add('invalid');

        const existingError = input.parentNode.querySelector('.form-validation-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-validation-message error';
        errorDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span class="form-validation-text"></span>';
        errorDiv.querySelector('.form-validation-text').textContent = message;
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
        const alert = document.getElementById('program-modal-alert');
        if (alert) {
            alert.className = `alert alert-${type}`;
            alert.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span class="alert-msg"></span>';
            alert.querySelector('.alert-msg').textContent = message;
            alert.classList.remove('hidden');
        }
    },

    hideAlert() {
        const alert = document.getElementById('program-modal-alert');
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
        const modal = document.getElementById('program-modal');
        if (modal) {
            modal.remove();
        }

        if (this._boundHandleKeyDown) {
            document.removeEventListener('keydown', this._boundHandleKeyDown);
        }

        this.isEditing = false;
        this.editingId = null;
    }
};

// Make component globally available
window.ProgramManagement = ProgramManagement;
