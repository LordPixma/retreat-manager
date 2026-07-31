const AttendeeManagement = {
    isEditing: false,
    editingId: null,
    roomsData: [],
    groupsData: [],

    /**
     * Show attendee modal
     */
    async showModal(editData = null, rooms = [], groups = []) {
        this.roomsData = rooms;
        this.groupsData = groups;
        this.isEditing = !!editData;
        this.editingId = editData?.id || null;

        try {
            await this.renderModal();
            this.populateForm(editData);
            this.bindEvents();
            this.setupValidation();
        } catch (error) {
            console.error('Failed to show attendee modal:', error);
            Utils.showAlert('Failed to load form', 'error');
        }
    },

    /**
     * Render modal template
     */
    async renderModal() {
        const modalHtml = await Utils.loadTemplate('templates/modals/attendee-modal.html');
        
        // Remove existing modal if present
        const existingModal = document.getElementById('attendee-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        document.getElementById('attendee-modal').classList.remove('hidden');
    },

    /**
     * Populate form with data
     */
    populateForm(editData) {
        // Update modal title
        const title = this.isEditing ? 'Edit Attendee' : 'Add New Attendee';
        document.getElementById('attendee-modal-title').textContent = title;

        // Populate room dropdown
        this.populateRoomDropdown();
        
        // Populate group dropdown
        this.populateGroupDropdown();

        // Fill form if editing
        if (editData) {
            document.getElementById('attendee-name').value = editData.name || '';
            document.getElementById('attendee-email').value = editData.email || '';
            document.getElementById('attendee-first-name').value = editData.first_name || '';
            document.getElementById('attendee-last-name').value = editData.last_name || '';
            document.getElementById('attendee-dob').value = editData.date_of_birth || '';
            const genderSelect = document.getElementById('attendee-gender');
            if (genderSelect) genderSelect.value = (editData.gender || '').toLowerCase();
            document.getElementById('attendee-ref').value = editData.ref_number || '';
            document.getElementById('attendee-payment').value = editData.payment_due || 0;
            document.getElementById('attendee-payment-option').value = editData.payment_option || 'full';
            document.getElementById('attendee-room').value = editData.room_id || '';
            document.getElementById('attendee-group').value = editData.group_id || '';

            // Editing: the profile form must NOT carry a password. Hide the
            // password input entirely (so nothing — including browser autofill —
            // can ride along and silently reset it) and offer an explicit
            // "Reset Password" action instead.
            const passwordInput = document.getElementById('attendee-password');
            passwordInput.required = false;
            passwordInput.value = '';
            passwordInput.disabled = true; // disabled fields are excluded from FormData
            document.getElementById('attendee-password-group').classList.add('hidden');
            document.getElementById('attendee-reset-group').classList.remove('hidden');
        } else {
            // Reset form for new attendee
            document.getElementById('attendee-form').reset();
            const passwordInput = document.getElementById('attendee-password');
            passwordInput.disabled = false;
            passwordInput.required = true;
            document.getElementById('attendee-password-group').classList.remove('hidden');
            document.getElementById('attendee-reset-group').classList.add('hidden');
        }
    },

    /**
     * Populate room dropdown
     */
    populateRoomDropdown() {
        const roomSelect = document.getElementById('attendee-room');
        roomSelect.innerHTML = '<option value="">No room assigned</option>';
        
        this.roomsData.forEach(room => {
            const option = document.createElement('option');
            option.value = room.id;
            option.textContent = `${room.number}${room.description ? ' - ' + room.description : ''}`;
            roomSelect.appendChild(option);
        });
    },

    /**
     * Populate group dropdown
     */
    populateGroupDropdown() {
        const groupSelect = document.getElementById('attendee-group');
        groupSelect.innerHTML = '<option value="">No group assigned</option>';
        
        this.groupsData.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            groupSelect.appendChild(option);
        });
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form submission
        document.getElementById('attendee-form').addEventListener('submit', this.handleSubmit.bind(this));

        // Explicit password reset (edit mode only)
        const resetBtn = document.getElementById('attendee-reset-password-btn');
        if (resetBtn) resetBtn.addEventListener('click', this.handleResetPassword.bind(this));
        
        // Close buttons
        document.getElementById('close-attendee-modal').addEventListener('click', this.hideModal.bind(this));
        document.getElementById('cancel-attendee-modal').addEventListener('click', this.hideModal.bind(this));
        
        // Close on overlay click
        document.getElementById('attendee-modal').addEventListener('click', (e) => {
            if (e.target.id === 'attendee-modal') {
                this.hideModal();
            }
        });

        // Escape key to close — bind once and keep the reference so the
        // matching removeEventListener actually finds and removes it.
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
        
        // Convert numeric fields
        if (data.payment_due) {
            data.payment_due = parseFloat(data.payment_due);
        }
        
        // Convert empty strings to null for optional fields
        ['room_id', 'group_id', 'email', 'first_name', 'last_name', 'date_of_birth', 'gender'].forEach(field => {
            if (data[field] === '') {
                data[field] = null;
            }
        });

        // A profile edit must never carry a password — the field is disabled in
        // edit mode, but strip it defensively so nothing can slip through.
        if (this.isEditing) {
            delete data.password;
        }

        const submitBtn = document.getElementById('save-attendee');
        
        try {
            Utils.showLoading(submitBtn);
            
            const endpoint = this.isEditing ? `/admin/attendees/${this.editingId}` : '/admin/attendees';
            const method = this.isEditing ? 'PUT' : 'POST';
            
            await API.request(endpoint, {
                method,
                body: JSON.stringify(data)
            });
            
            const action = this.isEditing ? 'updated' : 'created';
            Utils.showAlert(`Attendee ${action} successfully`, 'success');
            
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
     * Explicit password reset for the attendee being edited. The admin can
     * generate a random temp password or type a specific one; either way the
     * attendee is flagged to choose their own on next login. If they have an
     * email on file it's sent to them; the temp password is also shown here so
     * it can be relayed directly.
     */
    async handleResetPassword() {
        const id = this.editingId;
        if (!id) return;

        const useGenerated = confirm(
            'Reset this attendee\'s password?\n\n' +
            'OK  – generate a temporary password (recommended)\n' +
            'Cancel – type a specific password'
        );

        let payload;
        if (useGenerated) {
            payload = { notify: true };
        } else {
            const pw = prompt('Enter a new password for this attendee (at least 8 characters):');
            if (!pw) return;
            if (pw.length < 8) {
                this.showAlert('Password must be at least 8 characters', 'error');
                return;
            }
            payload = { new_password: pw, notify: true };
        }

        const btn = document.getElementById('attendee-reset-password-btn');
        try {
            if (btn) { btn.disabled = true; }
            const res = await API.post(`/admin/attendees/${id}/reset-password`, payload);
            const parts = ['Password reset.'];
            if (res.emailed) parts.push('A temporary password was emailed to the attendee.');
            if (res.temp_password) parts.push(`Temporary password: ${res.temp_password}`);
            parts.push('They will set their own password on next login.');
            this.showAlert(parts.join(' '), 'success');
        } catch (error) {
            this.showAlert('Reset failed: ' + (error.message || error), 'error');
        } finally {
            if (btn) { btn.disabled = false; }
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
            { id: 'attendee-name', name: 'Name' },
            { id: 'attendee-ref', name: 'Reference Number' }
        ];
        
        // Add password to required fields if creating new attendee
        if (!this.isEditing) {
            requiredFields.push({ id: 'attendee-password', name: 'Password' });
        }
        
        requiredFields.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input.value.trim()) {
                this.showFieldError(input, `${field.name} is required`);
                isValid = false;
            } else {
                this.clearFieldError(input);
            }
        });
        
        // Validate email if provided
        const emailInput = document.getElementById('attendee-email');
        if (emailInput.value && !this.isValidEmail(emailInput.value)) {
            this.showFieldError(emailInput, 'Please enter a valid email address');
            isValid = false;
        }
        
        // Validate payment amount
        const paymentInput = document.getElementById('attendee-payment');
        if (paymentInput.value && parseFloat(paymentInput.value) < 0) {
            this.showFieldError(paymentInput, 'Payment amount cannot be negative');
            isValid = false;
        }
        
        return isValid;
    },

    /**
     * Setup real-time validation
     */
    setupValidation() {
        const inputs = document.querySelectorAll('#attendee-form .form-input');
        
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
            case 'attendee-name':
            case 'attendee-ref':
                if (!value) {
                    this.showFieldError(input, 'This field is required');
                    return false;
                }
                break;
                
            case 'attendee-password':
                if (!this.isEditing && !value) {
                    this.showFieldError(input, 'Password is required');
                    return false;
                }
                break;
                
            case 'attendee-email':
                if (value && !this.isValidEmail(value)) {
                    this.showFieldError(input, 'Please enter a valid email address');
                    return false;
                }
                break;
                
            case 'attendee-payment':
                if (value && parseFloat(value) < 0) {
                    this.showFieldError(input, 'Payment amount cannot be negative');
                    return false;
                }
                break;
        }
        
        this.clearFieldError(input);
        return true;
    },

    /**
     * Show field error
     */
    showFieldError(input, message) {
        input.classList.add('invalid');
        
        // Remove existing error
        const existingError = input.parentNode.querySelector('.form-validation-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-validation-message error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        input.parentNode.appendChild(errorDiv);
    },

    /**
     * Clear field error
     */
    clearFieldError(input) {
        input.classList.remove('invalid');
        
        const errorMessage = input.parentNode.querySelector('.form-validation-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    },

    /**
     * Show modal alert
     */
    showAlert(message, type = 'error') {
        const alert = document.getElementById('attendee-modal-alert');
        if (alert) {
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `<i class="fas fa-${this.getAlertIcon(type)}"></i> <span class="alert-msg"></span>`;
            alert.querySelector('.alert-msg').textContent = message;
            alert.classList.remove('hidden');
        }
    },

    /**
     * Hide modal alert
     */
    hideAlert() {
        const alert = document.getElementById('attendee-modal-alert');
        if (alert) {
            alert.classList.add('hidden');
        }
    },

    /**
     * Get alert icon
     */
    getAlertIcon(type) {
        const icons = {
            error: 'exclamation-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle'
        };
        return icons[type] || 'info-circle';
    },

    /**
     * Validate email format
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    /**
     * Handle keyboard events
     */
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.hideModal();
        }
    },

    /**
     * Hide modal
     */
    hideModal() {
        const modal = document.getElementById('attendee-modal');
        if (modal) {
            modal.remove();
        }
        
        // Remove keyboard listener using the stored reference.
        if (this._boundHandleKeyDown) {
            document.removeEventListener('keydown', this._boundHandleKeyDown);
        }
        
        // Reset state
        this.isEditing = false;
        this.editingId = null;
    }
};

// Make component globally available
window.AttendeeManagement = AttendeeManagement;
