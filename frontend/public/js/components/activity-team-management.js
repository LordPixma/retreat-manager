// Activity Team Management Component
const ActivityTeamManagement = {
    isEditing: false,
    editingId: null,
    attendeesData: [],
    selectedMembers: new Set(),

    async showModal(editData = null, attendees = []) {
        this.attendeesData = attendees;
        this.isEditing = !!editData;
        this.editingId = editData?.id || null;
        this.selectedMembers = new Set();

        try {
            await this.renderModal();
            this.populateForm(editData);
            this.bindEvents();
        } catch (error) {
            console.error('Failed to show activity team modal:', error);
            Utils.showAlert('Failed to load form', 'error');
        }
    },

    async renderModal() {
        const modalHtml = await Utils.loadTemplate('templates/modals/activity-team-modal.html');
        const existing = document.getElementById('activity-team-modal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('activity-team-modal').classList.remove('hidden');
    },

    populateForm(editData) {
        const title = this.isEditing ? 'Edit Activity Team' : 'Create Activity Team';
        document.getElementById('activity-team-modal-title').textContent = title;

        // Populate leader dropdown
        const leaderSelect = document.getElementById('team-leader');
        leaderSelect.innerHTML = '<option value="">No leader assigned</option>';
        this.attendeesData.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id;
            opt.textContent = `${a.name} (${a.ref_number})`;
            leaderSelect.appendChild(opt);
        });

        // Populate member checkboxes
        this.renderMemberList();

        if (editData) {
            document.getElementById('team-name').value = editData.name || '';
            document.getElementById('team-description').value = editData.description || '';
            document.getElementById('team-leader').value = editData.leader_id || '';

            // Pre-select members
            if (editData.member_ids) {
                editData.member_ids.forEach(id => this.selectedMembers.add(id));
                this.renderMemberList();
                this.updateSelectedCount();
            }
        }
    },

    renderMemberList(filter = '') {
        const container = document.getElementById('team-member-list');
        if (!container) return;

        const filtered = filter
            ? this.attendeesData.filter(a =>
                a.name.toLowerCase().includes(filter.toLowerCase()) ||
                a.ref_number.toLowerCase().includes(filter.toLowerCase()))
            : this.attendeesData;

        if (filtered.length === 0) {
            container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-tertiary); font-size: 0.85rem;">No attendees found</div>';
            return;
        }

        container.innerHTML = filtered.map(a => {
            const checked = this.selectedMembers.has(a.id) ? 'checked' : '';
            return `
                <label style="display: flex; align-items: center; gap: 0.6rem; padding: 0.4rem 0.6rem; cursor: pointer; border-radius: 6px; transition: background 0.15s;"
                       onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
                    <input type="checkbox" class="team-member-check" value="${a.id}" ${checked} style="accent-color: var(--primary-500);">
                    <span style="font-size: 0.85rem; color: var(--text-primary);">${Utils.escapeHtml(a.name)}</span>
                    <span style="font-size: 0.7rem; color: var(--text-tertiary); margin-left: auto;">${Utils.escapeHtml(a.ref_number)}</span>
                </label>`;
        }).join('');
    },

    updateSelectedCount() {
        const el = document.getElementById('team-selected-count');
        if (el) el.textContent = this.selectedMembers.size;
    },

    bindEvents() {
        document.getElementById('activity-team-form').addEventListener('submit', this.handleSubmit.bind(this));
        document.getElementById('close-activity-team-modal').addEventListener('click', this.hideModal.bind(this));
        document.getElementById('cancel-activity-team-modal').addEventListener('click', this.hideModal.bind(this));

        document.getElementById('activity-team-modal').addEventListener('click', (e) => {
            if (e.target.id === 'activity-team-modal') this.hideModal();
        });

        document.addEventListener('keydown', this._handleKeyDown = (e) => {
            if (e.key === 'Escape') this.hideModal();
        });

        // Member search
        document.getElementById('team-member-search').addEventListener('input', (e) => {
            this.renderMemberList(e.target.value);
        });

        // Member checkbox changes (delegated)
        document.getElementById('team-member-list').addEventListener('change', (e) => {
            if (e.target.classList.contains('team-member-check')) {
                const id = parseInt(e.target.value);
                if (e.target.checked) {
                    this.selectedMembers.add(id);
                } else {
                    this.selectedMembers.delete(id);
                }
                this.updateSelectedCount();
            }
        });
    },

    async handleSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('team-name').value.trim();
        if (!name) {
            this.showAlert('Team name is required', 'error');
            return;
        }

        const data = {
            name,
            description: document.getElementById('team-description').value.trim() || null,
            leader_id: parseInt(document.getElementById('team-leader').value) || null,
            member_ids: Array.from(this.selectedMembers),
        };

        const submitBtn = document.getElementById('save-activity-team');

        try {
            Utils.showLoading(submitBtn);

            const endpoint = this.isEditing
                ? `/admin/activity-teams/${this.editingId}`
                : '/admin/activity-teams';
            const method = this.isEditing ? 'PUT' : 'POST';

            await API.request(endpoint, {
                method,
                body: JSON.stringify(data),
            });

            const action = this.isEditing ? 'updated' : 'created';
            Utils.showAlert(`Activity team ${action} successfully`, 'success');
            this.hideModal();

            if (window.AdminDashboard) {
                await AdminDashboard.loadActivityTeams();
                AdminDashboard.updateActivityTeamsDisplay();
            }
        } catch (error) {
            this.showAlert(error.message || 'Failed to save team', 'error');
        } finally {
            Utils.hideLoading(submitBtn);
        }
    },

    showAlert(message, type) {
        const alert = document.getElementById('activity-team-modal-alert');
        if (alert) {
            alert.className = `alert alert-${type}`;
            alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
            alert.classList.remove('hidden');
        }
    },

    hideModal() {
        const modal = document.getElementById('activity-team-modal');
        if (modal) modal.remove();
        if (this._handleKeyDown) {
            document.removeEventListener('keydown', this._handleKeyDown);
        }
        this.isEditing = false;
        this.editingId = null;
        this.selectedMembers = new Set();
    },
};

window.ActivityTeamManagement = ActivityTeamManagement;
