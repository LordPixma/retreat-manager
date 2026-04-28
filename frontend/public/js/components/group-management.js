const GroupManagement = {
    isEditing: false,
    editingId: null,
    currentMembers: [],
    membersToAdd: [],
    membersToRemove: [],
    allAttendees: [],

    async showModal(editData = null) {
        this.isEditing = !!editData;
        this.editingId = editData?.id || null;
        this.currentMembers = [];
        this.membersToAdd = [];
        this.membersToRemove = [];

        try {
            await this.renderModal();
            // Load all attendees for the add-member dropdown
            this.allAttendees = (window.AdminDashboard?.data?.attendees) || [];
            this.populateForm(editData);
            this.bindEvents();
            this.setupValidation();
        } catch (error) {
            console.error('Failed to show group modal:', error);
            Utils.showAlert('Failed to load group form', 'error');
        }
    },

    async renderModal() {
        const modalHtml = await Utils.loadTemplate('templates/modals/group-modal.html');
        const existingModal = document.getElementById('group-modal');
        if (existingModal) existingModal.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('group-modal').classList.remove('hidden');
    },

    populateForm(editData) {
        const title = this.isEditing ? 'Edit Group' : 'Add New Group';
        document.getElementById('group-modal-title').textContent = title;

        const addMemberSection = document.getElementById('add-member-section');

        if (editData) {
            document.getElementById('group-name').value = editData.name || '';
            this.currentMembers = (editData.members || []).map(m => ({
                name: typeof m === 'string' ? m : m.name,
                ref_number: m.ref_number || '',
                id: m.id || null,
            }));

            // Resolve member IDs from allAttendees if not present
            if (this.currentMembers.length > 0 && !this.currentMembers[0].id) {
                for (const member of this.currentMembers) {
                    const match = this.allAttendees.find(a =>
                        a.ref_number === member.ref_number || a.name === member.name
                    );
                    if (match) member.id = match.id;
                }
            }

            addMemberSection.style.display = 'block';
            this.renderMembersList();
            this.populateAddDropdown();
        } else {
            document.getElementById('group-form').reset();
            addMemberSection.style.display = 'none';
            this.renderMembersList();
        }

        setTimeout(() => document.getElementById('group-name').focus(), 100);
    },

    renderMembersList() {
        const container = document.getElementById('group-members-list');
        const activeMembers = this.currentMembers.filter(m => !this.membersToRemove.includes(m.id));
        const pendingAdds = this.membersToAdd.map(id => this.allAttendees.find(a => a.id === id)).filter(Boolean);
        const allMembers = [...activeMembers.map(m => ({ ...m, pending: false })), ...pendingAdds.map(a => ({ id: a.id, name: a.name, ref_number: a.ref_number, pending: true }))];

        if (allMembers.length === 0) {
            container.innerHTML = '<p class="text-secondary">No members assigned yet</p>';
            return;
        }

        container.innerHTML = `
            <div style="max-height: 250px; overflow-y: auto;">
                ${allMembers.map(member => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <span>${Utils.escapeHtml(member.name)}</span>
                            ${member.ref_number ? `<small style="color: var(--text-secondary); margin-left: 0.5rem;">(${Utils.escapeHtml(member.ref_number)})</small>` : ''}
                            ${member.pending ? '<span class="badge badge-success" style="margin-left: 0.5rem; font-size: 0.65rem;">new</span>' : ''}
                        </div>
                        ${member.id ? `
                            <button type="button" class="btn btn-sm btn-danger remove-member-btn" data-id="${member.id}" title="Remove from group" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;

        // Bind remove buttons
        container.querySelectorAll('.remove-member-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const memberId = parseInt(btn.dataset.id);
                this.removeMember(memberId);
            });
        });
    },

    populateAddDropdown() {
        const select = document.getElementById('add-member-select');
        if (!select) return;

        const currentIds = new Set(this.currentMembers.map(m => m.id).filter(Boolean));
        const removeIds = new Set(this.membersToRemove);
        const addIds = new Set(this.membersToAdd);

        // Available = ungrouped attendees + ones we've marked for removal - ones we've already added
        const available = this.allAttendees.filter(a => {
            if (addIds.has(a.id)) return false;
            if (currentIds.has(a.id) && !removeIds.has(a.id)) return false;
            return true;
        });

        select.innerHTML = '<option value="">Select an attendee...</option>' +
            available
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(a => `<option value="${a.id}">${Utils.escapeHtml(a.name)} (${a.ref_number})</option>`)
                .join('');
    },

    addMember(attendeeId) {
        if (!attendeeId) return;

        // If this member was previously in the group and marked for removal, just un-remove
        const wasRemoved = this.membersToRemove.indexOf(attendeeId);
        if (wasRemoved !== -1) {
            this.membersToRemove.splice(wasRemoved, 1);
        } else {
            this.membersToAdd.push(attendeeId);
        }

        this.renderMembersList();
        this.populateAddDropdown();
    },

    removeMember(memberId) {
        // If it was a pending add, just remove from the add list
        const addIdx = this.membersToAdd.indexOf(memberId);
        if (addIdx !== -1) {
            this.membersToAdd.splice(addIdx, 1);
        } else {
            // Mark existing member for removal
            this.membersToRemove.push(memberId);
        }

        this.renderMembersList();
        this.populateAddDropdown();
    },

    bindEvents() {
        document.getElementById('group-form').addEventListener('submit', this.handleSubmit.bind(this));
        document.getElementById('close-group-modal').addEventListener('click', this.hideModal.bind(this));
        document.getElementById('cancel-group-modal').addEventListener('click', this.hideModal.bind(this));

        document.getElementById('group-modal').addEventListener('click', (e) => {
            if (e.target.id === 'group-modal') this.hideModal();
        });

        document.addEventListener('keydown', this.handleKeyDown.bind(this));

        // Add member button
        const addBtn = document.getElementById('add-member-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const select = document.getElementById('add-member-select');
                const id = parseInt(select.value);
                if (id) {
                    this.addMember(id);
                    select.value = '';
                }
            });
        }
    },

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) return;

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

            // Apply member changes if editing
            if (this.isEditing) {
                const promises = [];

                // Remove members (set group_id to null)
                for (const id of this.membersToRemove) {
                    promises.push(API.request(`/admin/attendees/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ group_id: null })
                    }));
                }

                // Add members (set group_id to this group)
                for (const id of this.membersToAdd) {
                    promises.push(API.request(`/admin/attendees/${id}`, {
                        method: 'PUT',
                        body: JSON.stringify({ group_id: this.editingId })
                    }));
                }

                if (promises.length > 0) {
                    await Promise.all(promises);
                }
            }

            const action = this.isEditing ? 'updated' : 'created';
            Utils.showAlert(`Group ${action} successfully`, 'success');

            this.hideModal();

            if (window.AdminDashboard) {
                await AdminDashboard.refresh();
            }

        } catch (error) {
            this.showAlert(error.message, 'error');
        } finally {
            Utils.hideLoading(submitBtn);
        }
    },

    validateForm() {
        let isValid = true;
        this.hideAlert();

        const nameInput = document.getElementById('group-name');
        if (!nameInput.value.trim()) {
            this.showFieldError(nameInput, 'Group name is required');
            isValid = false;
        } else {
            this.clearFieldError(nameInput);
        }

        return isValid;
    },

    setupValidation() {
        const nameInput = document.getElementById('group-name');
        nameInput.addEventListener('blur', () => this.validateField(nameInput));
        nameInput.addEventListener('input', () => this.clearFieldError(nameInput));
    },

    validateField(input) {
        if (input.id === 'group-name' && !input.value.trim()) {
            this.showFieldError(input, 'Group name is required');
            return false;
        }
        this.clearFieldError(input);
        return true;
    },

    showFieldError(input, message) {
        input.classList.add('invalid');
        const existingError = input.parentNode.querySelector('.form-validation-message');
        if (existingError) existingError.remove();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-validation-message error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        input.parentNode.appendChild(errorDiv);
    },

    clearFieldError(input) {
        input.classList.remove('invalid');
        const errorMessage = input.parentNode.querySelector('.form-validation-message');
        if (errorMessage) errorMessage.remove();
    },

    showAlert(message, type = 'error') {
        const alert = document.getElementById('group-modal-alert');
        if (alert) {
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
            alert.classList.remove('hidden');
        }
    },

    hideAlert() {
        const alert = document.getElementById('group-modal-alert');
        if (alert) alert.classList.add('hidden');
    },

    handleKeyDown(e) {
        if (e.key === 'Escape') this.hideModal();
    },

    hideModal() {
        const modal = document.getElementById('group-modal');
        if (modal) modal.remove();
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        this.isEditing = false;
        this.editingId = null;
        this.currentMembers = [];
        this.membersToAdd = [];
        this.membersToRemove = [];
    }
};

window.GroupManagement = GroupManagement;
