const RoomManagement = {
    isEditing: false,
    editingId: null,

    /**
     * Show room modal
     */
    async showModal(editData = null) {
        this.isEditing = !!editData;
        this.editingId = editData?.id || null;

        try {
            await this.renderModal();
            this.populateForm(editData);
            this.bindEvents();
            this.setupValidation();
        } catch (error) {
            console.error('Failed to show room modal:', error);
            Utils.showAlert('Failed to load room form', 'error');
        }
    },

    /**
     * Render modal template
     */
    async renderModal() {
        const modalHtml = await Utils.loadTemplate('templates/modals/room-modal.html');
        
        // Remove existing modal if present
        const existingModal = document.getElementById('room-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        document.getElementById('room-modal').classList.remove('hidden');
    },

    /**
     * Populate form with data
     */
    populateForm(editData) {
        // Update modal title
        const title = this.isEditing ? 'Edit Room' : 'Add New Room';
        document.getElementById('room-modal-title').textContent = title;

        // Fill form if editing
        if (editData) {
            document.getElementById('room-number').value = editData.number || '';
            document.getElementById('room-description').value = editData.description || '';
            document.getElementById('room-type').value = editData.room_type || 'standard';
            document.getElementById('room-capacity').value = editData.capacity ?? 1;
            document.getElementById('room-cot-capacity').value = editData.cot_capacity ?? 0;
            document.getElementById('room-floor').value = editData.floor || '';
            document.getElementById('room-amenities').value = editData.amenities || '';
        } else {
            // Reset form for new room
            document.getElementById('room-form').reset();
            document.getElementById('room-type').value = 'standard';
            document.getElementById('room-capacity').value = 1;
            document.getElementById('room-cot-capacity').value = 0;
        }

        // Focus on room number field
        setTimeout(() => {
            document.getElementById('room-number').focus();
        }, 100);
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form submission
        document.getElementById('room-form').addEventListener('submit', this.handleSubmit.bind(this));
        
        // Close buttons
        document.getElementById('close-room-modal').addEventListener('click', this.hideModal.bind(this));
        document.getElementById('cancel-room-modal').addEventListener('click', this.hideModal.bind(this));
        
        // Close on overlay click
        document.getElementById('room-modal').addEventListener('click', (e) => {
            if (e.target.id === 'room-modal') {
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

        // Coerce numeric fields back to numbers (FormData gives us strings).
        data.capacity = parseInt(data.capacity, 10) || 1;
        data.cot_capacity = parseInt(data.cot_capacity, 10) || 0;

        // Empty strings → null for optional text fields.
        ['description', 'floor', 'amenities'].forEach(field => {
            if (typeof data[field] === 'string' && !data[field].trim()) {
                data[field] = null;
            }
        });

        const submitBtn = document.getElementById('save-room');
        
        try {
            Utils.showLoading(submitBtn);
            
            const endpoint = this.isEditing ? `/admin/rooms/${this.editingId}` : '/admin/rooms';
            const method = this.isEditing ? 'PUT' : 'POST';
            
            await API.request(endpoint, {
                method,
                body: JSON.stringify(data)
            });
            
            const action = this.isEditing ? 'updated' : 'created';
            Utils.showAlert(`Room ${action} successfully`, 'success');
            
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
        
        // Room number is required
        const numberInput = document.getElementById('room-number');
        if (!numberInput.value.trim()) {
            this.showFieldError(numberInput, 'Room number is required');
            isValid = false;
        } else {
            this.clearFieldError(numberInput);
        }
        
        return isValid;
    },

    /**
     * Setup real-time validation
     */
    setupValidation() {
        const numberInput = document.getElementById('room-number');
        
        numberInput.addEventListener('blur', () => this.validateField(numberInput));
        numberInput.addEventListener('input', () => this.clearFieldError(numberInput));
    },

    /**
     * Validate individual field
     */
    validateField(input) {
        const value = input.value.trim();
        
        if (input.id === 'room-number' && !value) {
            this.showFieldError(input, 'Room number is required');
            return false;
        }
        
        this.clearFieldError(input);
        return true;
    },

    /**
     * Show field error
     */
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
        const alert = document.getElementById('room-modal-alert');
        if (alert) {
            alert.className = `alert alert-${type}`;
            alert.innerHTML = '<i class="fas fa-exclamation-circle"></i> <span class="alert-msg"></span>';
            alert.querySelector('.alert-msg').textContent = message;
            alert.classList.remove('hidden');
        }
    },

    /**
     * Hide modal alert
     */
    hideAlert() {
        const alert = document.getElementById('room-modal-alert');
        if (alert) {
            alert.classList.add('hidden');
        }
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
        const modal = document.getElementById('room-modal');
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
window.RoomManagement = RoomManagement;
