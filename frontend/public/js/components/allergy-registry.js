// Allergy Registry tab controller for the admin dashboard.
// Lists every attendee's allergy-form status, lets admins resend per row or
// send to all pending, and shows a detail panel for a single record.

const AllergyRegistry = {
    _records: [],

    init() {
        document.getElementById('allergy-send-all-btn')?.addEventListener('click', () => this.sendToPending());
        document.getElementById('allergy-send-everyone-btn')?.addEventListener('click', () => this.sendToEveryone());

        const search = document.getElementById('allergy-search');
        let t;
        search?.addEventListener('input', () => {
            clearTimeout(t);
            t = setTimeout(() => this.render(), 200);
        });

        document.getElementById('allergy-filter')?.addEventListener('change', () => this.render());
        document.getElementById('allergy-detail-close')?.addEventListener('click', () => {
            document.getElementById('allergy-detail').style.display = 'none';
        });
    },

    async load() {
        try {
            const data = await API.request('/admin/allergy');
            this._records = data.records || [];
            this.render();
        } catch (err) {
            const tbody = document.getElementById('allergy-table-body');
            if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: var(--error);">Failed to load registry</td></tr>';
            console.error(err);
        }
    },

    render() {
        const tbody = document.getElementById('allergy-table-body');
        if (!tbody) return;
        const q = (document.getElementById('allergy-search')?.value || '').trim().toLowerCase();
        const filter = document.getElementById('allergy-filter')?.value || 'all';

        const rows = this._records.filter(r => {
            if (filter === 'severe' && r.severity !== 'severe') return false;
            if (filter === 'submitted' && r.status !== 'submitted' && r.status !== 'none') return false;
            if (filter === 'pending' && r.status !== 'pending') return false;
            if (filter === 'none' && r.status !== 'none') return false;
            // Note: 'submitted' filter includes 'none' (i.e. confirmed-no-allergies)
            // because both represent a completed response.
            if (filter === 'submitted' && !(r.status === 'submitted' || r.status === 'none')) return false;
            if (q) {
                const hay = `${r.name || ''} ${r.ref_number || ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            return true;
        });

        // Summary chips
        const summary = document.getElementById('allergy-summary');
        if (summary) {
            const counts = this._records.reduce((acc, r) => {
                acc.total++;
                if (r.status === 'submitted') acc.submitted++;
                else if (r.status === 'pending') acc.pending++;
                else if (r.status === 'none') acc.none++;
                else acc.no_record++;
                if (r.severity === 'severe') acc.severe++;
                return acc;
            }, { total: 0, submitted: 0, pending: 0, none: 0, no_record: 0, severe: 0 });
            summary.innerHTML = `
                <span class="badge badge-info">${counts.total} attendees</span>
                <span class="badge badge-success">${counts.submitted} reported allergies</span>
                <span class="badge badge-secondary">${counts.none} no allergies</span>
                <span class="badge badge-warning">${counts.pending} awaiting response</span>
                <span class="badge badge-secondary">${counts.no_record} not yet emailed</span>
                ${counts.severe > 0 ? `<span class="badge badge-danger">${counts.severe} SEVERE</span>` : ''}
            `;
        }

        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 1.5rem; color: var(--text-secondary);">No matching attendees</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map(r => {
            const statusBadge = ({
                submitted: '<span class="badge badge-success">Submitted</span>',
                pending: '<span class="badge badge-warning">Awaiting response</span>',
                none: '<span class="badge badge-secondary">No allergies</span>',
            })[r.status] || '<span class="badge badge-secondary">Not sent</span>';

            const sev = r.severity ? `<span class="badge ${r.severity === 'severe' ? 'badge-danger' : r.severity === 'moderate' ? 'badge-warning' : 'badge-info'}" style="text-transform: capitalize;">${Utils.escapeHtml(r.severity)}</span>` : '—';
            const epi = r.epipen_required ? '<span class="badge badge-danger" title="EpiPen required">⚠️ Yes</span>' : '—';

            return `<tr>
                <td>${Utils.escapeHtml(r.name || '')}</td>
                <td><strong>${Utils.escapeHtml(r.ref_number || '')}</strong></td>
                <td>${Utils.escapeHtml(r.room_number || '—')}</td>
                <td>${Utils.escapeHtml(r.group_name || '—')}</td>
                <td>${statusBadge}</td>
                <td>${sev}</td>
                <td>${epi}</td>
                <td>
                    <button class="btn btn-sm btn-ghost" data-view-allergy="${r.attendee_id}" title="View detail"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-primary" data-resend-allergy="${r.attendee_id}" title="Send / resend form"><i class="fas fa-paper-plane"></i></button>
                </td>
            </tr>`;
        }).join('');

        tbody.querySelectorAll('[data-view-allergy]').forEach(b => {
            b.addEventListener('click', () => this.viewDetail(parseInt(b.dataset.viewAllergy, 10)));
        });
        tbody.querySelectorAll('[data-resend-allergy]').forEach(b => {
            b.addEventListener('click', () => this.resend(parseInt(b.dataset.resendAllergy, 10)));
        });
    },

    async viewDetail(id) {
        const wrap = document.getElementById('allergy-detail');
        const body = document.getElementById('allergy-detail-body');
        body.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        wrap.style.display = '';
        try {
            const r = await API.request(`/admin/allergy/${id}`);
            const has = !!r.has_allergies;
            const sev = r.severity ? r.severity.toUpperCase() : '—';
            body.innerHTML = `
                <div style="display:grid; grid-template-columns: 160px 1fr; gap: 0.5rem 1rem; font-size: 0.95rem;">
                    <div style="color: var(--text-secondary)">Name</div><div><strong>${Utils.escapeHtml(r.name || '')}</strong></div>
                    <div style="color: var(--text-secondary)">Reference</div><div>${Utils.escapeHtml(r.ref_number || '')}</div>
                    <div style="color: var(--text-secondary)">Room</div><div>${Utils.escapeHtml(r.room_number || '—')}</div>
                    <div style="color: var(--text-secondary)">Group</div><div>${Utils.escapeHtml(r.group_name || '—')}</div>
                    <div style="color: var(--text-secondary)">Form sent</div><div>${r.form_sent_at ? new Date(r.form_sent_at).toLocaleString() : '—'}</div>
                    <div style="color: var(--text-secondary)">Submitted</div><div>${r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}</div>
                    <div style="color: var(--text-secondary)">Status</div><div>${Utils.escapeHtml(r.status || 'none')}</div>
                </div>
                <hr style="margin: 1.25rem 0; border: 0; border-top: 1px solid rgba(255,255,255,0.06);">
                ${has ? `
                    <div style="display:grid; grid-template-columns: 160px 1fr; gap: 0.5rem 1rem; font-size: 0.95rem;">
                        <div style="color: var(--text-secondary)">Allergens</div><div>${Utils.escapeHtml(r.allergens || '—')}</div>
                        <div style="color: var(--text-secondary)">Severity</div><div>${Utils.escapeHtml(sev)}</div>
                        <div style="color: var(--text-secondary)">EpiPen required</div><div>${r.epipen_required ? 'Yes' : 'No'}</div>
                        <div style="color: var(--text-secondary)">Emergency notes</div><div style="white-space: pre-wrap;">${Utils.escapeHtml(r.emergency_notes || '—')}</div>
                        <div style="color: var(--text-secondary)">Submitted by</div><div>${Utils.escapeHtml(r.submitted_by_email || '—')}</div>
                    </div>
                ` : (r.status === 'none'
                    ? '<p style="color: var(--success);"><i class="fas fa-check-circle"></i> Recipient confirmed: no allergies or medical conditions to flag.</p>'
                    : '<p style="color: var(--text-secondary);">No response yet.</p>')}
                <div style="margin-top: 1.25rem; display:flex; gap: 0.5rem;">
                    <button class="btn btn-primary" id="allergy-detail-resend"><i class="fas fa-paper-plane"></i> Resend form</button>
                </div>
            `;
            document.getElementById('allergy-detail-resend')?.addEventListener('click', () => this.resend(id));
        } catch (err) {
            body.innerHTML = `<div class="alert alert-error">Failed to load: ${Utils.escapeHtml(err.message || '')}</div>`;
        }
    },

    async resend(attendeeId) {
        if (!confirm('Send the allergy form to this attendee (or their registrant if under 16)?')) return;
        try {
            const data = await API.request('/admin/allergy/send-forms', {
                method: 'POST',
                body: JSON.stringify({ attendee_id: attendeeId }),
            });
            if (data.sent > 0) {
                Utils.showAlert(`Form sent to ${data.sent_to[0]?.recipient || 'recipient'}`, 'success');
            } else if (data.skipped > 0) {
                Utils.showAlert(`Skipped: ${data.skipped_attendees[0]?.reason || 'no email'}`, 'warning');
            }
            await this.load();
        } catch (err) {
            Utils.showAlert('Send failed: ' + (err.message || err), 'error');
        }
    },

    async sendToPending() {
        if (!confirm('Send the allergy form to every attendee who hasn\'t responded yet?')) return;
        await this._bulkSend({ only_pending: true }, 'allergy-send-all-btn',
            '<i class="fas fa-paper-plane"></i> Send to pending');
    },

    async sendToEveryone() {
        const total = this._records.length;
        const submitted = this._records.filter(r => r.status === 'submitted' || r.status === 'none').length;
        const msg = submitted > 0
            ? `Send the allergy form to ALL ${total} attendees? This will re-email ${submitted} people who already responded — their previous answers stay on record (this only resets the form_sent_at timestamp).`
            : `Send the allergy form to all ${total} attendees?`;
        if (!confirm(msg)) return;
        await this._bulkSend({ only_pending: false }, 'allergy-send-everyone-btn',
            '<i class="fas fa-bullhorn"></i> Send to ALL attendees');
    },

    async _bulkSend(body, btnId, restoreLabel) {
        const btn = document.getElementById(btnId);
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...'; }
        try {
            const data = await API.request('/admin/allergy/send-forms', {
                method: 'POST',
                body: JSON.stringify(body),
            });
            const summary = `Sent: ${data.sent} · Skipped: ${data.skipped}`;
            Utils.showAlert(summary, data.skipped ? 'warning' : 'success');
            await this.load();
        } catch (err) {
            Utils.showAlert('Bulk send failed: ' + (err.message || err), 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = restoreLabel; }
        }
    },
};

window.AllergyRegistry = AllergyRegistry;
