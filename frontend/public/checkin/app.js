/*
 * Retreat Check-in PWA controller.
 *
 * One screen, one job: scan or type a ref → check in → ready for next.
 *
 * Notable behaviours:
 *   - Camera scanner via html5-qrcode (loaded from cdnjs in index.html)
 *   - Audio feedback via Web Audio API (3 generated tones — no audio files)
 *   - Vibration via navigator.vibrate (silently no-op where unsupported)
 *   - Long-press on a recent-check-in row triggers undo with confirmation
 *   - Offline queue: failed POSTs persist to localStorage; we drain when
 *     online (online event + 30s poll) so a flaky venue WiFi doesn't lose
 *     check-ins
 *   - Auth: standard admin JWT via /api/admin/login. Token in localStorage
 *     under a PWA-specific key so it doesn't bleed into the main dashboard.
 *
 * Service worker is registered separately for shell caching only — the
 * queue lives here because iOS Safari doesn't support Background Sync.
 */

(() => {
    'use strict';

    // -------- Constants --------
    const TOKEN_KEY = 'checkin_admin_token';
    const QUEUE_KEY = 'checkin_pending_queue_v1';
    const RECENT_KEY = 'checkin_recent_v1';
    const RECENT_MAX = 12;
    const SCAN_DEBOUNCE_MS = 3000;          // same code within 3s is ignored
    const QUEUE_DRAIN_INTERVAL_MS = 30_000; // poll while online
    const STATS_REFRESH_MS = 60_000;
    const LONG_PRESS_MS = 600;

    // -------- State --------
    const State = {
        token: localStorage.getItem(TOKEN_KEY) || '',
        adminName: '',
        adminRole: 'admin',
        windowStatus: 'unknown',
        stats: { total: 0, checked_in: 0 },
        recent: loadRecent(),
        pending: loadQueue(),
        lastScan: { ref: null, at: 0 },
        scanner: null,
        scanning: false,
        force: false,
    };

    // -------- DOM shortcuts --------
    const $ = (id) => document.getElementById(id);
    const setText = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };

    // ============================================================
    // BOOT
    // ============================================================
    window.addEventListener('DOMContentLoaded', () => {
        registerServiceWorker();
        bindLoginForm();
        bindAppUI();
        wireConnectivity();
        if (State.token) {
            // Have a token — try to load the admin profile. If it 401s,
            // clear it and show login.
            tryEnterApp();
        } else {
            showScreen('login');
        }
    });

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/checkin/sw.js').catch((err) => {
                console.warn('[sw] registration failed', err);
            });
        }
    }

    // ============================================================
    // LOGIN
    // ============================================================
    function bindLoginForm() {
        $('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = $('username').value.trim();
            const password = $('password').value;
            if (!username || !password) return;

            $('login-error').classList.add('hidden');
            const btn = $('login-btn');
            btn.disabled = true;
            $('login-spinner').classList.remove('hidden');
            $('login-btn-text').textContent = 'Signing in…';

            try {
                const res = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user: username, pass: password }),
                });
                const body = await res.json().catch(() => ({}));

                if (res.status === 403 && body.reset_required) {
                    showLoginError('Your password must be reset. Open the main admin portal to set a new password, then come back.');
                    return;
                }
                if (!res.ok || !body.token) {
                    showLoginError(body.error || `Sign-in failed (${res.status})`);
                    return;
                }

                State.token = body.token;
                localStorage.setItem(TOKEN_KEY, State.token);
                await tryEnterApp();
            } catch (err) {
                showLoginError(err.message || 'Network error');
            } finally {
                btn.disabled = false;
                $('login-spinner').classList.add('hidden');
                $('login-btn-text').textContent = 'Sign in';
            }
        });

        $('pw-toggle').addEventListener('click', () => {
            const input = $('password');
            input.type = input.type === 'password' ? 'text' : 'password';
        });

        // PWA install prompt — Chromium fires beforeinstallprompt, then we
        // surface our own button. iOS doesn't fire it; users use Share →
        // Add to Home Screen manually.
        let deferredInstall = null;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredInstall = e;
            $('install-hint').hidden = false;
        });
        $('install-btn').addEventListener('click', async () => {
            if (deferredInstall) {
                deferredInstall.prompt();
                await deferredInstall.userChoice;
                deferredInstall = null;
                $('install-hint').hidden = true;
            }
        });
    }

    function showLoginError(msg) {
        const el = $('login-error');
        el.textContent = msg;
        el.classList.remove('hidden');
    }

    async function tryEnterApp() {
        try {
            const me = await apiGet('/api/admin/me');
            State.adminName = me.full_name || me.username || 'Admin';
            State.adminRole = me.role || 'admin';
            setText('who-am-i', State.adminName);
            showScreen('app');
            await Promise.all([loadStats(), startScanner()]);
            renderRecent();
            renderQueueBadge();
            // Periodic stats refresh keeps the counter accurate when other
            // admins check people in via the main dashboard.
            setInterval(loadStats, STATS_REFRESH_MS);
            // Background drain — online event handles the immediate burst,
            // poll handles the case where /api was reachable but a single
            // POST failed transiently.
            setInterval(() => { if (navigator.onLine) drainQueue(); }, QUEUE_DRAIN_INTERVAL_MS);
        } catch (err) {
            // Bad / expired token. Clear and bounce to login.
            console.warn('Failed to enter app', err);
            localStorage.removeItem(TOKEN_KEY);
            State.token = '';
            showScreen('login');
            showLoginError('Session expired. Please sign in again.');
        }
    }

    function showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        $(`${name}-screen`).classList.add('active');
    }

    // ============================================================
    // APP UI WIRING
    // ============================================================
    function bindAppUI() {
        $('menu-btn').addEventListener('click', () => {
            $('menu-sheet').hidden = !$('menu-sheet').hidden;
        });
        document.addEventListener('click', (e) => {
            // Close menu when clicking outside it
            if (!$('menu-sheet').hidden && !e.target.closest('#menu-sheet') && !e.target.closest('#menu-btn')) {
                $('menu-sheet').hidden = true;
            }
        });
        $('force-toggle').addEventListener('change', (e) => {
            State.force = e.target.checked;
            toast(State.force ? 'Force mode ON — window override' : 'Force mode off', State.force ? 'warn' : 'success');
        });
        $('refresh-btn').addEventListener('click', () => { loadStats(); $('menu-sheet').hidden = true; });
        $('logout-btn').addEventListener('click', () => {
            if (!confirm('Sign out of this device?')) return;
            localStorage.removeItem(TOKEN_KEY);
            State.token = '';
            stopScanner();
            $('menu-sheet').hidden = true;
            showScreen('login');
        });

        $('manual-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const ref = $('manual-ref').value.trim();
            if (!ref) return;
            performCheckIn(ref, { source: 'manual' });
            $('manual-ref').value = '';
        });

        // Search sheet
        $('open-search-btn').addEventListener('click', () => { openSearch(); $('menu-sheet').hidden = true; });
        $('search-close').addEventListener('click', closeSearch);
        let searchDebounce;
        $('search-input').addEventListener('input', () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(loadSearch, 200);
        });
        $('search-filter').addEventListener('change', loadSearch);
    }

    function wireConnectivity() {
        const apply = () => {
            const off = !navigator.onLine;
            $('connectivity').classList.toggle('offline', off);
            $('connectivity').title = off ? 'Offline — check-ins will queue' : 'Online';
            if (!off) drainQueue();
        };
        window.addEventListener('online', apply);
        window.addEventListener('offline', apply);
        apply();
    }

    // ============================================================
    // SCANNER
    // ============================================================
    async function startScanner() {
        if (State.scanner) return;
        if (typeof Html5Qrcode === 'undefined') {
            toast('QR scanner library failed to load', 'error');
            return;
        }
        try {
            const scanner = new Html5Qrcode('scanner-region', { verbose: false });
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                (decoded) => onScan(decoded),
                () => { /* per-frame decode failures are normal; ignore */ },
            );
            State.scanner = scanner;
            State.scanning = true;
        } catch (err) {
            console.error('Camera start failed', err);
            toast('Camera unavailable — use the manual ref input', 'error');
        }
    }

    async function stopScanner() {
        if (!State.scanner) return;
        try { await State.scanner.stop(); await State.scanner.clear(); }
        catch (err) { console.warn('Scanner stop failed', err); }
        State.scanner = null;
        State.scanning = false;
    }

    function onScan(decoded) {
        // Attendee QR codes encode JSON {ref, name, type}. Tolerate plain ref too.
        let ref = decoded;
        try {
            const parsed = JSON.parse(decoded);
            if (parsed && parsed.ref) ref = parsed.ref;
        } catch { /* plain ref */ }

        const now = Date.now();
        if (ref === State.lastScan.ref && (now - State.lastScan.at) < SCAN_DEBOUNCE_MS) return;
        State.lastScan = { ref, at: now };

        performCheckIn(ref, { source: 'scan' });
    }

    // ============================================================
    // CHECK-IN (online or queued)
    // ============================================================
    async function performCheckIn(refNumber, { source }) {
        const payload = {
            ref_number: refNumber.toUpperCase(),
            action: 'check_in',
            force: State.force,
        };

        if (!navigator.onLine) {
            enqueue(payload, refNumber);
            renderQueueBadge();
            flashScanner('warn');
            playTone('warn');
            vibrate([60, 30, 60]);
            showScannerResult('warn', refNumber, 'Saved offline — will sync');
            unshiftRecent({ ref: refNumber, name: refNumber, ts: Date.now(), queued: true });
            return;
        }

        try {
            const res = await postCheckIn(payload);
            handleResult(res, refNumber);
        } catch (err) {
            // Network blip → queue
            console.warn('Check-in network error, queuing', err);
            enqueue(payload, refNumber);
            renderQueueBadge();
            flashScanner('warn');
            playTone('warn');
            vibrate([60, 30, 60]);
            showScannerResult('warn', refNumber, 'Queued — will retry');
            unshiftRecent({ ref: refNumber, name: refNumber, ts: Date.now(), queued: true });
        }
    }

    function handleResult(res, ref) {
        if (res.already_checked_in) {
            flashScanner('warn');
            playTone('warn');
            vibrate([50, 30, 50]);
            showScannerResult('warn', res.attendee?.name || ref, 'Already checked in');
        } else if (res.attendee) {
            flashScanner('success');
            playTone('success');
            vibrate(50);
            showScannerResult('success', res.attendee.name, res.attendee.ref_number);
            unshiftRecent({
                id: res.attendee.id,
                ref: res.attendee.ref_number,
                name: res.attendee.name,
                ts: Date.now(),
            });
            // Optimistic stats bump (loadStats refresh will reconcile).
            State.stats.checked_in = Math.min(State.stats.total, State.stats.checked_in + 1);
            renderStats();
        } else {
            flashScanner('error');
            playTone('error');
            vibrate([200]);
            showScannerResult('error', ref, res.message || 'Unexpected response');
        }
    }

    async function postCheckIn(payload) {
        const res = await fetch('/api/admin/check-in', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${State.token}`,
            },
            body: JSON.stringify(payload),
        });
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) { handleSessionExpired(); throw new Error('AUTH'); }
        if (!res.ok) {
            // Surface server message in scanner overlay
            flashScanner('error');
            playTone('error');
            vibrate([200]);
            const msg = body.error || `HTTP ${res.status}`;
            showScannerResult('error', payload.ref_number, msg);
            return { handled: true };
        }
        return body;
    }

    // ============================================================
    // OFFLINE QUEUE
    // ============================================================
    function loadQueue() {
        try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
        catch { return []; }
    }
    function saveQueue() { localStorage.setItem(QUEUE_KEY, JSON.stringify(State.pending)); }
    function enqueue(payload, refNumber) {
        State.pending.push({ payload, refNumber, queuedAt: Date.now() });
        saveQueue();
    }
    function renderQueueBadge() {
        const n = State.pending.length;
        if (n > 0) { $('queue-pill').hidden = false; setText('queue-count', n); }
        else $('queue-pill').hidden = true;
    }

    async function drainQueue() {
        if (!State.pending.length) return;
        if (!navigator.onLine) return;
        const items = [...State.pending];
        for (const item of items) {
            try {
                const res = await fetch('/api/admin/check-in', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${State.token}`,
                    },
                    body: JSON.stringify(item.payload),
                });
                if (res.status === 401) { handleSessionExpired(); return; } // stop — need re-auth, leave queue
                // 4xx that isn't auth = bad data we won't fix by retrying.
                // Drop the entry but warn the admin.
                if (!res.ok && res.status >= 400 && res.status < 500) {
                    State.pending = State.pending.filter(p => p !== item);
                    saveQueue();
                    const body = await res.json().catch(() => ({}));
                    toast(`Queued ${item.refNumber} failed: ${body.error || res.status}`, 'error');
                    continue;
                }
                if (!res.ok) continue; // 5xx — leave queued for next attempt
                State.pending = State.pending.filter(p => p !== item);
                saveQueue();
                // Update the recent entry for this ref to show it's no longer queued.
                const recent = State.recent.find(r => r.ref === item.refNumber && r.queued);
                if (recent) { recent.queued = false; saveRecent(); renderRecent(); }
            } catch (err) {
                // Network blip mid-drain — stop and try again next interval.
                return;
            }
        }
        renderQueueBadge();
        toast('Offline queue synced', 'success');
    }

    // ============================================================
    // STATS
    // ============================================================
    async function loadStats() {
        try {
            const data = await apiGet('/api/admin/check-in');
            State.stats.total = data.stats?.total || 0;
            State.stats.checked_in = data.stats?.checked_in || 0;
            const status = data.window_status || 'open';
            const pill = $('window-pill');
            if (status === 'open') { pill.textContent = 'Open'; pill.className = 'window-pill open'; }
            else { pill.textContent = status; pill.className = 'window-pill closed'; }
            renderStats();
        } catch (err) {
            $('window-pill').textContent = 'offline';
            $('window-pill').className = 'window-pill error';
        }
    }

    function renderStats() {
        setText('stats-in', State.stats.checked_in);
        setText('stats-total', State.stats.total);
    }

    // ============================================================
    // RECENT LIST + LONG-PRESS UNDO
    // ============================================================
    function loadRecent() {
        try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
        catch { return []; }
    }
    function saveRecent() { localStorage.setItem(RECENT_KEY, JSON.stringify(State.recent)); }
    function unshiftRecent(entry) {
        State.recent = [entry, ...State.recent.filter(r => r.ref !== entry.ref)].slice(0, RECENT_MAX);
        saveRecent();
        renderRecent();
    }
    function renderRecent() {
        const ul = $('recent-list');
        if (!State.recent.length) {
            ul.innerHTML = '<li class="recent-empty">No check-ins yet — scan a badge to start.</li>';
            return;
        }
        ul.innerHTML = State.recent.map(r => `
            <li class="recent-item ${r.queued ? 'queued' : ''}" data-ref="${escapeAttr(r.ref)}">
                <i class="fas ${r.queued ? 'fa-hourglass-half recent-icon' : 'fa-check-circle recent-icon'}"></i>
                <span class="recent-name">${escapeHtml(r.name || r.ref)}</span>
                <span class="recent-meta">${formatTime(r.ts)}</span>
            </li>
        `).join('');
        // Long-press bindings
        ul.querySelectorAll('.recent-item').forEach(li => bindLongPress(li, () => undoCheckIn(li.dataset.ref)));
    }

    function bindLongPress(el, onTrigger) {
        let timer = null;
        const start = () => {
            el.classList.add('pressing');
            timer = setTimeout(() => {
                timer = null;
                onTrigger();
                el.classList.remove('pressing');
            }, LONG_PRESS_MS);
        };
        const cancel = () => {
            if (timer) { clearTimeout(timer); timer = null; }
            el.classList.remove('pressing');
        };
        el.addEventListener('pointerdown', start);
        el.addEventListener('pointerup', cancel);
        el.addEventListener('pointerleave', cancel);
        el.addEventListener('pointercancel', cancel);
    }

    async function undoCheckIn(ref) {
        if (!confirm(`Undo check-in for ${ref}?`)) return;
        try {
            const res = await fetch('/api/admin/check-in', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${State.token}`,
                },
                body: JSON.stringify({ ref_number: ref, action: 'check_out', force: true }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast(`Undo failed: ${body.error || res.status}`, 'error');
                return;
            }
            toast(`Undone: ${ref}`, 'success');
            State.recent = State.recent.filter(r => r.ref !== ref);
            saveRecent();
            renderRecent();
            // Bump stats down (loadStats will reconcile).
            State.stats.checked_in = Math.max(0, State.stats.checked_in - 1);
            renderStats();
        } catch (err) {
            toast('Undo failed (network)', 'error');
        }
    }

    // ============================================================
    // SEARCH SHEET
    // ============================================================
    async function openSearch() {
        $('search-sheet').hidden = false;
        $('search-input').value = '';
        await loadSearch();
        $('search-input').focus();
    }
    function closeSearch() { $('search-sheet').hidden = true; }

    async function loadSearch() {
        const q = $('search-input').value.trim();
        const status = $('search-filter').value;
        const ul = $('search-list');
        ul.innerHTML = '<li class="recent-empty">Loading…</li>';
        try {
            const data = await apiGet(`/api/admin/check-in/list?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`);
            const rows = data.attendees || [];
            if (!rows.length) {
                ul.innerHTML = '<li class="recent-empty">No matches.</li>';
                return;
            }
            ul.innerHTML = rows.map(r => {
                const isIn = r.checked_in === 1 || r.checked_in === true;
                return `<li class="search-item" data-ref="${escapeAttr(r.ref_number)}">
                    <div class="search-item-name">
                        <div>${escapeHtml(r.name)}</div>
                        <div class="search-item-ref">${escapeHtml(r.ref_number)}${r.room_number ? ' · Room ' + escapeHtml(r.room_number) : ''}</div>
                    </div>
                    <span class="${isIn ? 'search-status-in' : 'search-status-out'}">${isIn ? 'In' : 'Not yet'}</span>
                </li>`;
            }).join('');
            ul.querySelectorAll('.search-item').forEach(li => {
                li.addEventListener('click', () => {
                    performCheckIn(li.dataset.ref, { source: 'search' });
                    closeSearch();
                });
            });
        } catch (err) {
            ul.innerHTML = `<li class="recent-empty">Failed to load roster: ${escapeHtml(err.message || '')}</li>`;
        }
    }

    // ============================================================
    // AUDIO + VIBRATION
    // ============================================================
    let audioCtx = null;
    function ensureAudio() {
        if (audioCtx) return audioCtx;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch { audioCtx = null; }
        return audioCtx;
    }
    function playTone(kind) {
        const ctx = ensureAudio();
        if (!ctx) return;
        // Resume on user gesture (browsers require this for autoplay)
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain).connect(ctx.destination);

        if (kind === 'success') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
        } else if (kind === 'warn') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(330, now + 0.08);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);
        }

        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'error' ? 0.3 : 0.18));

        osc.start(now);
        osc.stop(now + (kind === 'error' ? 0.3 : 0.2));
    }
    function vibrate(pattern) {
        if (typeof navigator.vibrate === 'function') {
            try { navigator.vibrate(pattern); } catch { /* no-op */ }
        }
    }

    // ============================================================
    // SCANNER FEEDBACK OVERLAY
    // ============================================================
    let flashTimeout, resultTimeout;
    function flashScanner(kind) {
        const flash = $('scanner-flash');
        flash.className = 'scanner-flash ' + kind;
        clearTimeout(flashTimeout);
        flashTimeout = setTimeout(() => { flash.className = 'scanner-flash'; }, 180);
    }
    function showScannerResult(kind, name, detail) {
        const result = $('scanner-result');
        result.className = 'scanner-result ' + kind;
        result.classList.remove('hidden');
        $('scanner-result-name').textContent = name || '';
        $('scanner-result-detail').textContent = detail || '';
        clearTimeout(resultTimeout);
        resultTimeout = setTimeout(() => result.classList.add('hidden'), 1800);
    }

    // ============================================================
    // TOAST
    // ============================================================
    let toastTimeout;
    function toast(msg, kind = 'success') {
        const el = $('toast');
        el.textContent = msg;
        el.className = 'toast ' + kind;
        el.classList.remove('hidden');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => el.classList.add('hidden'), 2200);
    }

    // ============================================================
    // API helpers
    // ============================================================
    async function apiGet(path) {
        const res = await fetch(path, {
            headers: { 'Authorization': `Bearer ${State.token}` },
        });
        if (res.status === 401) {
            // In-session 401 — token expired or invalidated server-side.
            // Bounce to login instead of leaving a broken app screen up.
            handleSessionExpired();
            throw new Error('AUTH');
        }
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `HTTP ${res.status}`);
        }
        return res.json();
    }

    function handleSessionExpired() {
        if (!State.token) return; // already logged out
        State.token = '';
        localStorage.removeItem(TOKEN_KEY);
        stopScanner();
        // Close any open sheets so the login screen is the only thing visible.
        $('search-sheet').hidden = true;
        $('menu-sheet').hidden = true;
        showScreen('login');
        showLoginError('Session expired. Please sign in again.');
    }

    // ============================================================
    // utils
    // ============================================================
    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function escapeAttr(s) { return escapeHtml(s); }
    function formatTime(ts) {
        const d = new Date(ts);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
    }
})();
