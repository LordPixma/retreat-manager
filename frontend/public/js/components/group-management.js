const GroupManagement = {
    isEditing: false,
    editingId: null,

    /**
     * Show group modal
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
            console.error('Failed to show group modal:', error);
            Utils.showAlert('Failed to load group form', 'error');
        }
    },

    /**
     * Render modal template
     */
    async renderModal() {
        const modalHtml = await Utils.loadTemplate('templates/modals/group-modal.html');
        
        // Remove existing modal if present
        const existingModal = document.getElementById('group-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        document.getElementById('group-modal').classList.remove('hidden');
    },

    /**
     * Populate form with data
     */
    populateForm(editData) {
        // Update modal title
        const title = this.isEditing ? 'Edit Group' : 'Add New Group';
        document.getElementById('group-modal-title').textContent = title;

        // Fill form if editing
        if (editData) {
            document.getElementById('group-name').value = editData.name || '';
            this.updateMembersList(editData.members || []);
        } else {
            // Reset form for new group
            document.getElementById('group-form').reset();
            this.updateMembersList([]);
        }

        // Focus on group name field
        setTimeout(() => {
            document.getElementById('group-name').focus();
        }, 100);
    },

    /**
     * Update members list display
     */
    updateMembersList(members) {
        const membersList = document.getElementById('group-members-list');
        
        if (members.length === 0) {
            membersList.innerHTML = '<p class="text-secondary">No members assigned yet</p>';
        } else {
            membersList.innerHTML = `
                <ul class="member-list">
                    ${members.map(member => `
                        <li>
                            <span>${Utils.escapeHtml(member)}</span>
                        </li>
                    `).join('')}
                </ul>
                <p class="form-help" style="margin-top: 0.5rem;">
                    <i class="fas fa-info-circle"></i> 
                    Members are automatically assigned when you edit attendees
                </p>
            `;
        }
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Form submission
        document.getElementById('group-form').addEventListener('submit', this.handleSubmit.bind(this));
        
        // Close buttons
        document.getElementById('close-group-modal').addEventListener('click', this.hideModal.bind(this));
        document.getElementById('cancel-group-modal').addEventListener('click', this.hideModal.bind(this));
        
        // Close on overlay click
        document.getElementById('group-modal').addEventListener('click', (e) => {
            if (e.target.id === 'group-modal') {
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

        const submitBtn = document.getElementById('save-group');
        
        try {
            Utils.showLoading(submitBtn);
            
            const endpoint = this.isEditing ? `/admin/groups/${this.editingId}` : '/admin/groups';
            const method = this.isEditing ? 'PUT' : 'POST';
            
            await API.request(endpoint, {
                method,
                body: JSON.stringify(data)
            });
            
            const action = this.isEditing ? 'updated' : 'created';
            Utils.showAlert(`Group ${action} successfully`, 'success');
            
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
        
        // Group name is required
        const nameInput = document.getElementById('group-name');
        if (!nameInput.value.trim()) {
            this.showFieldError(nameInput, 'Group name is required');
            isValid = false;
        } else {
            this.clearFieldError(nameInput);
        }
        
        return isValid;
    },

    /**
     * Setup real-time validation
     */
    setupValidation() {
        const nameInput = document.getElementById('group-name');
        
        nameInput.addEventListener('blur', () => this.validateField(nameInput));
        nameInput.addEventListener('input', () => this.clearFieldError(nameInput));
    },

    /**
     * Validate individual field
     */
    validateField(input) {
        const value = input.value.trim();
        
        if (input.id === 'group-name' && !value) {
            this.showFieldError(input, 'Group name is required');
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
        const alert = document.getElementById('group-modal-alert');
        if (alert) {
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
            alert.classList.remove('hidden');
        }
    },

    /**
     * Hide modal alert
     */
    hideAlert() {
        const alert = document.getElementById('group-modal-alert');
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
        const modal = document.getElementById('group-modal');
        if (modal) {
            modal.remove();
        }
        
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        
        this.isEditing = false;
        this.editingId = null;
    }
};

// Make component globally available
window.GroupManagement = GroupManagement;
