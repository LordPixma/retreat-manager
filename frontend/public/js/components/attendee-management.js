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
            document.getElementById('attendee-ref').value = editData.ref_number || '';
            document.getElementById('attendee-payment').value = editData.payment_due || 0;
            document.getElementById('attendee-room').value = editData.room_id || '';
            document.getElementById('attendee-group').value = editData.group_id || '';
            
            // Password not required when editing
            const passwordInput = document.getElementById('attendee-password');
            passwordInput.required = false;
            passwordInput.placeholder = 'Leave blank to keep current password';
            
            // Show password help text
            document.getElementById('password-help').style.display = 'block';
        } else {
            // Reset form for new attendee
            document.getElementById('attendee-form').reset();
            document.getElementById('attendee-password').required = true;
            document.getElementById('password-help').style.display = 'none';
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
        
        // Close buttons
        document.getElementById('close-attendee-modal').addEventListener('click', this.hideModal.bind(this));
        document.getElementById('cancel-attendee-modal').addEventListener('click', this.hideModal.bind(this));
        
        // Close on overlay click
        document.getElementById('attendee-modal').addEventListener('click', (e) => {
            if (e.target.id === 'attendee-modal') {
                this.hideModal();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
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
        ['room_id', 'group_id', 'email'].forEach(field => {
            if (data[field] === '') {
                data[field] = null;
            }
        });

        // Remove password if empty during edit
        if (this.isEditing && !data.password) {
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
            alert.innerHTML = `<i class="fas fa-${this.getAlertIcon(type)}"></i> ${message}`;
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
        
        // Remove keyboard listener
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Reset state
        this.isEditing = false;
        this.editingId = null;
    }
};

// Make component globally available
window.AttendeeManagement = AttendeeManagement;
