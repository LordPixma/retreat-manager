// Admin Management tab controller. List / create / deactivate / reset
// password for the multi-admin world. Super-admin-only — the nav link is
// hidden for non-super admins, and the API enforces the same on the server
// side regardless of UI tampering.

const AdminManagement = {
    _records: [],

    init() {
        document.getElementById('admin-add-btn')?.addEventListener('click', () => this.openCreate());
    },

    async load() {
        const tbody = document.getElementById('admins-table-body');
        if (!tbody) return;
        try {
            const data = await API.request('/admin/admins');
            this._records = data.admins || [];
            this.render();
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:1.5rem; color: var(--error);">Failed to load admins: ${Utils.escapeHtml(err.message || '')}</td></tr>`;
        }
    },

    render() {
        const tbody = document.getElementById('admins-table-body');
        if (!tbody) return;
        if (!this._records.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:1.5rem; color: var(--text-secondary);">No administrators found</td></tr>';
            return;
        }
        tbody.innerHTML = this._records.map(a => {
            const roleBadge = a.role === 'super_admin'
                ? '<span class="badge badge-warning"><i class="fas fa-crown"></i> Super</span>'
                : '<span class="badge badge-secondary">Admin</span>';
            const statusBadge = a.is_active
                ? '<span class="badge badge-success">Active</span>'
                : '<span class="badge badge-secondary">Deactivated</span>';
            const mustReset = a.must_reset_password
                ? ' <span class="badge badge-warning" title="Must reset password on next login"><i class="fas fa-key"></i></span>'
                : '';
            const lastLogin = a.last_login ? new Date(a.last_login).toLocaleString() : '—';
            const actions = a.is_active ? `
                <button class="btn btn-sm btn-ghost" data-admin-reset="${a.id}" title="Reset password"><i class="fas fa-key"></i></button>
                <button class="btn btn-sm btn-ghost" data-admin-edit="${a.id}" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" data-admin-deactivate="${a.id}" title="Deactivate"><i class="fas fa-user-slash"></i></button>
            ` : `
                <button class="btn btn-sm btn-success" data-admin-reactivate="${a.id}" title="Reactivate"><i class="fas fa-user-check"></i></button>
            `;
            return `<tr>
                <td><strong>${Utils.escapeHtml(a.username || '')}</strong>${mustReset}</td>
                <td>${Utils.escapeHtml(a.full_name || '—')}</td>
                <td>${Utils.escapeHtml(a.email || '—')}</td>
                <td>${roleBadge}</td>
                <td>${statusBadge}</td>
                <td>${lastLogin}</td>
                <td>${actions}</td>
            </tr>`;
        }).join('');

        tbody.querySelectorAll('[data-admin-reset]').forEach(b => b.addEventListener('click', () => this.resetPassword(parseInt(b.dataset.adminReset, 10))));
        tbody.querySelectorAll('[data-admin-edit]').forEach(b => b.addEventListener('click', () => this.openEdit(parseInt(b.dataset.adminEdit, 10))));
        tbody.querySelectorAll('[data-admin-deactivate]').forEach(b => b.addEventListener('click', () => this.deactivate(parseInt(b.dataset.adminDeactivate, 10))));
        tbody.querySelectorAll('[data-admin-reactivate]').forEach(b => b.addEventListener('click', () => this.reactivate(parseInt(b.dataset.adminReactivate, 10))));
    },

    openCreate() {
        const username = prompt('Username for the new admin:');
        if (!username || !username.trim()) return;
        const full_name = prompt('Full name (optional):') || username.trim();
        const email = prompt('Email (optional):') || '';
        const role = confirm('Make this user a Super Admin? (OK = Super Admin, Cancel = Admin)') ? 'super_admin' : 'admin';
        const password = prompt('Initial password (min 8 chars). The new admin will be forced to change it on first login:');
        if (!password || password.length < 8) { Utils.showAlert('Password must be at least 8 characters', 'error'); return; }

        API.request('/admin/admins', {
            method: 'POST',
            body: JSON.stringify({ username: username.trim(), full_name, email, role, password }),
        }).then(() => {
            Utils.showAlert(`Admin ${username} created. They must reset password on first login.`, 'success');
            this.load();
        }).catch(err => Utils.showAlert('Create failed: ' + (err.message || err), 'error'));
    },

    openEdit(id) {
        const target = this._records.find(r => r.id === id);
        if (!target) return;
        const full_name = prompt('Full name:', target.full_name || '');
        if (full_name === null) return;
        const email = prompt('Email:', target.email || '');
        if (email === null) return;
        const role = confirm(`Currently: ${target.role}. Make Super Admin? OK = Super Admin, Cancel = Admin.`) ? 'super_admin' : 'admin';

        API.request(`/admin/admins/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ full_name, email, role }),
        }).then(() => {
            Utils.showAlert('Admin updated', 'success');
            this.load();
        }).catch(err => Utils.showAlert('Update failed: ' + (err.message || err), 'error'));
    },

    resetPassword(id) {
        const target = this._records.find(r => r.id === id);
        if (!target) return;
        const newPassword = prompt(`Set a new password for ${target.username} (min 8 chars). They'll be forced to change it on next login:`);
        if (!newPassword || newPassword.length < 8) { Utils.showAlert('Password must be at least 8 characters', 'error'); return; }
        API.request(`/admin/admins/${id}/reset-password`, {
            method: 'POST',
            body: JSON.stringify({ new_password: newPassword }),
        }).then(() => Utils.showAlert(`Password reset for ${target.username}. Share securely.`, 'success'))
          .catch(err => Utils.showAlert('Reset failed: ' + (err.message || err), 'error'));
    },

    deactivate(id) {
        const target = this._records.find(r => r.id === id);
        if (!target) return;
        if (!confirm(`Deactivate ${target.username}? They will not be able to log in.`)) return;
        API.request(`/admin/admins/${id}`, { method: 'DELETE' })
            .then(() => { Utils.showAlert(`${target.username} deactivated`, 'success'); this.load(); })
            .catch(err => Utils.showAlert('Deactivate failed: ' + (err.message || err), 'error'));
    },

    reactivate(id) {
        API.request(`/admin/admins/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ is_active: true }),
        }).then(() => { Utils.showAlert('Reactivated', 'success'); this.load(); })
          .catch(err => Utils.showAlert('Reactivate failed: ' + (err.message || err), 'error'));
    },
};

window.AdminManagement = AdminManagement;
