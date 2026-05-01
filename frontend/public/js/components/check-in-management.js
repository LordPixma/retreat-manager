// Check-in tab controller for the admin dashboard.
// Handles: window settings, manual + scanner check-in, roster table, undo.
//
// The html5-qrcode library is loaded lazily the first time the admin opens
// the camera scanner — keeps the dashboard's first paint fast.

const CheckInManagement = {
    HTML5_QRCODE_CDN: 'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js',
    _scannerInstance: null,
    _qrLibLoaded: null,
    _refreshTimer: null,

    init() {
        // Window controls
        document.getElementById('checkin-window-save')?.addEventListener('click', () => this.saveWindow());
        document.getElementById('checkin-window-clear')?.addEventListener('click', () => this.clearWindow());

        // Manual check-in
        const refInput = document.getElementById('checkin-ref-input');
        document.getElementById('checkin-submit-btn')?.addEventListener('click', () => this.submitManualCheckIn());
        refInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.submitManualCheckIn(); }
        });

        // Scanner
        document.getElementById('checkin-scanner-toggle')?.addEventListener('click', () => this.toggleScanner());

        // Roster filters
        const search = document.getElementById('checkin-roster-search');
        const filter = document.getElementById('checkin-roster-filter');
        let searchTimeout;
        search?.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.loadRoster(), 250);
        });
        filter?.addEventListener('change', () => this.loadRoster());
    },

    async loadAll() {
        await Promise.all([this.loadStats(), this.loadWindow(), this.loadRoster()]);
    },

    async loadStats() {
        try {
            const data = await API.request('/admin/check-in');
            const total = data.stats?.total || 0;
            const checkedIn = data.stats?.checked_in || 0;
            document.getElementById('checkin-count').textContent = checkedIn;
            document.getElementById('checkin-remaining').textContent = Math.max(0, total - checkedIn);
            document.getElementById('checkin-total').textContent = total;

            // Window status badge — coloured based on whether check-in is open.
            const badge = document.getElementById('checkin-window-status');
            if (badge) {
                const status = data.window_status || 'open';
                if (status === 'open') {
                    badge.textContent = 'OPEN';
                    badge.className = 'badge badge-success';
                } else {
                    badge.textContent = status;
                    badge.className = 'badge badge-warning';
                }
            }
        } catch (err) {
            console.error('Failed to load check-in stats', err);
        }
    },

    async loadWindow() {
        try {
            const data = await API.request('/admin/settings/check-in-window');
            const openInput = document.getElementById('checkin-window-open');
            const closeInput = document.getElementById('checkin-window-close');
            if (openInput) openInput.value = isoToLocalInput(data.opens_at);
            if (closeInput) closeInput.value = isoToLocalInput(data.closes_at);
        } catch (err) {
            console.error('Failed to load check-in window', err);
        }
    },

    async saveWindow() {
        const opensAt = localInputToIso(document.getElementById('checkin-window-open').value);
        const closesAt = localInputToIso(document.getElementById('checkin-window-close').value);
        try {
            await API.request('/admin/settings/check-in-window', {
                method: 'PUT',
                body: JSON.stringify({ opens_at: opensAt, closes_at: closesAt }),
            });
            Utils.showAlert('Check-in window saved', 'success');
            await this.loadStats();
        } catch (err) {
            Utils.showAlert('Failed to save window: ' + (err.message || err), 'error');
        }
    },

    async clearWindow() {
        if (!confirm('Remove both window bounds? Check-in will then be always-open.')) return;
        try {
            await API.request('/admin/settings/check-in-window', {
                method: 'PUT',
                body: JSON.stringify({ opens_at: null, closes_at: null }),
            });
            document.getElementById('checkin-window-open').value = '';
            document.getElementById('checkin-window-close').value = '';
            Utils.showAlert('Window cleared — check-in is always open', 'success');
            await this.loadStats();
        } catch (err) {
            Utils.showAlert('Failed to clear window: ' + (err.message || err), 'error');
        }
    },

    async submitManualCheckIn() {
        const input = document.getElementById('checkin-ref-input');
        const raw = input.value.trim();
        if (!raw) return;

        // The QR code encodes JSON like {ref:"REF260001", ...}; if a scan was
        // pasted in, extract the ref. Otherwise treat as a typed ref.
        let ref = raw;
        try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.ref) ref = parsed.ref;
        } catch { /* not JSON — ref as-is */ }

        await this.doCheckIn(ref);
        input.value = '';
        input.focus();
    },

    async doCheckIn(ref) {
        const force = document.getElementById('checkin-force')?.checked === true;
        const result = document.getElementById('checkin-result');
        try {
            const data = await API.request('/admin/check-in', {
                method: 'POST',
                body: JSON.stringify({ ref_number: ref, action: 'check_in', force }),
            });
            const klass = data.already_checked_in ? 'alert-warning' : 'alert-success';
            if (result) {
                result.innerHTML = `<div class="alert ${klass}"><span class="alert-msg"></span></div>`;
                result.querySelector('.alert-msg').textContent = data.message;
            }
            await Promise.all([this.loadStats(), this.loadRoster()]);
        } catch (err) {
            if (result) {
                result.innerHTML = '<div class="alert alert-error"><span class="alert-msg"></span></div>';
                result.querySelector('.alert-msg').textContent = err.message || 'Check-in failed';
            }
        }
    },

    async undoCheckIn(ref) {
        if (!confirm(`Undo check-in for ${ref}?`)) return;
        try {
            await API.request('/admin/check-in', {
                method: 'POST',
                body: JSON.stringify({ ref_number: ref, action: 'check_out', force: true }),
            });
            Utils.showAlert(`Check-in undone for ${ref}`, 'success');
            await Promise.all([this.loadStats(), this.loadRoster()]);
        } catch (err) {
            Utils.showAlert('Failed to undo: ' + (err.message || err), 'error');
        }
    },

    async loadRoster() {
        const tbody = document.getElementById('checkin-roster-body');
        if (!tbody) return;
        const q = document.getElementById('checkin-roster-search')?.value.trim() || '';
        const status = document.getElementById('checkin-roster-filter')?.value || 'all';
        try {
            const data = await API.request(`/admin/check-in/list?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`);
            const rows = data.attendees || [];
            if (!rows.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-secondary" style="text-align:center; padding: 1.5rem;">No matching attendees</td></tr>';
                return;
            }
            tbody.innerHTML = rows.map(r => {
                const isIn = r.checked_in === 1 || r.checked_in === true;
                const statusBadge = isIn
                    ? '<span class="badge badge-success">Checked in</span>'
                    : '<span class="badge badge-secondary">Not yet</span>';
                const time = r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : '—';
                const action = isIn
                    ? `<button class="btn btn-sm btn-ghost" data-checkout-ref="${Utils.escapeHtml(r.ref_number)}"><i class="fas fa-undo"></i> Undo</button>`
                    : `<button class="btn btn-sm btn-success" data-checkin-ref="${Utils.escapeHtml(r.ref_number)}"><i class="fas fa-check"></i> Check in</button>`;
                return `<tr>
                    <td>${Utils.escapeHtml(r.name || '')}</td>
                    <td><strong>${Utils.escapeHtml(r.ref_number || '')}</strong></td>
                    <td>${Utils.escapeHtml(r.room_number || '—')}</td>
                    <td>${Utils.escapeHtml(r.group_name || '—')}</td>
                    <td>${statusBadge}</td>
                    <td>${time}</td>
                    <td>${action}</td>
                </tr>`;
            }).join('');

            tbody.querySelectorAll('[data-checkin-ref]').forEach(btn => {
                btn.addEventListener('click', () => this.doCheckIn(btn.dataset.checkinRef));
            });
            tbody.querySelectorAll('[data-checkout-ref]').forEach(btn => {
                btn.addEventListener('click', () => this.undoCheckIn(btn.dataset.checkoutRef));
            });
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="7" class="alert-error" style="text-align:center;">Failed to load roster</td></tr>';
            console.error(err);
        }
    },

    // ---------- Camera scanner ----------

    async toggleScanner() {
        const region = document.getElementById('checkin-scanner');
        if (!region) return;
        if (region.style.display === 'none') {
            try {
                await this.startScanner();
                region.style.display = 'block';
            } catch (err) {
                Utils.showAlert('Cannot start camera: ' + (err.message || err), 'error');
            }
        } else {
            await this.stopScanner();
            region.style.display = 'none';
        }
    },

    loadQrLib() {
        if (this._qrLibLoaded) return this._qrLibLoaded;
        this._qrLibLoaded = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = this.HTML5_QRCODE_CDN;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load QR scanner library'));
            document.head.appendChild(s);
        });
        return this._qrLibLoaded;
    },

    async startScanner() {
        await this.loadQrLib();
        if (typeof Html5Qrcode === 'undefined') throw new Error('QR library not available');
        if (this._scannerInstance) return; // already running

        const scanner = new Html5Qrcode('checkin-scanner-region');
        this._scannerInstance = scanner;

        await scanner.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: 220 },
            (decoded) => this.onScanSuccess(decoded),
            () => { /* per-frame failures are normal — ignore */ }
        );
    },

    async stopScanner() {
        if (!this._scannerInstance) return;
        try {
            await this._scannerInstance.stop();
            await this._scannerInstance.clear();
        } catch (err) {
            console.warn('Scanner stop failed', err);
        }
        this._scannerInstance = null;
    },

    _lastScanRef: null,
    _lastScanAt: 0,
    onScanSuccess(decoded) {
        // QR codes from the attendee dashboard encode JSON {ref, name, type}.
        // Tolerate plain-string refs too.
        let ref = decoded;
        try {
            const parsed = JSON.parse(decoded);
            if (parsed && parsed.ref) ref = parsed.ref;
        } catch { /* plain ref */ }

        // Debounce identical scans (camera can re-detect the same frame for seconds).
        const now = Date.now();
        if (ref === this._lastScanRef && (now - this._lastScanAt) < 3000) return;
        this._lastScanRef = ref;
        this._lastScanAt = now;

        this.doCheckIn(ref);
    },
};

// Helpers ----

// `<input type="datetime-local">` works in the browser's local timezone but
// gives no offset. Convert ISO ↔ local form values without losing the moment.
function isoToLocalInput(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const tzOffsetMs = d.getTimezoneOffset() * 60_000;
    return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function localInputToIso(local) {
    if (!local) return null;
    const d = new Date(local);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
}

window.CheckInManagement = CheckInManagement;
