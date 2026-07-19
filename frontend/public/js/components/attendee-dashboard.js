// frontend/public/js/components/attendee-dashboard.js - v2 with Stripe payments
const AttendeeDashboard = {
    data: null,

    /**
     * Initialize attendee dashboard
     */
    async init() {
        try {
            await this.render();
            await this.loadData();
            this.bindEvents();
            this.bindViewNav();
            // Honour a deep link from the PWA shortcuts / manifest, e.g.
            // /?view=checkin opens straight to the check-in panel. Falls back
            // to Overview for anything unrecognised.
            const validViews = ['overview', 'payments', 'family', 'my-details', 'transport', 'schedule', 'activities', 'community', 'resources', 'checkin'];
            let initialView = 'overview';
            try {
                const requested = new URLSearchParams(window.location.search).get('view');
                if (requested && validViews.includes(requested)) initialView = requested;
            } catch { /* ignore malformed query strings */ }
            this.showView(initialView);
            this.initNotifications();
        } catch (error) {
            console.error('Failed to initialize attendee dashboard:', error);
            Utils.showAlert('Failed to load dashboard', 'error');
        }
    },

    /**
     * Render dashboard template (updated with announcements)
     */
    async render() {
        try {
            const content = await Utils.loadTemplate('templates/attendee-dashboard.html');
            document.getElementById('app').innerHTML = content;
        } catch (error) {
            console.warn('Template loading failed, using fallback');
            this.renderFallback();
        }
    },

    /**
     * Fallback render with announcements section
     */
    renderFallback() {
        document.getElementById('app').innerHTML = `
            <div class="dashboard">
                <div class="dashboard-header">
                    <div>
                        <h1 class="dashboard-title">Welcome, <span id="attendee-name-display">Loading...</span></h1>
                        <p class="dashboard-subtitle">Your retreat portal</p>
                    </div>
                    <div class="dashboard-actions">
                        <button class="btn btn-ghost" id="refresh-dashboard"><i class="fas fa-sync-alt"></i></button>
                        <button class="btn btn-ghost" id="attendee-logout"><i class="fas fa-sign-out-alt"></i> Logout</button>
                    </div>
                </div>

                <div id="payment-banner" style="display: none; margin-bottom: 1.5rem;">
                    <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(118, 75, 162, 0.08) 100%); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: #a78bfa; font-weight: 600; margin-bottom: 0.25rem;">Outstanding Balance</div>
                            <div id="banner-amount" style="font-size: 2rem; font-weight: 700; color: #fff;">£0.00</div>
                        </div>
                        <div id="banner-pay-buttons" style="display: flex; gap: 0.5rem; flex-wrap: wrap;"></div>
                    </div>
                </div>

                <div id="announcements-section" style="margin-bottom: 1.5rem;">
                    <div class="data-table">
                        <div class="table-header">
                            <h3 class="table-title"><i class="fas fa-bullhorn"></i> Announcements</h3>
                            <span id="announcements-count" class="badge badge-secondary" style="display: none;">0</span>
                        </div>
                        <div id="announcements-content" class="table-content">
                            <div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
                        </div>
                    </div>
                </div>

                <div class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-bottom: 1.5rem;">
                    <div class="stat-card" id="payment-info-card" style="padding: 0; border: none;">
                        <div style="padding: 1.25rem 1.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem;">
                                <div class="stat-icon-modern" style="background: rgba(139, 92, 246, 0.15); color: #a78bfa;"><i class="fas fa-credit-card"></i></div>
                                <div style="font-size: 0.85rem; font-weight: 600; color: #fff;">Payment</div>
                            </div>
                            <div id="payment-info-content"><div class="loading-placeholder" style="padding: 0;">Loading...</div></div>
                        </div>
                    </div>
                    <div class="stat-card" id="room-info-card" style="padding: 0; border: none;">
                        <div style="padding: 1.25rem 1.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem;">
                                <div class="stat-icon-modern" style="background: rgba(59, 130, 246, 0.15); color: #93c5fd;"><i class="fas fa-bed"></i></div>
                                <div style="font-size: 0.85rem; font-weight: 600; color: #fff;">Room</div>
                            </div>
                            <div id="room-info-content"><div class="loading-placeholder" style="padding: 0;">Loading...</div></div>
                        </div>
                    </div>
                    <div class="stat-card" id="group-info-card" style="padding: 0; border: none;">
                        <div style="padding: 1.25rem 1.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem;">
                                <div class="stat-icon-modern" style="background: rgba(16, 185, 129, 0.15); color: #6ee7b7;"><i class="fas fa-users"></i></div>
                                <div style="font-size: 0.85rem; font-weight: 600; color: #fff;">Group</div>
                            </div>
                            <div id="group-info-content"><div class="loading-placeholder" style="padding: 0;">Loading...</div></div>
                        </div>
                    </div>
                </div>

                <div class="data-table" id="detailed-info">
                    <div class="table-header"><h3 class="table-title">Your Details</h3></div>
                    <div class="table-content" id="detailed-info-content"><div class="loading-placeholder">Loading...</div></div>
                </div>
            </div>
        `;
    },

    /**
     * Load attendee data from API (now includes announcements)
     */
    async loadData() {
        try {
            this.data = await API.get('/me');
            this.updateDisplay();
        } catch (error) {
            console.error('Failed to load attendee data:', error);
            throw error;
        }
    },

    /**
     * Update dashboard display with data (updated with announcements)
     */
    updateDisplay() {
        if (!this.data) return;

        // Update name (visible in topbar + sidebar brand)
        const nameDisplay = document.getElementById('attendee-name-display');
        if (nameDisplay) nameDisplay.textContent = this.data.name;
        const brandUser = document.getElementById('att-brand-user');
        if (brandUser) brandUser.textContent = this.data.name || '';
        const brandRef = document.getElementById('att-brand-ref');
        if (brandRef) brandRef.textContent = this.data.ref_number || '';
        // Avatar initials from the attendee's name (up to two letters).
        const avatar = document.getElementById('att-avatar');
        if (avatar) avatar.textContent = this._initials(this.data.name);

        // Update announcements (new)
        this.updateAnnouncementsDisplay();

        // Update room information
        this.updateRoomInfo();

        // Update payment information
        this.updatePaymentInfo();

        // Update group information
        this.updateGroupInfo();
        // The Overview tab also shows a compact group card; render that
        // alongside the dedicated Family view rendering.
        this.updateOverviewGroupCard();

        // Update detailed information
        this.updateDetailedInfo();

        // Update family registration summary
        this.updateFamilySummary();

        // New features
        this.updateCountdown();
        this.updateQRCode();
        this.updateActivityTeams();
        this.updateTransportNote();
        this.updateHappeningNow();   // async, fire-and-forget
        this.updatePackingChecklist();
        this.bindProfileEdit();
        this.bindDownloadConfirmation();

        // Payments badge in sidebar — show "due" indicator if there's a balance.
        const badge = document.getElementById('att-nav-payments-badge');
        if (badge) {
            const due = this.data.payment_due || 0;
            badge.textContent = due > 0 ? '!' : '';
        }
    },

    /**
     * Compact group card on the Overview tab. Shows total members,
     * total family outstanding, and a CTA to the Family tab. Distinct
     * from updateGroupInfo() which targets the legacy detail panel id
     * that doesn't exist in the new template.
     */
    updateOverviewGroupCard() {
        const card = document.getElementById('overview-group-content');
        if (!card) return;
        const grp = this.data.group;
        if (!grp) {
            card.innerHTML = '<div style="font-size:0.8rem; color: var(--text-tertiary);">Not in a family group.</div>';
            return;
        }
        const totalMembers = grp.financial?.totalMembers ?? ((grp.members?.length || 0) + 1);
        const totalOutstanding = grp.financial?.totalOutstanding ?? 0;
        const dueLine = totalOutstanding > 0
            ? `<div style="font-size:0.8rem; color:#fbbf24; margin-bottom:0.4rem;">£${totalOutstanding.toFixed(2)} outstanding across family</div>`
            : `<div style="font-size:0.8rem; color:#6ee7b7; margin-bottom:0.4rem;">Family fully paid</div>`;
        card.innerHTML = `
            <div style="font-size:1rem; font-weight:600; color:#fff; margin-bottom:0.25rem;">${this._escape(grp.name)}</div>
            <div style="font-size:0.78rem; color: var(--text-tertiary); margin-bottom:0.5rem;">${totalMembers} member${totalMembers === 1 ? '' : 's'}${this.data.is_group_lead ? ' · you\'re the lead' : ''}</div>
            ${dueLine}
            <button class="btn btn-sm btn-ghost" data-go-view="family" style="width:100%;"><i class="fas fa-arrow-right"></i> Open Family</button>
        `;
        const btn = card.querySelector('[data-go-view="family"]');
        if (btn) btn.addEventListener('click', () => this.showView('family'));
    },

    /**
     * Wire up the sidebar nav links: switching panels, lazy-loading
     * family / my-details data on first open, and the mobile drawer.
     */
    bindViewNav() {
        document.querySelectorAll('.att-nav-link').forEach((a) => {
            // These are <a> without href, so make them keyboard-operable.
            a.setAttribute('role', 'button');
            a.setAttribute('tabindex', '0');
            const go = () => { const view = a.dataset.view; if (view) this.showView(view); };
            a.addEventListener('click', (e) => { e.preventDefault(); go(); });
            a.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
            });
        });
        const toggle = document.getElementById('att-sidebar-toggle');
        const sidebar = document.getElementById('att-sidebar');
        if (toggle && sidebar) {
            toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
            // Tap outside the sidebar (on mobile backdrop) closes it.
            document.addEventListener('click', (e) => {
                if (!sidebar.classList.contains('open')) return;
                if (sidebar.contains(e.target) || toggle.contains(e.target)) return;
                sidebar.classList.remove('open');
            });
        }
        // Delegated handler for any in-content "jump to view" link/button
        // (e.g. the overview transport nudge, My Details cross-links).
        document.addEventListener('click', (e) => {
            const el = e.target.closest('[data-go-view]');
            if (!el) return;
            e.preventDefault();
            const v = el.getAttribute('data-go-view');
            if (v) this.showView(v);
        });
    },

    showView(name) {
        document.querySelectorAll('.att-nav-link').forEach((a) => {
            const on = a.dataset.view === name;
            a.classList.toggle('active', on);
            a.setAttribute('aria-current', on ? 'page' : 'false');
        });
        document.querySelectorAll('.att-view').forEach((s) => {
            s.classList.toggle('active', s.dataset.viewPanel === name);
        });
        // Auto-close mobile drawer on view switch.
        const sidebar = document.getElementById('att-sidebar');
        if (sidebar) sidebar.classList.remove('open');

        // Topbar title per view so the user always knows where they are.
        // Overview is the personalised landing page (welcome + name); the
        // rest get a plain section heading.
        const titles = {
            overview: [this._greeting(), this.data?.name || ''],
            payments: ['Your retreat balance', 'Payments'],
            family: ['Your group', 'Family'],
            'my-details': ['Account', 'My Details'],
            transport: ['Getting there', 'Transport'],
            schedule: ['Plan your weekend', 'Schedule'],
            activities: ['Get involved', 'Activities'],
            community: ['Share & encourage', 'Community'],
            resources: ['Everything you need', 'Resources'],
            checkin: ['Arrive ready', 'Check-in'],
        };
        const [eyebrow, heading] = titles[name] || ['', ''];
        const eyebrowEl = document.querySelector('.att-topbar > div > div:first-child');
        const titleEl = document.getElementById('att-view-title');
        if (eyebrowEl) eyebrowEl.textContent = eyebrow;
        if (titleEl) titleEl.textContent = heading;

        // Lazy-load per-view data.
        if (name === 'family') this.loadFamilyView();
        if (name === 'my-details') this.renderMyDetailsView();
        if (name === 'transport') this.renderTransportView();
        if (name === 'schedule') this.loadSchedule();
        if (name === 'community') this.loadCommunity();
        if (name === 'resources') this.renderResourcesView();
        // Always land on the "Ready to check in?" prompt, not a stale open
        // QR, whenever the check-in panel is (re)opened.
        if (name === 'checkin') this.hideCheckinQR();
        else this._releaseWakeLock();
    },

    // Program items are shared across the Schedule view, the overview
    // "Happening now" card and My Plan — fetch once and cache.
    _programItems: null,
    async _loadProgram(force = false) {
        if (this._programItems && !force) return this._programItems;
        try {
            const res = await API.get('/program');
            this._programItems = (res && res.items) || [];
        } catch {
            this._programItems = [];
        }
        return this._programItems;
    },

    // Parse an item's start/end into epoch millis (local time). Only items with
    // both event_date (YYYY-MM-DD) and start_time (HH:MM) are schedulable.
    _itemStartMs(item) {
        if (!item.event_date || !item.start_time) return null;
        const t = Date.parse(`${item.event_date}T${item.start_time}`);
        return isNaN(t) ? null : t;
    },
    _itemEndMs(item, startMs) {
        if (item.end_time && item.event_date) {
            const t = Date.parse(`${item.event_date}T${item.end_time}`);
            if (!isNaN(t) && t > startMs) return t;
        }
        return startMs + 60 * 60 * 1000; // assume 1h when no end time
    },

    // ---- My Plan (starred sessions), persisted per attendee on-device ----
    _myPlanKey() { return `myplan_${this.data?.ref_number || 'guest'}`; },
    _getMyPlan() {
        try { return new Set(JSON.parse(localStorage.getItem(this._myPlanKey()) || '[]')); }
        catch { return new Set(); }
    },
    _isStarred(id) { return this._getMyPlan().has(id); },
    _toggleStar(id) {
        const plan = this._getMyPlan();
        if (plan.has(id)) plan.delete(id); else plan.add(id);
        localStorage.setItem(this._myPlanKey(), JSON.stringify([...plan]));
        return plan.has(id);
    },

    /**
     * Overview "Happening now / Up next" card. During the retreat this orients
     * the attendee to the current and next session; before it, it previews the
     * first session. Pulls from the shared program cache.
     */
    async updateHappeningNow() {
        const section = document.getElementById('happening-now-section');
        if (!section || !this.data) return;
        const items = await this._loadProgram();

        const now = Date.now();
        const timed = items
            .map(it => { const s = this._itemStartMs(it); return s == null ? null : { it, s, e: this._itemEndMs(it, s) }; })
            .filter(Boolean)
            .sort((a, b) => a.s - b.s);

        if (timed.length === 0) { section.style.display = 'none'; return; }

        const current = timed.find(x => x.s <= now && now < x.e);
        const next = timed.find(x => x.s > now);
        const plan = this._getMyPlan();
        const nextStarred = timed.find(x => x.s > now && plan.has(x.it.id));

        if (!current && !next) { section.style.display = 'none'; return; } // retreat over

        const chip = (label, item, accent, timeTxt) => {
            const loc = item.location ? ` · <i class="fas fa-location-dot"></i> ${this._escape(item.location)}` : '';
            return `
                <div style="flex:1; min-width:220px;">
                    <div style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.07em; color:${accent}; font-weight:700; margin-bottom:0.3rem;">${label}</div>
                    <div style="font-size:1rem; font-weight:700; color:#fff; line-height:1.25;">${this._escape(item.title)}</div>
                    <div style="font-size:0.78rem; color: var(--text-tertiary); margin-top:0.2rem;">${timeTxt}${loc}</div>
                </div>`;
        };

        const cells = [];
        if (current) {
            const until = Utils.program.formatTime(current.it.end_time);
            cells.push(chip('● Happening now', current.it, '#6ee7b7', until ? `until ${this._escape(until)}` : 'now'));
        }
        if (next && (!current || next.it.id !== current.it.id)) {
            cells.push(chip('Up next', next.it, '#a78bfa', this._escape(Utils.program.formatTime(next.it.start_time) || '')));
        }
        // If their next starred pick is different from the generic "next", show it.
        if (nextStarred && (!next || nextStarred.it.id !== next.it.id)) {
            cells.push(chip('★ Your next pick', nextStarred.it, '#fbbf24', this._escape(Utils.program.formatTime(nextStarred.it.start_time) || '')));
        }

        if (cells.length === 0) { section.style.display = 'none'; return; }

        section.style.display = 'block';
        section.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(16,185,129,0.10), rgba(139,92,246,0.08)); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:1.1rem 1.4rem;">
                <div style="display:flex; gap:1.5rem; flex-wrap:wrap; align-items:flex-start;">
                    ${cells.join('<div style="width:1px; background:rgba(255,255,255,0.08); align-self:stretch;"></div>')}
                    <button class="btn btn-sm btn-ghost" data-go-view="schedule" style="align-self:center;"><i class="fas fa-calendar-day"></i> Full schedule</button>
                </div>
            </div>`;
    },

    /**
     * Load the retreat schedule from the public program API and render it
     * into #schedule-content, grouped by day (preserving server order).
     * Mirrors the original hardcoded visual style.
     */
    async loadSchedule() {
        const container = document.getElementById('schedule-content');
        if (!container) return;

        this._ensureScheduleStyles();

        try {
            const items = await this._loadProgram();

            if (items.length === 0) {
                container.innerHTML = `
                    <div class="sched-empty">
                        <i class="fas fa-calendar-day"></i>
                        <div>The schedule will be published soon.</div>
                    </div>`;
                return;
            }

            // Group by day. The API returns items ordered by event_date then
            // start_time, so first-seen order is already chronological. Prefer
            // the structured event_date (formatted to "Fri, July 31"); fall back
            // to the legacy day_label for any pre-migration rows.
            const order = [];
            const groups = {};
            items.forEach((item) => {
                const key = item.event_date || item.day_label || '';
                if (!(key in groups)) {
                    groups[key] = {
                        label: item.event_date
                            ? Utils.program.formatDate(item.event_date)
                            : (item.day_label || ''),
                        items: []
                    };
                    order.push(key);
                }
                groups[key].items.push(item);
            });

            // Render each day as a vertical timeline of event cards. The
            // event type drives a colour-coded node + card accent.
            const daysHtml = order.map((key) => {
                const group = groups[key];
                const count = group.items.length;

                const events = group.items.map((item) => {
                    const color = Utils.program.eventTypeColor(item.event_type);
                    const icon = Utils.program.eventTypeIcon(item.event_type);
                    const starred = this._isStarred(item.id);
                    const starBtn = `<button type="button" class="sched-star${starred ? ' on' : ''}" data-star-id="${item.id}" title="${starred ? 'In My Plan — tap to remove' : 'Add to My Plan'}" aria-label="Toggle My Plan"><i class="fas fa-star"></i></button>`;

                    const startTxt = Utils.program.formatTime(item.start_time) || (item.time_label || '');
                    const endTxt = Utils.program.formatTime(item.end_time);
                    const timeStart = startTxt
                        ? `<div class="sched-time-start">${this._escape(startTxt)}</div>`
                        : `<div class="sched-time-start" style="color: var(--text-tertiary);">—</div>`;
                    const timeEnd = endTxt ? `<div class="sched-time-end">– ${this._escape(endTxt)}</div>` : '';

                    const mandatory = item.is_mandatory
                        ? `<span class="sched-badge-mand"><i class="fas fa-triangle-exclamation"></i> Mandatory</span>`
                        : '';
                    const audienceLabel = Utils.program.audienceLabel(item.audience);
                    const audience = (item.audience && item.audience !== 'all' && audienceLabel)
                        ? `<span class="sched-badge-aud">${this._escape(audienceLabel)}</span>`
                        : '';

                    const loc = item.location
                        ? `<div class="sched-meta-row"><i class="fas fa-location-dot"></i> ${this._escape(item.location)}</div>`
                        : '';
                    const contact = item.contact_name
                        ? `<div class="sched-meta-row"><i class="fas fa-user"></i> ${this._escape(item.contact_name)}</div>`
                        : '';
                    const meta = (loc || contact) ? `<div class="sched-meta">${loc}${contact}</div>` : '';
                    const desc = item.description
                        ? `<div class="sched-desc">${this._escape(item.description)}</div>`
                        : '';

                    return `
                        <div class="sched-event" data-sched-id="${item.id}" data-starred="${starred ? '1' : '0'}">
                            <div class="sched-time">${timeStart}${timeEnd}</div>
                            <div class="sched-rail"><div class="sched-node" style="background:${color};"><i class="fas ${icon}"></i></div></div>
                            <div class="sched-card" style="border-left-color:${color};">
                                <div class="sched-card-title">${this._escape(item.title)}${mandatory}${audience}${starBtn}</div>
                                ${meta}
                                ${desc}
                            </div>
                        </div>`;
                }).join('');

                return `
                    <div class="sched-day">
                        <div class="sched-day-head">
                            <span class="sched-day-pill">${this._escape(group.label)}</span>
                            <span class="sched-day-count">${count} ${count === 1 ? 'event' : 'events'}</span>
                        </div>
                        <div class="sched-timeline">${events}</div>
                    </div>`;
            }).join('');

            const planCount = this._getMyPlan().size;
            container.innerHTML = `
                <div class="sched-toolbar">
                    <label class="sched-plan-toggle">
                        <input type="checkbox" id="sched-myplan-only"> <i class="fas fa-star"></i> My Plan only
                        <span class="sched-plan-count" id="sched-plan-count">${planCount ? `(${planCount})` : ''}</span>
                    </label>
                </div>
                ${daysHtml}`;
            this._bindScheduleInteractions();
        } catch (err) {
            container.innerHTML = `
                <div class="sched-empty">
                    <i class="fas fa-triangle-exclamation"></i>
                    <div>Failed to load schedule: ${this._escape(err.message || '')}</div>
                </div>`;
        }
    },

    /**
     * Inject the timeline schedule styles once (mirrors the admin board's
     * style injector). Kept here so the markup above stays declarative.
     */
    _ensureScheduleStyles() {
        if (document.getElementById('attendee-schedule-styles')) return;
        const style = document.createElement('style');
        style.id = 'attendee-schedule-styles';
        style.textContent = `
            .sched-empty { text-align: center; color: var(--text-tertiary); padding: 2rem 1rem; }
            .sched-empty i { font-size: 1.8rem; display: block; margin-bottom: 0.6rem; opacity: 0.7; }
            .sched-day { margin-bottom: 1.75rem; }
            .sched-day:last-child { margin-bottom: 0; }
            .sched-day-head { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.9rem; }
            .sched-day-pill { background: rgba(94,234,212,0.12); color: #5eead4; border: 1px solid rgba(94,234,212,0.3); border-radius: 999px; padding: 0.2rem 0.75rem; font-size: 0.82rem; font-weight: 700; }
            .sched-day-count { color: var(--text-tertiary); font-size: 0.78rem; }
            .sched-timeline { position: relative; }
            .sched-event { display: grid; grid-template-columns: 62px 28px 1fr; align-items: start; }
            .sched-event:not(:last-child) { padding-bottom: 0.85rem; }
            .sched-time { text-align: right; padding: 0.2rem 0.5rem 0 0; }
            .sched-time-start { font-weight: 700; color: #fff; font-size: 0.82rem; white-space: nowrap; }
            .sched-time-end { color: var(--text-tertiary); font-size: 0.72rem; white-space: nowrap; }
            .sched-rail { position: relative; display: flex; justify-content: center; }
            .sched-rail::before { content: ''; position: absolute; left: 50%; transform: translateX(-50%); top: 6px; bottom: -0.85rem; width: 2px; background: rgba(120,120,180,0.25); }
            .sched-event:last-child .sched-rail::before { display: none; }
            .sched-node { position: relative; z-index: 1; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; color: #0b1020; }
            .sched-card { background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.08); border-left-width: 3px; border-radius: 10px; padding: 0.6rem 0.85rem; margin-left: 0.7rem; transition: background 0.15s ease, transform 0.15s ease; }
            .sched-card:hover { background: rgba(255,255,255,0.06); transform: translateX(2px); }
            .sched-card-title { font-weight: 700; color: #fff; font-size: 0.9rem; display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap; line-height: 1.3; }
            .sched-meta { margin-top: 0.4rem; display: flex; flex-direction: column; gap: 0.25rem; }
            .sched-meta-row { color: var(--text-secondary); font-size: 0.8rem; display: flex; align-items: center; gap: 0.45rem; }
            .sched-meta-row i { color: var(--text-tertiary); width: 0.9rem; text-align: center; }
            .sched-desc { color: var(--text-tertiary); font-size: 0.8rem; margin-top: 0.4rem; line-height: 1.5; }
            .sched-badge-mand { background: rgba(239,68,68,0.15); color: #fca5a5; border: 1px solid rgba(239,68,68,0.35); border-radius: 999px; padding: 0.1rem 0.5rem; font-size: 0.68rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.3rem; }
            .sched-badge-aud { background: rgba(139,92,246,0.15); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.3); border-radius: 999px; padding: 0.1rem 0.5rem; font-size: 0.68rem; font-weight: 700; }
            .sched-star { margin-left: auto; background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.28); font-size: 0.95rem; padding: 0.1rem 0.2rem; line-height: 1; transition: color 0.15s, transform 0.15s; }
            .sched-star:hover { color: #fbbf24; transform: scale(1.18); }
            .sched-star.on { color: #fbbf24; }
            .sched-toolbar { display: flex; justify-content: flex-end; align-items: center; margin-bottom: 1rem; }
            .sched-plan-toggle { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.8rem; color: var(--text-secondary); cursor: pointer; user-select: none; padding: 0.35rem 0.7rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 999px; }
            .sched-plan-toggle input { accent-color: #fbbf24; }
            .sched-plan-toggle i { color: #fbbf24; }
            .sched-plan-count { color: var(--text-tertiary); font-weight: 700; }
            .sched-day.sched-hidden { display: none; }
            @media (max-width: 560px) { .sched-event { grid-template-columns: 52px 24px 1fr; } .sched-node { width: 24px; height: 24px; } }
        `;
        document.head.appendChild(style);
    },

    /** Wire star toggles + the "My Plan only" filter after the schedule renders. */
    _bindScheduleInteractions() {
        const container = document.getElementById('schedule-content');
        if (!container) return;

        container.querySelectorAll('.sched-star').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.starId, 10);
                const now = this._toggleStar(id);
                btn.classList.toggle('on', now);
                btn.title = now ? 'In My Plan — tap to remove' : 'Add to My Plan';
                const ev = btn.closest('.sched-event');
                if (ev) ev.dataset.starred = now ? '1' : '0';
                const countEl = document.getElementById('sched-plan-count');
                const n = this._getMyPlan().size;
                if (countEl) countEl.textContent = n ? `(${n})` : '';
                this.updateHappeningNow(); // keep the overview "next pick" fresh
                const toggle = document.getElementById('sched-myplan-only');
                if (toggle && toggle.checked) this._applyScheduleFilter(true);
            });
        });

        const toggle = document.getElementById('sched-myplan-only');
        if (toggle) toggle.addEventListener('change', () => this._applyScheduleFilter(toggle.checked));
    },

    _applyScheduleFilter(planOnly) {
        const container = document.getElementById('schedule-content');
        if (!container) return;
        container.querySelectorAll('.sched-event').forEach((ev) => {
            ev.style.display = (planOnly && ev.dataset.starred !== '1') ? 'none' : '';
        });
        container.querySelectorAll('.sched-day').forEach((day) => {
            const anyVisible = [...day.querySelectorAll('.sched-event')].some(ev => ev.style.display !== 'none');
            day.classList.toggle('sched-hidden', planOnly && !anyVisible);
        });
        let empty = container.querySelector('.sched-plan-empty');
        const nothing = planOnly && container.querySelectorAll('.sched-event[data-starred="1"]').length === 0;
        if (nothing && !empty) {
            empty = document.createElement('div');
            empty.className = 'sched-empty sched-plan-empty';
            empty.innerHTML = '<i class="fas fa-star"></i><div>Your plan is empty. Tap the star on a session to add it.</div>';
            container.appendChild(empty);
        } else if (!nothing && empty) {
            empty.remove();
        }
    },

    /**
     * Resources hub: getting there, what to pack (revives the packing
     * checklist, whose container now lives here), and help links.
     */
    renderResourcesView() {
        const container = document.getElementById('resources-content');
        if (!container) return;
        const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=The%20Hayes%20Conference%20Centre%20Swanwick%20DE55%201AU';
        const link = (href, icon, color, text) =>
            `<a href="${href}" target="_blank" rel="noopener" style="display:flex; align-items:center; gap:0.6rem; font-size:0.88rem; color:var(--text-secondary); text-decoration:none; padding:0.55rem 0.65rem; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);"><i class="fas ${icon}" style="color:${color}; width:1.1rem; text-align:center;"></i> ${text}</a>`;

        container.innerHTML = `
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.25rem; align-items:start;">
                <div class="data-table">
                    <div class="table-header"><h3 class="table-title"><i class="fas fa-map-location-dot"></i> Getting there</h3></div>
                    <div class="table-content" style="padding:1.25rem; display:grid; gap:1rem;">
                        <div>
                            <div style="font-weight:600; color:#fff; margin-bottom:0.25rem;"><i class="fas fa-location-dot" style="color:#fb7185;"></i> Venue</div>
                            <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">The Hayes Conference Centre<br>Swanwick, Alfreton<br>Derbyshire DE55 1AU</div>
                            <a href="${mapsUrl}" target="_blank" rel="noopener" class="btn btn-sm btn-ghost" style="margin-top:0.6rem;"><i class="fas fa-diamond-turn-right"></i> Open in Maps</a>
                        </div>
                        <div>
                            <div style="font-weight:600; color:#fff; margin-bottom:0.25rem;"><i class="fas fa-car" style="color:#93c5fd;"></i> By car</div>
                            <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">From M1 Junction 28, take the A38 towards Derby. After ~2 miles turn right onto the B6016 (Sleet Moor Lane) — The Hayes is signposted. Free on-site parking.</div>
                        </div>
                        <div>
                            <div style="font-weight:600; color:#fff; margin-bottom:0.25rem;"><i class="fas fa-train" style="color:#fbbf24;"></i> By train</div>
                            <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">Nearest station: Alfreton (2 miles), taxis available. East Midlands Parkway is ~20 mins by taxi.</div>
                        </div>
                    </div>
                </div>

                <div class="data-table">
                    <div class="table-header">
                        <h3 class="table-title"><i class="fas fa-suitcase-rolling"></i> What to pack</h3>
                        <span class="badge badge-secondary" id="packing-progress">0/0 packed</span>
                    </div>
                    <div class="table-content" style="padding:1.25rem;">
                        <div id="packing-list"></div>
                    </div>
                </div>

                <div class="data-table">
                    <div class="table-header"><h3 class="table-title"><i class="fas fa-circle-question"></i> Help &amp; info</h3></div>
                    <div class="table-content" style="padding:1.25rem; display:grid; gap:0.55rem;">
                        ${link('/faq.html', 'fa-circle-info', '#93c5fd', 'Frequently asked questions')}
                        ${link('/allergy.html', 'fa-notes-medical', '#6ee7b7', 'Dietary &amp; allergy form')}
                        ${link(mapsUrl, 'fa-diamond-turn-right', '#a78bfa', 'Directions to the venue')}
                        ${link('/privacy.html', 'fa-shield-halved', '#93c5fd', 'Privacy notice')}
                        <div style="font-size:0.8rem; color:var(--text-tertiary); line-height:1.5; margin-top:0.35rem;">Questions during the retreat? Speak to any team member or your group lead.</div>
                    </div>
                </div>
            </div>`;

        // The packing checklist container only exists here — populate it now.
        this.updatePackingChecklist();
    },

    // ---- Community wall ----
    COMMUNITY_TYPES: {
        note:   { label: 'Note',   icon: 'fa-comment',           color: '#93c5fd' },
        prayer: { label: 'Prayer', icon: 'fa-hands-praying',     color: '#a78bfa' },
        praise: { label: 'Praise', icon: 'fa-hand-holding-heart', color: '#6ee7b7' },
    },

    _relativeTime(iso) {
        const t = Date.parse(iso);
        if (isNaN(t)) return '';
        const diff = Math.floor((Date.now() - t) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    },

    async loadCommunity() {
        const composer = document.getElementById('community-composer');
        if (composer && !composer._built) {
            composer._built = true;
            this._ensureCommunityStyles();
            this._selectedCommunityType = 'note';
            composer.innerHTML = `
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:1rem 1.1rem;">
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.6rem;">
                        ${Object.entries(this.COMMUNITY_TYPES).map(([k, v], i) => `
                            <button type="button" class="community-type-btn${i === 0 ? ' active' : ''}" data-type="${k}" style="--c:${v.color};"><i class="fas ${v.icon}"></i> ${v.label}</button>
                        `).join('')}
                    </div>
                    <textarea id="community-input" maxlength="500" rows="3" placeholder="Share a prayer request, a praise report, or a word of encouragement…" style="width:100%; padding:0.7rem 0.85rem; background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1); border-radius:10px; font-size:0.9rem; font-family:inherit; resize:vertical;"></textarea>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.6rem; gap:0.5rem; flex-wrap:wrap;">
                        <span style="font-size:0.72rem; color:var(--text-tertiary);"><i class="fas fa-users"></i> Visible to everyone at the retreat</span>
                        <button class="btn btn-sm btn-primary" id="community-post-btn"><i class="fas fa-paper-plane"></i> Post</button>
                    </div>
                </div>`;
            composer.querySelectorAll('.community-type-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this._selectedCommunityType = btn.dataset.type;
                    composer.querySelectorAll('.community-type-btn').forEach(b => b.classList.toggle('active', b === btn));
                });
            });
            document.getElementById('community-post-btn').addEventListener('click', () => this.submitCommunityPost());
        }
        await this.refreshCommunity();
    },

    async refreshCommunity() {
        const list = document.getElementById('community-content');
        if (!list) return;
        try {
            const res = await API.get('/community');
            this._renderCommunityList(res.posts || []);
        } catch (err) {
            list.innerHTML = `<div style="color:var(--text-tertiary); padding:1rem;">Couldn't load the wall: ${this._escape(err.message || '')}</div>`;
        }
    },

    _renderCommunityList(posts) {
        const list = document.getElementById('community-content');
        if (!list) return;
        if (!posts.length) {
            list.innerHTML = `<div style="text-align:center; color:var(--text-tertiary); padding:2rem 1rem;"><i class="fas fa-comments" style="font-size:1.6rem; display:block; margin-bottom:0.6rem; opacity:0.6;"></i>Be the first to share something.</div>`;
            return;
        }
        list.innerHTML = posts.map(p => {
            const t = this.COMMUNITY_TYPES[p.post_type] || this.COMMUNITY_TYPES.note;
            const del = p.is_mine ? `<button class="community-del" data-del="${p.id}" title="Delete"><i class="fas fa-trash"></i></button>` : '';
            return `
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-left:3px solid ${t.color}; border-radius:12px; padding:0.85rem 1rem; margin-bottom:0.7rem;">
                    <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.35rem; flex-wrap:wrap;">
                        <span style="font-size:0.68rem; font-weight:700; color:${t.color}; text-transform:uppercase; letter-spacing:0.04em;"><i class="fas ${t.icon}"></i> ${t.label}</span>
                        <span style="font-size:0.82rem; color:#fff; font-weight:600;">${this._escape(p.author_name)}</span>
                        <span style="font-size:0.72rem; color:var(--text-tertiary); margin-left:auto;">${this._relativeTime(p.created_at)}</span>
                        ${del}
                    </div>
                    <div style="font-size:0.88rem; color:var(--text-secondary); line-height:1.55; white-space:pre-wrap;">${this._escape(p.content)}</div>
                </div>`;
        }).join('');
        list.querySelectorAll('.community-del').forEach(btn => {
            btn.addEventListener('click', () => this.deleteCommunityPost(btn.dataset.del));
        });
    },

    async submitCommunityPost() {
        const input = document.getElementById('community-input');
        const btn = document.getElementById('community-post-btn');
        if (!input) return;
        const content = input.value.trim();
        if (!content) { Utils.showAlert('Write something first.', 'error'); return; }
        btn.disabled = true;
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        try {
            await API.post('/community', { content, post_type: this._selectedCommunityType || 'note' });
            input.value = '';
            await this.refreshCommunity();
        } catch (err) {
            Utils.showAlert(err.message || 'Failed to post', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = orig;
        }
    },

    async deleteCommunityPost(id) {
        if (!confirm('Delete this post?')) return;
        try {
            await API.delete(`/community/${id}`);
            await this.refreshCommunity();
        } catch (err) {
            Utils.showAlert(err.message || 'Failed to delete', 'error');
        }
    },

    _ensureCommunityStyles() {
        if (document.getElementById('community-styles')) return;
        const s = document.createElement('style');
        s.id = 'community-styles';
        s.textContent = `
            .community-type-btn { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:var(--text-secondary); border-radius:999px; padding:0.3rem 0.75rem; font-size:0.78rem; cursor:pointer; display:inline-flex; align-items:center; gap:0.35rem; transition:background 0.15s, border-color 0.15s, color 0.15s; }
            .community-type-btn.active { background:color-mix(in srgb, var(--c) 22%, transparent); border-color:var(--c); color:#fff; }
            .community-type-btn i { color:var(--c); }
            .community-del { background:none; border:none; color:var(--text-tertiary); cursor:pointer; padding:0.15rem 0.35rem; border-radius:6px; }
            .community-del:hover { color:#fca5a5; background:rgba(239,68,68,0.1); }
        `;
        document.head.appendChild(s);
    },

    async loadFamilyView() {
        const container = document.getElementById('family-content');
        const leadBadge = document.getElementById('family-lead-badge');
        if (!container) return;
        try {
            const res = await API.get('/family/members');
            if (!res || !res.group) {
                container.innerHTML = '<div style="padding: 1.5rem; color: var(--text-tertiary);">You are not in a family group.</div>';
                if (leadBadge) leadBadge.style.display = 'none';
                return;
            }
            if (leadBadge) leadBadge.style.display = res.is_lead ? '' : 'none';
            this.renderFamilyMembers(res);
        } catch (err) {
            container.innerHTML = `<div style="padding: 1.5rem; color: var(--text-tertiary);">Failed to load family: ${this._escape(err.message || '')}</div>`;
        }
    },

    renderFamilyMembers(res) {
        const container = document.getElementById('family-content');
        if (!container) return;
        const fmtMoney = (p) => `£${Number(p || 0).toFixed(2)}`;

        // Render members as a responsive card grid. Each card stays compact
        // so contact info doesn't stretch across the full width on ultra-
        // wide screens — `auto-fill` plus a minmax floor at 320px gives
        // 1 column on mobile, 2 columns above ~720px, 3 above ~1080px.
        container.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 0.85rem; padding: 1rem 1.25rem;">${
            res.members.map((m) => {
                const leadTag = m.is_group_lead ? '<span class="badge badge-success" style="margin-left:0.4rem;"><i class="fas fa-crown"></i> Lead</span>' : '';
                const selfTag = m.is_self ? '<span class="badge badge-secondary" style="margin-left:0.4rem;">You</span>' : '';
                const dueLine = m.payment_due > 0
                    ? `<span class="badge badge-warning">${fmtMoney(m.payment_due)} due</span>`
                    : `<span class="badge badge-success">Paid</span>`;
                const editBtn = m.editable && !m.is_self
                    ? `<button class="btn btn-sm btn-ghost edit-family-btn" data-id="${m.id}"><i class="fas fa-pen"></i> Edit</button>`
                    : m.is_self
                    ? `<button class="btn btn-sm btn-ghost" data-go-view="my-details"><i class="fas fa-pen"></i> Edit</button>`
                    : '';
                return `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                            <div style="min-width: 0;">
                                <div style="font-weight: 700; color: #fff; line-height: 1.3;">${this._escape(m.name)}</div>
                                <div style="font-size: 0.72rem; color: var(--text-tertiary); margin-top: 0.15rem;">${this._escape(m.ref_number)}</div>
                                <div style="margin-top: 0.35rem; display: flex; gap: 0.3rem; flex-wrap: wrap;">${leadTag}${selfTag}</div>
                            </div>
                            <div>${dueLine}</div>
                        </div>
                        <div style="font-size: 0.78rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.3rem;">
                            ${m.email ? `<div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"><i class="fas fa-envelope" style="width:1rem; color: var(--text-tertiary);"></i> ${this._escape(m.email)}</div>` : ''}
                            ${m.phone ? `<div><i class="fas fa-phone" style="width:1rem; color: var(--text-tertiary);"></i> ${this._escape(m.phone)}</div>` : ''}
                            ${m.emergency_contact ? `<div><i class="fas fa-life-ring" style="width:1rem; color: var(--text-tertiary);"></i> ${this._escape(m.emergency_contact)}</div>` : ''}
                            ${m.dietary_requirements ? `<div><i class="fas fa-utensils" style="width:1rem; color: var(--text-tertiary);"></i> ${this._escape(m.dietary_requirements)}</div>` : ''}
                        </div>
                        ${editBtn ? `<div style="margin-top: 0.25rem;">${editBtn}</div>` : ''}
                    </div>
                `;
            }).join('')
        }</div>`;

        container.querySelectorAll('.edit-family-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.openFamilyEditModal(parseInt(btn.dataset.id, 10), res.members));
        });
        container.querySelectorAll('[data-go-view]').forEach((btn) => {
            btn.addEventListener('click', () => this.showView(btn.dataset.goView));
        });
    },

    openFamilyEditModal(memberId, allMembers) {
        const m = allMembers.find((x) => x.id === memberId);
        if (!m) return;
        const fields = [
            'first_name', 'last_name', 'preferred_name', 'date_of_birth',
            'email', 'phone', 'emergency_contact', 'postal_address',
            'dietary_requirements', 'medical_conditions', 'accessibility_needs',
            'tshirt_size', 'arrival_method', 'vehicle_registration', 'special_requests',
        ];
        const html = `
            <div class="modal-overlay" id="family-edit-modal" style="z-index:500;">
                <div class="modal" style="max-width:720px;">
                    <div class="modal-header">
                        <h3 class="modal-title">Edit ${this._escape(m.name)}</h3>
                        <button type="button" class="modal-close" id="family-edit-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body" style="padding: 1.5rem; max-height: 75vh; overflow-y: auto;">
                        <div style="display: grid; gap: 1.25rem;">
                            ${this._detailSection('Personal', `
                                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                                    ${this._editField('first_name', 'First name', m.first_name || m.name)}
                                    ${this._editField('last_name', 'Last name', m.last_name)}
                                    ${this._editField('preferred_name', 'Preferred name', m.preferred_name)}
                                    ${this._editField('date_of_birth', 'Date of birth', m.date_of_birth, 'date')}
                                </div>
                            `)}
                            ${this._detailSection('Contact', `
                                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                                    ${this._editField('email', 'Email', m.email, 'email')}
                                    ${this._editField('phone', 'Phone', m.phone)}
                                    ${this._editField('emergency_contact', 'Emergency contact', m.emergency_contact)}
                                </div>
                                ${this._editTextarea('postal_address', 'Postal address', m.postal_address)}
                            `)}
                            ${this._detailSection('Health &amp; Accessibility', `
                                ${this._editTextarea('dietary_requirements', 'Dietary requirements / allergies', m.dietary_requirements)}
                                ${this._editTextarea('medical_conditions', 'Medical conditions / medications', m.medical_conditions, 'Used by first-aid team only.')}
                                ${this._editTextarea('accessibility_needs', 'Accessibility / mobility needs', m.accessibility_needs)}
                            `)}
                            ${this._detailSection('Logistics', `
                                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                                    ${this._editSelect('tshirt_size', 'T-shirt size', m.tshirt_size, [
                                        { value: '', label: '— Not specified —' },
                                        { value: 'XS', label: 'XS' }, { value: 'S', label: 'S' },
                                        { value: 'M', label: 'M' }, { value: 'L', label: 'L' },
                                        { value: 'XL', label: 'XL' }, { value: 'XXL', label: 'XXL' },
                                        { value: '3XL', label: '3XL' },
                                        { value: 'child_s', label: 'Child S' },
                                        { value: 'child_m', label: 'Child M' },
                                        { value: 'child_l', label: 'Child L' },
                                    ])}
                                    ${this._editSelect('arrival_method', 'Travel method', m.arrival_method, this.TRAVEL_METHODS)}
                                    ${this._editField('vehicle_registration', 'Vehicle registration', m.vehicle_registration)}
                                </div>
                                ${this._editTextarea('special_requests', 'Special requests', m.special_requests)}
                            `)}
                        </div>
                        <div style="display:flex; gap:0.5rem; margin-top:1.5rem;">
                            <button class="btn btn-ghost" id="family-edit-cancel" style="flex:1;">Cancel</button>
                            <button class="btn btn-success" id="family-edit-save" style="flex:1;"><i class="fas fa-check"></i> Save</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        const modal = document.getElementById('family-edit-modal');
        const close = () => modal.remove();
        document.getElementById('family-edit-close').addEventListener('click', close);
        document.getElementById('family-edit-cancel').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
        document.getElementById('family-edit-save').addEventListener('click', async () => {
            const body = this._collectEditFields(modal, fields);
            const btn = document.getElementById('family-edit-save');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';
            try {
                await API.put(`/family/members/${memberId}`, body);
                Utils.showAlert('Updated.', 'success');
                close();
                await this.loadFamilyView();
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check"></i> Save';
                Utils.showAlert(err.message || 'Failed to save', 'error');
            }
        });
    },

    /**
     * Render the My Details editable form. Uses /me data already in
     * memory — no separate fetch.
     */
    renderMyDetailsView() {
        const container = document.getElementById('my-details-content');
        if (!container || !this.data) return;
        const d = this.data;
        // Transport fields (arrival_method, vehicle_registration) and
        // emergency_contact now live in the dedicated Transport view, so they're
        // intentionally not collected here.
        const allFields = [
            'first_name', 'last_name', 'preferred_name', 'date_of_birth',
            'email', 'phone', 'postal_address',
            'dietary_requirements', 'medical_conditions', 'accessibility_needs',
            'tshirt_size', 'special_requests',
        ];
        // Sectioned layout for scannability. Short text fields go in a
        // 2-up responsive grid per section; multi-line fields are full
        // width inside their section.
        container.innerHTML = `
            <form id="my-details-form" style="display: grid; gap: 1.5rem;">
                ${this._detailSection('Personal', `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
                        ${this._editField('first_name', 'First name', d.first_name)}
                        ${this._editField('last_name', 'Last name', d.last_name)}
                        ${this._editField('preferred_name', 'Preferred name', d.preferred_name)}
                        ${this._editField('date_of_birth', 'Date of birth', d.date_of_birth, 'date')}
                    </div>
                `)}
                ${this._detailSection('Contact', `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
                        ${this._editField('email', 'Email', d.email, 'email')}
                        ${this._editField('phone', 'Phone', d.phone)}
                    </div>
                    ${this._editTextarea('postal_address', 'Postal address', d.postal_address)}
                    <div style="font-size:0.75rem; color: var(--text-tertiary);"><i class="fas fa-circle-info"></i> Travel details and your emergency contact are on the <a href="#" data-go-view="transport" style="color:#a78bfa;">Transport</a> tab.</div>
                `)}
                ${this._detailSection('Health &amp; Accessibility', `
                    ${this._editTextarea('dietary_requirements', 'Dietary requirements / allergies', d.dietary_requirements)}
                    ${this._editTextarea('medical_conditions', 'Medical conditions / medications', d.medical_conditions, 'Used by first-aid team only.')}
                    ${this._editTextarea('accessibility_needs', 'Accessibility / mobility needs', d.accessibility_needs)}
                `)}
                ${this._detailSection('Preferences', `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
                        ${this._editSelect('tshirt_size', 'T-shirt size', d.tshirt_size, [
                            { value: '', label: '— Not specified —' },
                            { value: 'XS', label: 'XS' },
                            { value: 'S', label: 'S' },
                            { value: 'M', label: 'M' },
                            { value: 'L', label: 'L' },
                            { value: 'XL', label: 'XL' },
                            { value: 'XXL', label: 'XXL' },
                            { value: '3XL', label: '3XL' },
                            { value: 'child_s', label: "Child S" },
                            { value: 'child_m', label: "Child M" },
                            { value: 'child_l', label: "Child L" },
                        ])}
                    </div>
                    ${this._editTextarea('special_requests', 'Special requests', d.special_requests)}
                `)}
                <div style="display: flex; gap: 0.5rem;">
                    <button type="submit" class="btn btn-success"><i class="fas fa-check"></i> Save changes</button>
                </div>
            </form>
            ${this._detailSection('Your data &amp; privacy', `
                <div style="font-size:0.82rem; color: var(--text-secondary); line-height:1.6;">
                    You can download a copy of everything the portal holds about you, and read how we look after it.
                </div>
                <div style="display:flex; gap:0.6rem; flex-wrap:wrap; margin-top:0.6rem;">
                    <button type="button" class="btn btn-sm btn-ghost" id="download-my-data"><i class="fas fa-download"></i> Download my data</button>
                    <a href="/privacy.html" target="_blank" rel="noopener" class="btn btn-sm btn-ghost"><i class="fas fa-shield-halved"></i> Privacy notice</a>
                </div>
            `)}
        `;
        const dl = document.getElementById('download-my-data');
        if (dl) dl.addEventListener('click', () => this.downloadMyData(dl));
        const form = document.getElementById('my-details-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const body = this._collectEditFields(form, allFields);
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';
            try {
                await API.put('/attendee/profile', body);
                this.data = await API.get('/me');
                this.updateDisplay();
                this.renderMyDetailsView();
                Utils.showAlert('Profile updated.', 'success');
            } catch (err) {
                Utils.showAlert(err.message || 'Failed to save', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Save changes';
            }
        });
    },

    // ---- Push notifications ----
    async initNotifications() {
        const btn = document.getElementById('notif-toggle');
        if (!btn) return;
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        if (!supported) return; // stays hidden

        let cfg;
        try { cfg = await API.get('/push/config'); } catch { return; }
        if (!cfg || !cfg.enabled || !cfg.vapid_public_key) return; // not configured server-side
        this._vapidKey = cfg.vapid_public_key;

        btn.style.display = '';
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            this._setNotifBtn(btn, !!sub);
        } catch { this._setNotifBtn(btn, false); }

        if (!btn._bound) {
            btn._bound = true;
            btn.addEventListener('click', () => this.toggleNotifications(btn));
        }
    },

    _setNotifBtn(btn, on) {
        btn.innerHTML = on ? '<i class="fas fa-bell"></i>' : '<i class="fas fa-bell-slash"></i>';
        btn.title = on ? 'Notifications on — tap to turn off' : 'Turn on notifications';
        btn.classList.toggle('btn-primary', on);
        btn.classList.toggle('btn-ghost', !on);
    },

    async toggleNotifications(btn) {
        try {
            const reg = await navigator.serviceWorker.ready;
            const existing = await reg.pushManager.getSubscription();
            if (existing) {
                const endpoint = existing.endpoint;
                await existing.unsubscribe();
                try { await API.request('/push/subscribe', { method: 'DELETE', body: JSON.stringify({ endpoint }) }); } catch {}
                this._setNotifBtn(btn, false);
                Utils.showAlert('Notifications turned off.', 'success');
                return;
            }
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') { Utils.showAlert('Notifications permission was not granted.', 'error'); return; }
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this._urlB64ToUint8Array(this._vapidKey),
            });
            const json = sub.toJSON();
            await API.post('/push/subscribe', { endpoint: json.endpoint, keys: json.keys });
            this._setNotifBtn(btn, true);
            Utils.showAlert("Notifications on — we'll alert you about new announcements.", 'success');
        } catch (err) {
            Utils.showAlert(err.message || 'Could not update notifications', 'error');
        }
    },

    _urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const raw = atob(base64);
        const out = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
        return out;
    },

    /** Fetch the attendee's full data export and save it as a JSON file. */
    async downloadMyData(btn) {
        const orig = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing…'; }
        try {
            const data = await API.get('/attendee/export');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `retreat-data-${this.data?.ref_number || 'me'}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            Utils.showAlert(err.message || 'Could not prepare your data', 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = orig; }
        }
    },

    _detailSection(title, innerHtml) {
        return `
            <fieldset style="border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem 1.5rem; margin: 0;">
                <legend style="padding: 0 0.5rem; font-size: 0.78rem; font-weight: 700; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.06em;">${title}</legend>
                <div style="display: grid; gap: 1rem;">${innerHtml}</div>
            </fieldset>
        `;
    },

    _editSelect(name, label, value, options) {
        const v = value == null ? '' : value;
        // Options need an explicit dark background + light text, otherwise the
        // native dropdown popup renders the white select text on the OS default
        // white background — invisible. `color-scheme: dark` also nudges
        // browsers to draw the popup chrome dark.
        const opts = options.map(o =>
            `<option value="${this._escape(o.value)}"${o.value === v ? ' selected' : ''} style="background:#1f2440; color:#fff;">${this._escape(o.label)}</option>`,
        ).join('');
        return `
            <label style="display:block;">
                <span style="display:block; font-size:0.75rem; font-weight:600; color: var(--text-secondary); margin-bottom:0.3rem;">${label}</span>
                <select name="${name}" style="width:100%; padding:0.6rem 0.75rem; background: rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1); border-radius:8px; font-size:0.9rem; color-scheme: dark;">${opts}</select>
            </label>
        `;
    },

    _editField(name, label, value, type = 'text') {
        const v = value == null ? '' : value;
        return `
            <label style="display:block;">
                <span style="display:block; font-size:0.75rem; font-weight:600; color: var(--text-secondary); margin-bottom:0.3rem;">${label}</span>
                <input name="${name}" type="${type}" value="${this._escape(v)}" style="width:100%; padding:0.6rem 0.75rem; background: rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1); border-radius:8px; font-size:0.9rem;">
            </label>
        `;
    },

    _editTextarea(name, label, value, hint) {
        const v = value == null ? '' : value;
        const hintLine = hint ? `<span style="display:block; font-size:0.7rem; color: var(--text-tertiary); margin-top:0.25rem;">${this._escape(hint)}</span>` : '';
        return `
            <label style="display:block;">
                <span style="display:block; font-size:0.75rem; font-weight:600; color: var(--text-secondary); margin-bottom:0.3rem;">${label}</span>
                <textarea name="${name}" rows="3" style="width:100%; padding:0.6rem 0.75rem; background: rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1); border-radius:8px; font-size:0.9rem; font-family: inherit; resize: vertical;">${this._escape(v)}</textarea>
                ${hintLine}
            </label>
        `;
    },

    _collectEditFields(scope, fields) {
        const body = {};
        for (const f of fields) {
            const el = scope.querySelector(`[name="${f}"]`);
            if (el) body[f] = el.value;
        }
        return body;
    },

    // Travel-method options offered on the Transport view. Kept in one place so
    // the option list and the human-readable labels (used by the overview note)
    // never drift apart. arrival_method is a free-text column, so these values
    // need no backend/migration change.
    TRAVEL_METHODS: [
        { value: '', label: '— Please choose —' },
        { value: 'car', label: 'Driving myself' },
        { value: 'church_bus', label: 'Joining the church bus' },
        { value: 'lift_needed', label: 'Getting a lift with someone' },
        { value: 'train', label: 'By train' },
        { value: 'other', label: 'Other means' },
    ],

    _travelMethodLabel(value) {
        const m = this.TRAVEL_METHODS.find(o => o.value === value);
        return m && m.value ? m.label : null;
    },

    /**
     * Transport / Logistics view: how the attendee is travelling, vehicle
     * registration (for parking), and their emergency contact. Reuses the
     * /attendee/profile endpoint — no separate storage.
     */
    renderTransportView() {
        const container = document.getElementById('transport-content');
        if (!container || !this.data) return;
        const d = this.data;
        const isDriving = d.arrival_method === 'car';

        container.innerHTML = `
            <form id="transport-form" style="display: grid; gap: 1.5rem;">
                <div style="font-size:0.85rem; color: var(--text-secondary); line-height:1.6;">
                    Let us know how you're getting to <strong>The Hayes, Swanwick</strong> so we can plan parking and the church bus — and hold an emergency contact for the weekend.
                </div>

                ${this._detailSection('How are you travelling?', `
                    ${this._editSelect('arrival_method', 'Travel method', d.arrival_method, this.TRAVEL_METHODS)}
                    <div id="vehicle-reg-wrap" style="${isDriving ? '' : 'opacity:0.65;'} transition: opacity 0.2s;">
                        ${this._editField('vehicle_registration', 'Vehicle registration', d.vehicle_registration)}
                        <span style="display:block; font-size:0.7rem; color: var(--text-tertiary); margin-top:0.25rem;"><i class="fas fa-square-parking"></i> Needed to arrange on-site parking if you're driving.</span>
                    </div>
                `)}

                ${this._detailSection('Emergency contact', `
                    <div style="font-size:0.75rem; color: var(--text-tertiary); margin-bottom:0.1rem;">Who should we call if there's an emergency during the retreat?</div>
                    ${this._editField('emergency_contact', 'Name & phone number', d.emergency_contact)}
                `)}

                <div style="display:flex; gap:0.5rem;">
                    <button type="submit" class="btn btn-success"><i class="fas fa-check"></i> Save transport details</button>
                </div>
            </form>
        `;

        const form = document.getElementById('transport-form');
        // De-emphasise vehicle reg unless they're driving.
        const sel = form.querySelector('[name="arrival_method"]');
        const wrap = document.getElementById('vehicle-reg-wrap');
        if (sel && wrap) {
            sel.addEventListener('change', () => {
                wrap.style.opacity = sel.value === 'car' ? '1' : '0.65';
            });
        }
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const body = this._collectEditFields(form, ['arrival_method', 'vehicle_registration', 'emergency_contact']);
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';
            try {
                await API.put('/attendee/profile', body);
                this.data = await API.get('/me');
                this.updateDisplay();
                this.renderTransportView();
                Utils.showAlert('Transport details saved.', 'success');
            } catch (err) {
                Utils.showAlert(err.message || 'Failed to save', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Save transport details';
            }
        });
    },

    /**
     * Overview nudge: prompt drivers without a vehicle reg (or anyone who
     * hasn't told us how they're travelling) to complete their Transport tab.
     */
    updateTransportNote() {
        const section = document.getElementById('transport-note-section');
        if (!section || !this.data) return;
        const method = this.data.arrival_method;
        const reg = (this.data.vehicle_registration || '').trim();

        let note = null;
        if (method === 'car' && !reg) {
            note = {
                icon: 'fa-car-side', color: '#fbbf24',
                title: "You're driving to the retreat",
                body: 'Please add your vehicle registration so we can arrange parking for you.',
                cta: 'Add vehicle registration',
            };
        } else if (!method) {
            note = {
                icon: 'fa-route', color: '#a78bfa',
                title: 'How are you getting to the retreat?',
                body: 'Tell us your travel method — driving, the church bus, or another way — so we can help with parking and transport.',
                cta: 'Set travel details',
            };
        }

        if (!note) { section.style.display = 'none'; section.innerHTML = ''; return; }

        section.style.display = 'block';
        section.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(251,191,36,0.10), rgba(139,92,246,0.06)); border:1px solid rgba(255,255,255,0.08); border-left:4px solid ${note.color}; border-radius:16px; padding:1.1rem 1.4rem; display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">
                <div style="font-size:1.4rem; color:${note.color};"><i class="fas ${note.icon}"></i></div>
                <div style="flex:1; min-width:200px;">
                    <div style="font-weight:600; color:#fff; margin-bottom:0.15rem;">${note.title}</div>
                    <div style="font-size:0.82rem; color:var(--text-secondary); line-height:1.5;">${note.body}</div>
                </div>
                <button class="btn btn-sm btn-primary" data-go-view="transport"><i class="fas fa-arrow-right"></i> ${note.cta}</button>
            </div>
        `;
    },

    /**
     * Update announcements display (new method)
     */
    updateAnnouncementsDisplay() {
        const content = document.getElementById('announcements-content');
        const countBadge = document.getElementById('announcements-count');
        if (!content) return;

        const announcements = this.data.announcements || [];
        
        // Update count badge
        if (countBadge) {
            if (announcements.length > 0) {
                countBadge.textContent = `${announcements.length} update${announcements.length !== 1 ? 's' : ''}`;
                countBadge.style.display = 'inline-flex';
                
                // Color badge based on priority
                const hasUrgent = announcements.some(a => a.priority >= 5);
                const hasHigh = announcements.some(a => a.priority >= 4);
                
                if (hasUrgent) {
                    countBadge.className = 'badge badge-warning';
                } else if (hasHigh) {
                    countBadge.className = 'badge badge-primary';
                } else {
                    countBadge.className = 'badge badge-secondary';
                }
            } else {
                countBadge.style.display = 'none';
            }
        }
        
        if (announcements.length === 0) {
            content.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p style="margin-bottom: 0.5rem; font-size: 1.1rem;">No current announcements</p>
                    <small>Check back later for updates from the retreat organizers</small>
                </div>
            `;
            return;
        }

        // Sort announcements by priority and date
        const sortedAnnouncements = [...announcements].sort((a, b) => {
            if (a.priority !== b.priority) {
                return b.priority - a.priority; // Higher priority first
            }
            return new Date(b.created_at) - new Date(a.created_at); // Newer first
        });

        content.innerHTML = `
            <div class="announcements-list">
                ${sortedAnnouncements.map(announcement => this.renderAnnouncementCard(announcement)).join('')}
            </div>
        `;
    },

    /**
     * Render individual announcement card
     */
    renderAnnouncementCard(announcement) {
        const typeBadge = this.getAnnouncementTypeBadge(announcement.type);
        const priorityClass = this.getAnnouncementPriorityClass(announcement.priority);
        const timeAgo = this.getTimeAgo(announcement.created_at);
        const isNew = announcement.is_new;
        const isUrgent = announcement.priority >= 5;
        const isHigh = announcement.priority >= 4;
        
        return `
            <div class="announcement-card ${priorityClass}" ${isNew ? 'data-new="true"' : ''}>
                <div class="announcement-header">
                    <div class="announcement-title-row">
                        <h4 class="announcement-title">
                            ${isNew ? '<span class="new-badge">NEW</span>' : ''}
                            ${isUrgent ? '<i class="fas fa-exclamation-triangle" style="color: var(--error); margin-right: 0.5rem;"></i>' : ''}
                            ${Utils.escapeHtml(announcement.title)}
                        </h4>
                        <div class="announcement-badges">
                            <span class="badge ${typeBadge.class}">
                                <i class="${typeBadge.icon}"></i> ${typeBadge.text}
                            </span>
                            ${isUrgent ? '<span class="badge badge-warning"><i class="fas fa-bolt"></i> URGENT</span>' : ''}
                            ${isHigh && !isUrgent ? '<span class="badge badge-primary">HIGH PRIORITY</span>' : ''}
                        </div>
                    </div>
                    <div class="announcement-meta">
                        <small>
                            <i class="fas fa-user"></i> ${Utils.escapeHtml(announcement.author_name)}
                            <span style="margin: 0 0.5rem; opacity: 0.5;">•</span>
                            <i class="fas fa-clock"></i> ${timeAgo}
                        </small>
                    </div>
                </div>
                <div class="announcement-content">
                    ${this.formatAnnouncementContent(announcement.content)}
                </div>
                ${announcement.expires_at ? `
                    <div class="announcement-footer">
                        <small style="color: var(--text-secondary);">
                            <i class="fas fa-calendar-times"></i> 
                            Expires: ${this.formatDate(announcement.expires_at)}
                        </small>
                    </div>
                ` : ''}
                ${this.shouldShowExtraInfo(announcement) ? `
                    <div class="announcement-actions">
                        <small style="color: var(--text-secondary); font-style: italic;">
                            ${this.getAnnouncementExtraInfo(announcement)}
                        </small>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Format announcement content (convert line breaks, basic markdown)
     */
    formatAnnouncementContent(content) {
        return Utils.escapeHtml(content)
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>') // Links
            .replace(/^(.+)$/, '<p>$1</p>'); // Wrap in paragraphs
    },

    /**
     * Get announcement type badge configuration
     */
    getAnnouncementTypeBadge(type) {
        const badges = {
            'general': { text: 'General', class: 'badge-secondary', icon: 'fas fa-info-circle' },
            'urgent': { text: 'Urgent', class: 'badge-warning', icon: 'fas fa-exclamation-triangle' },
            'event': { text: 'Event', class: 'badge-primary', icon: 'fas fa-calendar' },
            'reminder': { text: 'Reminder', class: 'badge-success', icon: 'fas fa-clock' }
        };
        return badges[type] || badges['general'];
    },

    /**
     * Get priority class for announcement card
     */
    getAnnouncementPriorityClass(priority) {
        if (priority >= 5) return 'priority-urgent';
        if (priority >= 4) return 'priority-high';
        if (priority >= 3) return 'priority-normal';
        return 'priority-low';
    },

    /**
     * Calculate time ago string
     */
    getTimeAgo(datetime) {
        const now = new Date();
        const created = new Date(datetime);
        const diffMs = now - created;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    },

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Tomorrow at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays > 1 && diffDays <= 7) {
            return `In ${diffDays} days (${date.toLocaleDateString()})`;
        } else {
            return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
        }
    },

    /**
     * Check if should show extra info for announcement
     */
    shouldShowExtraInfo(announcement) {
        return announcement.type === 'event' || 
               announcement.priority >= 4 || 
               announcement.expires_at;
    },

    /**
     * Get extra info text for announcement
     */
    getAnnouncementExtraInfo(announcement) {
        const infos = [];
        
        if (announcement.type === 'event') {
            infos.push('📅 Event information');
        }
        
        if (announcement.priority >= 5) {
            infos.push('⚡ Requires immediate attention');
        } else if (announcement.priority >= 4) {
            infos.push('⭐ Important information');
        }
        
        return infos.join(' • ');
    },

    /**
     * Bind event listeners (updated with announcements)
     */
    bindEvents() {
        // Logout button
        const logoutBtn = document.getElementById('attendee-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    Auth.logout();
                }
            });
        }

        // Refresh dashboard button
        const refreshDashboardBtn = document.getElementById('refresh-dashboard');
        if (refreshDashboardBtn) {
            refreshDashboardBtn.addEventListener('click', () => {
                this.refresh();
            });
        }

        // Refresh announcements button
        const refreshBtn = document.getElementById('refresh-announcements');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshAnnouncements();
            });
        }

        // Auto-refresh announcements every 5 minutes (only if still on attendee view)
        this._refreshInterval = setInterval(() => {
            if (Auth.isAuthenticated('attendee') && document.getElementById('attendee-name-display')) {
                this.refreshAnnouncementsQuietly();
            }
        }, 5 * 60 * 1000);
    },

    /**
     * Refresh entire dashboard
     */
    async refresh() {
        const refreshBtn = document.getElementById('refresh-dashboard');
        
        try {
            if (refreshBtn) {
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            }

            // Reload data
            await this.loadData();
            
            Utils.showAlert('Dashboard refreshed', 'success');
            
        } catch (error) {
            Utils.showAlert('Failed to refresh dashboard', 'error');
            console.error('Error refreshing dashboard:', error);
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            }
        }
    },

    /**
     * Refresh announcements only (with user feedback)
     */
    async refreshAnnouncements() {
        const refreshBtn = document.getElementById('refresh-announcements');
        const content = document.getElementById('announcements-content');
        
        try {
            if (refreshBtn) {
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
            
            if (content) {
                content.innerHTML = '<div class="loading-placeholder"><i class="fas fa-spinner fa-spin"></i> Refreshing announcements...</div>';
            }

            // Reload data
            await this.loadData();
            
            Utils.showAlert('Announcements refreshed', 'success');
            
        } catch (error) {
            Utils.showAlert('Failed to refresh announcements', 'error');
            console.error('Error refreshing announcements:', error);
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }
        }
    },

    /**
     * Refresh announcements quietly (no user feedback) - for auto-refresh
     */
    async refreshAnnouncementsQuietly() {
        // Skip if no longer authenticated as attendee
        if (!Auth.isAuthenticated('attendee')) return;

        try {
            const oldCount = this.data?.announcements?.length || 0;

            // Direct fetch to avoid triggering global 401 handler
            const response = await fetch('/api/me', {
                headers: { 'Authorization': `Bearer ${Auth.getToken('attendee')}` }
            });
            if (!response.ok) return; // Silently fail

            const newData = await response.json();
            this.data = newData;
            this.updateAnnouncementsDisplay();

            const newCount = this.data?.announcements?.length || 0;
            if (newCount > oldCount) {
                const diff = newCount - oldCount;
                Utils.showAlert(`${diff} new announcement${diff > 1 ? 's' : ''} received`, 'success');
            }
        } catch {
            // Silently fail for background refresh
        }
    },

    /**
     * Update room information section
     */
    updateRoomInfo() {
        const content = document.getElementById('room-info-content');
        if (!content) return;
        
        if (this.data.room) {
            content.innerHTML = `
                <div class="info-item">
                    <div class="info-label">Room Number</div>
                    <div class="info-value">${Utils.escapeHtml(this.data.room.number)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Description</div>
                    <div class="info-value">${Utils.escapeHtml(this.data.room.description || 'No description available')}</div>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="info-item">
                    <div class="info-value" style="color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> No room assigned yet
                    </div>
                    <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                        Room assignments will be available closer to your arrival date
                    </small>
                </div>
            `;
        }
    },

    /**
     * Update payment information section
     */
    updatePaymentInfo() {
        const content = document.getElementById('payment-info-content');
        if (!content) return;

        const paymentDue = this.data.payment_due || 0;
        const paymentOption = this.data.payment_option || 'full';

        // Update the top banner
        const banner = document.getElementById('payment-banner');
        const bannerAmount = document.getElementById('banner-amount');
        const bannerButtons = document.getElementById('banner-pay-buttons');

        if (banner && paymentDue > 0 && paymentOption !== 'sponsorship') {
            banner.style.display = 'block';
            if (bannerAmount) bannerAmount.textContent = Utils.formatCurrency(paymentDue);
            if (bannerButtons) {
                bannerButtons.innerHTML = `
                    <button class="btn btn-success show-payment-options-btn"><i class="fas fa-sterling-sign"></i> Pay Now</button>
                    <button class="btn btn-ghost show-flex-plan-btn"><i class="fas fa-calendar-alt"></i> Set up a payment plan</button>
                `;
                bannerButtons.querySelector('.show-payment-options-btn').addEventListener('click', () => this.showPaymentOptions());
                bannerButtons.querySelector('.show-flex-plan-btn').addEventListener('click', () => this.showFlexiblePlanCalculator());
            }
        } else if (banner) {
            banner.style.display = 'none';
        }

        // Balance + Pay Now lives in the left "Outstanding" card.
        // #flexible-plan-section and #payment-history-section are now
        // owned by the new 2-column layout in the template, not by this
        // method — don't overwrite them on refresh.
        content.innerHTML = `
            <div style="font-size: 2rem; font-weight: 700; color: ${paymentDue > 0 ? '#fbbf24' : '#6ee7b7'}; margin-bottom: 0.4rem;">
                ${Utils.formatCurrency(paymentDue)}
            </div>
            <span class="badge ${paymentDue > 0 ? 'badge-warning' : 'badge-success'}">
                <i class="fas fa-${paymentDue > 0 ? 'clock' : 'check'}"></i>
                ${paymentDue > 0 ? 'Due' : 'Paid'}
            </span>
            ${paymentDue > 0 && paymentOption !== 'sponsorship' ? `
                <div style="margin-top: 1rem;">
                    <button class="btn btn-success show-payment-options-btn" style="width: 100%;">
                        <i class="fas fa-sterling-sign"></i> Pay Now
                    </button>
                </div>
            ` : ''}
            ${paymentOption === 'sponsorship' ? '<div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-tertiary);">Sponsorship requested</div>' : ''}
        `;

        content.querySelectorAll('.show-payment-options-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showPaymentOptions());
        });
        this.loadFlexiblePlan();
        this.loadPaymentHistory();
    },

    /**
     * Load attendee's active flexible plan (if any) and render it.
     * If a plan exists, it replaces the "Set up a payment plan" affordance
     * with a schedule view + per-row pay buttons + cancel button.
     */
    async loadFlexiblePlan() {
        const section = document.getElementById('flexible-plan-section');
        const card = document.getElementById('flexible-plan-card');
        if (!section) return;
        try {
            const res = await API.get('/payments/flexible-plan');
            if (!res || !res.plan) {
                section.innerHTML = '';
                if (card) card.style.display = 'none';
                return;
            }
            this.renderFlexiblePlan(res.plan, res.installments || []);
            // Reveal the wrapper card now that there's content to show.
            // It starts hidden in the template so no empty card appears
            // on attendees who never set up a custom plan.
            if (card) card.style.display = '';

            // If a plan is active, hide the banner's "Set up" CTA since the
            // schedule now lives in the dashboard card. Keep "Pay Now" too
            // so the attendee can still pay everything in one go if they
            // change their mind — they'd need to cancel the plan first.
            const bannerButtons = document.getElementById('banner-pay-buttons');
            if (bannerButtons) {
                const setUpBtn = bannerButtons.querySelector('.show-flex-plan-btn');
                if (setUpBtn) setUpBtn.remove();
            }
        } catch (err) {
            // Not fatal — older deployments without the endpoint will 404 here.
            console.warn('flexible plan load failed', err);
            if (card) card.style.display = 'none';
        }
    },

    renderFlexiblePlan(plan, installments) {
        const section = document.getElementById('flexible-plan-section');
        if (!section) return;

        const fmtDate = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
        const fmtPence = (p) => `£${(p / 100).toFixed(2)}`;

        const paidCount = installments.filter(i => i.status === 'paid').length;
        const rows = installments.map(i => {
            const statusLabel = {
                upcoming: '<span class="badge badge-secondary">Upcoming</span>',
                pending_bank: '<span class="badge badge-warning">Awaiting bank confirmation</span>',
                paid: '<span class="badge badge-success">Paid</span>',
                overdue: '<span class="badge badge-danger">Overdue</span>',
                cancelled: '<span class="badge badge-secondary">Cancelled</span>',
            }[i.status] || '';

            const canPay = i.status === 'upcoming' || i.status === 'overdue';
            const actions = canPay ? `
                <div style="display:flex; gap:0.3rem; margin-top:0.4rem;">
                    <button class="btn btn-sm btn-success flex-pay-card-btn" data-id="${i.id}" style="flex:1;">
                        <i class="fas fa-credit-card"></i> Card
                    </button>
                    <button class="btn btn-sm btn-primary flex-pay-bank-btn" data-id="${i.id}" style="flex:1;">
                        <i class="fas fa-building-columns"></i> Bank
                    </button>
                </div>
            ` : '';

            return `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.7rem 0.85rem; margin-bottom: 0.4rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
                        <div style="font-size:0.78rem; color: var(--text-tertiary);">#${i.installment_number} · ${fmtDate(i.due_date)}</div>
                        <div style="font-weight:700; color:#fff;">${fmtPence(i.amount)}</div>
                    </div>
                    <div style="margin-top:0.25rem; font-size:0.72rem;">${statusLabel}</div>
                    ${actions}
                </div>
            `;
        }).join('');

        section.innerHTML = `
            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 0.75rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <div style="font-size:0.78rem; color:#a78bfa; text-transform:uppercase; letter-spacing:0.05em; font-weight:600;">
                        <i class="fas fa-calendar-alt"></i> Payment plan
                    </div>
                    <span class="badge badge-secondary">${paidCount}/${installments.length} paid</span>
                </div>
                <div style="font-size:0.72rem; color: var(--text-tertiary); margin-bottom:0.6rem;">
                    ${plan.months_count}-month plan · ${plan.reminders_enabled ? `reminders ${plan.reminder_days_before} day(s) before` : 'reminders off'}
                </div>
                ${rows}
                <button class="btn btn-sm btn-ghost flex-cancel-plan-btn" style="width:100%; margin-top:0.5rem;" data-id="${plan.id}">
                    <i class="fas fa-times"></i> Cancel plan
                </button>
            </div>
        `;

        section.querySelectorAll('.flex-pay-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFlexInstallmentCard(parseInt(e.currentTarget.dataset.id, 10), e));
        });
        section.querySelectorAll('.flex-pay-bank-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFlexInstallmentBank(parseInt(e.currentTarget.dataset.id, 10), e));
        });
        section.querySelector('.flex-cancel-plan-btn').addEventListener('click', () => this.handleFlexCancelPlan());
    },

    /**
     * Calculator: attendee picks N months + reminder options, sees a
     * preview of the monthly amount, then confirms to create the plan.
     */
    showFlexiblePlanCalculator() {
        const paymentDue = this.data.payment_due || 0;
        if (paymentDue <= 0) {
            Utils.showAlert('No outstanding balance to schedule.', 'info');
            return;
        }
        const totalPence = Math.round(paymentDue * 100);

        const modalHtml = `
            <div class="modal-overlay" id="flex-plan-modal" style="z-index: 500;">
                <div class="modal" style="max-width: 480px;">
                    <div class="modal-header">
                        <h3 class="modal-title">Set up a payment plan</h3>
                        <button type="button" class="modal-close" id="flex-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body" style="padding: 1.5rem;">
                        <div style="text-align:center; margin-bottom:1.25rem;">
                            <div style="font-size:0.7rem; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.05em;">Total to split</div>
                            <div style="font-size:2rem; font-weight:700; color:#fff;">${Utils.formatCurrency(paymentDue)}</div>
                        </div>

                        <label style="display:block; font-size:0.8rem; font-weight:600; color:#fff; margin-bottom:0.35rem;">
                            Over how many monthly payments?
                        </label>
                        <input id="flex-months" type="number" min="2" max="36" value="6" style="width:100%; padding:0.65rem; background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1); border-radius:8px; font-size:1rem; margin-bottom:0.5rem;">
                        <div id="flex-preview" style="font-size:0.85rem; color:#a78bfa; margin-bottom:1rem;"></div>

                        <label style="display:flex; align-items:center; gap:0.5rem; font-size:0.82rem; color:#fff; margin-bottom:0.5rem; cursor:pointer;">
                            <input id="flex-reminders" type="checkbox" checked style="width:1rem; height:1rem; accent-color:#667eea;">
                            Email me a reminder before each payment is due
                        </label>

                        <div id="flex-reminder-days-wrap">
                            <label style="display:block; font-size:0.75rem; color:var(--text-tertiary); margin-bottom:0.3rem;">Days before each due date</label>
                            <input id="flex-reminder-days" type="number" min="1" max="14" value="3" style="width:100%; padding:0.55rem; background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1); border-radius:8px; font-size:0.95rem;">
                        </div>

                        <div style="display:flex; gap:0.5rem; margin-top:1.5rem;">
                            <button class="btn btn-ghost" id="flex-cancel" style="flex:1;">Cancel</button>
                            <button class="btn btn-success" id="flex-create" style="flex:1;"><i class="fas fa-check"></i> Create plan</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('flex-plan-modal');
        const close = () => modal.remove();

        const monthsInput = document.getElementById('flex-months');
        const previewEl = document.getElementById('flex-preview');
        const remindersInput = document.getElementById('flex-reminders');
        const remindersDaysInput = document.getElementById('flex-reminder-days');
        const remindersDaysWrap = document.getElementById('flex-reminder-days-wrap');

        const updatePreview = () => {
            const m = Math.max(2, Math.min(36, parseInt(monthsInput.value, 10) || 0));
            if (!m) { previewEl.textContent = ''; return; }
            const base = Math.floor(totalPence / m);
            const remainder = totalPence - base * m;
            const lastAmount = base + remainder;
            const sameEvery = remainder === 0;
            previewEl.textContent = sameEvery
                ? `${m} × £${(base / 100).toFixed(2)} per month`
                : `${m - 1} × £${(base / 100).toFixed(2)} + 1 × £${(lastAmount / 100).toFixed(2)} (final)`;
        };
        const updateRemindersToggle = () => {
            remindersDaysWrap.style.display = remindersInput.checked ? 'block' : 'none';
        };
        monthsInput.addEventListener('input', updatePreview);
        remindersInput.addEventListener('change', updateRemindersToggle);
        updatePreview();
        updateRemindersToggle();

        document.getElementById('flex-close').addEventListener('click', close);
        document.getElementById('flex-cancel').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

        document.getElementById('flex-create').addEventListener('click', async () => {
            const months = parseInt(monthsInput.value, 10);
            const remindersEnabled = remindersInput.checked;
            const reminderDaysBefore = parseInt(remindersDaysInput.value, 10);
            if (!months || months < 2 || months > 36) {
                Utils.showAlert('Choose between 2 and 36 months.', 'error');
                return;
            }
            const btn = document.getElementById('flex-create');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating…';
            try {
                await API.post('/payments/flexible-plan', {
                    months,
                    reminders_enabled: remindersEnabled,
                    reminder_days_before: remindersEnabled ? reminderDaysBefore : 3,
                });
                close();
                Utils.showAlert('Payment plan created. A confirmation email is on its way.', 'success');
                await this.loadFlexiblePlan();
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-check"></i> Create plan';
                Utils.showAlert(err.message || 'Failed to create plan', 'error');
            }
        });
    },

    async handleFlexInstallmentCard(installmentId, e) {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        try {
            const res = await API.post(`/payments/flexible-plan/installments/${installmentId}/checkout`, {});
            if (res.checkout_url) {
                window.location.href = res.checkout_url;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-credit-card"></i> Card';
            Utils.showAlert(err.message || 'Failed to start payment', 'error');
        }
    },

    async handleFlexInstallmentBank(installmentId, e) {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        try {
            const res = await API.post(`/payments/flexible-plan/installments/${installmentId}/bank-transfer`, {});
            const b = res.bank_details || {};
            Utils.showAlert(
                `Bank transfer recorded. Reference: ${b.reference}. Sort code ${b.sort_code}, account ${b.account_number}.`,
                'success', 8000,
            );
            await this.loadFlexiblePlan();
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-building-columns"></i> Bank';
            Utils.showAlert(err.message || 'Failed to record bank transfer', 'error');
        }
    },

    async handleFlexCancelPlan() {
        if (!confirm('Cancel your payment plan? Paid installments stay paid; any unpaid rows will be cancelled. You can set up a new plan afterwards.')) {
            return;
        }
        try {
            await API.delete('/payments/flexible-plan');
            Utils.showAlert('Plan cancelled.', 'success');
            // Reload underlying attendee data so payment_due reflects any
            // adjustments the cancel made, then re-render everything.
            this.data = await API.get('/me');
            this.updatePaymentInfo();
        } catch (err) {
            Utils.showAlert(err.message || 'Failed to cancel plan', 'error');
        }
    },

    showPaymentOptions() {
        const paymentDue = this.data.payment_due || 0;
        const paymentOption = this.data.payment_option || 'full';

        // Build installment buttons
        let installmentBtns = '';
        if (paymentOption === 'installments') {
            installmentBtns = `
                <div style="margin-bottom: 0.75rem;">
                    <div style="font-size: 0.7rem; color: var(--text-tertiary); margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.05em;">Installment Plans</div>
                    <div style="display: flex; gap: 0.4rem;">
                        <button class="btn btn-sm btn-primary pay-card-installment" data-count="3" style="flex:1;">3 x ${Utils.formatCurrency(Math.ceil(paymentDue / 3 * 100) / 100)}</button>
                        <button class="btn btn-sm btn-primary pay-card-installment" data-count="4" style="flex:1;">4 x ${Utils.formatCurrency(Math.ceil(paymentDue / 4 * 100) / 100)}</button>
                    </div>
                </div>
            `;
        }

        const modalHtml = `
            <div class="modal-overlay" id="payment-options-modal" style="z-index: 500;">
                <div class="modal" style="max-width: 480px;">
                    <div class="modal-header">
                        <h3 class="modal-title">Choose Payment Method</h3>
                        <button type="button" class="modal-close" id="close-payment-modal"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body" style="padding: 1.5rem;">
                        <div style="text-align: center; margin-bottom: 1.5rem;">
                            <div style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Amount Due</div>
                            <div style="font-size: 2rem; font-weight: 700; color: #fff;">${Utils.formatCurrency(paymentDue)}</div>
                        </div>

                        <!-- Family/group pay (only shown if attendee is in a group with payable members) -->
                        <div id="group-pay-section" style="display: none;"></div>

                        <!-- Custom multi-month plan (flexible installments) -->
                        <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(118, 75, 162, 0.08) 100%); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; padding: 1.25rem; margin-bottom: 0.75rem;">
                            <div style="font-size: 0.85rem; font-weight: 600; color: #fff; margin-bottom: 0.5rem;"><i class="fas fa-calendar-alt" style="color: #a78bfa;"></i> Build a custom payment plan</div>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 1rem;">Pick any number of monthly payments (2–36). Pay each installment by card or bank transfer whenever it's due. Email reminders optional.</div>
                            <button class="btn btn-primary open-flex-plan-builder" style="width: 100%;">
                                <i class="fas fa-sliders-h"></i> Set up custom plan
                            </button>
                        </div>

                        <!-- Card Payment -->
                        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem; margin-bottom: 0.75rem;">
                            <div style="font-size: 0.85rem; font-weight: 600; color: #fff; margin-bottom: 0.5rem;"><i class="fas fa-credit-card" style="color: #a78bfa;"></i> Pay by Card</div>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 1rem;">Secure payment via Stripe. Instant confirmation.</div>
                            ${installmentBtns}
                            <button class="btn btn-success pay-card-full" style="width: 100%;">
                                <i class="fas fa-credit-card"></i> Pay ${Utils.formatCurrency(paymentDue)} by Card
                            </button>
                        </div>

                        <!-- Bank Transfer -->
                        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.25rem;">
                            <div style="font-size: 0.85rem; font-weight: 600; color: #fff; margin-bottom: 0.5rem;"><i class="fas fa-building-columns" style="color: #6ee7b7;"></i> Pay by Bank Transfer</div>
                            <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 1rem;">No fees. Transfer directly to our account. Admin confirms receipt.</div>
                            <div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 0.85rem; margin-bottom: 1rem; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.7;">
                                <strong style="color: #fff;">Account Name:</strong> Cloverleaf Christian Centre<br>
                                <strong style="color: #fff;">Sort Code:</strong> <span style="font-family: monospace;">82-12-08</span><br>
                                <strong style="color: #fff;">Account No:</strong> <span style="font-family: monospace;">50180560</span><br>
                                <strong style="color: #fff;">Reference:</strong> <span style="font-family: monospace; color: #fbbf24;">${this.data.ref_number || ''}</span>
                            </div>
                            <button class="btn btn-primary pay-bank-full" style="width: 100%;">
                                <i class="fas fa-check"></i> I've Made the Transfer
                            </button>
                            ${paymentOption === 'installments' ? `
                                <div style="display: flex; gap: 0.4rem; margin-top: 0.5rem;">
                                    <button class="btn btn-sm btn-ghost pay-bank-installment" data-count="3" style="flex:1;">I've paid 3-instalment amount</button>
                                    <button class="btn btn-sm btn-ghost pay-bank-installment" data-count="4" style="flex:1;">I've paid 4-instalment amount</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('payment-options-modal');
        const close = () => modal.remove();

        document.getElementById('close-payment-modal').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

        // Card payment buttons
        modal.querySelector('.pay-card-full')?.addEventListener('click', (e) => { close(); this.handlePayment('full', null, e); });
        modal.querySelectorAll('.pay-card-installment').forEach(btn => {
            btn.addEventListener('click', (e) => { close(); this.handlePayment('installment', parseInt(btn.dataset.count), e); });
        });

        // Bank transfer buttons
        modal.querySelector('.pay-bank-full')?.addEventListener('click', (e) => { close(); this.handleBankTransfer('full', null, e); });
        modal.querySelectorAll('.pay-bank-installment').forEach(btn => {
            btn.addEventListener('click', (e) => { close(); this.handleBankTransfer('installment', parseInt(btn.dataset.count), e); });
        });

        // Custom plan builder — closes the picker modal, opens the calculator.
        modal.querySelector('.open-flex-plan-builder')?.addEventListener('click', () => {
            close();
            this.showFlexiblePlanCalculator();
        });

        // Family/group pay — load asynchronously and show only if applicable.
        this.loadGroupPayInto(modal);
    },

    /**
     * Fetches the group summary; if the attendee belongs to a group and any
     * member (including or excluding self) is payable, renders the
     * "Pay for your family" section into the modal. Silent no-op if the
     * attendee isn't grouped or there's nothing to pay for.
     */
    async loadGroupPayInto(modal) {
        const section = modal.querySelector('#group-pay-section');
        if (!section) return;
        let data;
        try {
            data = await API.get('/payments/group/summary');
        } catch {
            return; // older deployments / no group endpoint — silent skip
        }
        if (!data || !data.group || !Array.isArray(data.members)) return;
        const payable = data.members.filter(m => m.payable);
        const blocked = data.members.filter(m => !m.payable && (m.payment_due_pence > 0));
        if (payable.length < 1) return;

        // Don't show if the only payable person is the attendee themselves —
        // there's nothing "family" about a one-person family.
        const others = payable.filter(m => !m.is_self);
        if (others.length === 0) return;

        const fmtPence = (p) => `£${(p / 100).toFixed(2)}`;
        const memberRows = payable.map(m => `
            <label style="display:flex; align-items:center; gap:0.5rem; padding:0.4rem 0; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer;">
                <input type="checkbox" class="group-pay-check" data-id="${m.id}" data-amount="${m.payment_due_pence}" checked style="width:1rem; height:1rem; accent-color:#a78bfa;">
                <span style="flex:1; color:#fff; font-size:0.85rem;">${this._escape(m.name)}${m.is_self ? ' <span style="color:var(--text-tertiary); font-size:0.72rem;">(you)</span>' : ''}</span>
                <span style="font-weight:600; color:#fff;">${fmtPence(m.payment_due_pence)}</span>
            </label>
        `).join('');

        const blockedNote = blocked.length ? `
            <div style="margin-top:0.5rem; font-size:0.7rem; color: var(--text-tertiary);">
                ${blocked.length} member${blocked.length === 1 ? '' : 's'} on a payment plan — pay them separately from their own dashboard.
            </div>
        ` : '';

        section.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.10) 0%, rgba(110, 231, 183, 0.06) 100%); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 1.25rem; margin-bottom: 0.75rem;">
                <div style="font-size: 0.85rem; font-weight: 600; color: #fff; margin-bottom: 0.3rem;"><i class="fas fa-users" style="color: #6ee7b7;"></i> Pay for your family</div>
                <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 0.75rem;">${this._escape(data.group.name)} — one payment covers everyone you tick.</div>
                <div style="background: rgba(0,0,0,0.15); border-radius: 8px; padding: 0.5rem 0.75rem;">
                    ${memberRows}
                </div>
                ${blockedNote}
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.75rem;">
                    <span style="font-size:0.75rem; color: var(--text-tertiary);">Total:</span>
                    <span id="group-pay-total" style="font-weight:700; color:#fff; font-size:1.1rem;">£0.00</span>
                </div>
                <div style="display:flex; gap:0.4rem; margin-top:0.75rem;">
                    <button class="btn btn-sm btn-success group-pay-card" style="flex:1;"><i class="fas fa-credit-card"></i> Card</button>
                    <button class="btn btn-sm btn-primary group-pay-bank" style="flex:1;"><i class="fas fa-building-columns"></i> Bank Transfer</button>
                </div>
            </div>
        `;
        section.style.display = 'block';

        const checks = section.querySelectorAll('.group-pay-check');
        const totalEl = section.querySelector('#group-pay-total');
        const updateTotal = () => {
            const total = Array.from(checks)
                .filter(c => c.checked)
                .reduce((s, c) => s + parseInt(c.dataset.amount, 10), 0);
            totalEl.textContent = fmtPence(total);
            section.querySelector('.group-pay-card').disabled = total === 0;
            section.querySelector('.group-pay-bank').disabled = total === 0;
        };
        checks.forEach(c => c.addEventListener('change', updateTotal));
        updateTotal();

        section.querySelector('.group-pay-card').addEventListener('click', async (e) => {
            const ids = Array.from(checks).filter(c => c.checked).map(c => parseInt(c.dataset.id, 10));
            if (!ids.length) return;
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirecting…';
            try {
                const res = await API.post('/payments/group/checkout', { attendee_ids: ids });
                if (res.checkout_url) {
                    window.location.href = res.checkout_url;
                } else {
                    throw new Error('No checkout URL received');
                }
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-credit-card"></i> Card';
                Utils.showAlert(err.message || 'Failed to start group payment', 'error');
            }
        });

        section.querySelector('.group-pay-bank').addEventListener('click', async (e) => {
            const ids = Array.from(checks).filter(c => c.checked).map(c => parseInt(c.dataset.id, 10));
            if (!ids.length) return;
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            try {
                const res = await API.post('/payments/group/bank-transfer', { attendee_ids: ids });
                const b = res.bank_details || {};
                // Reuse close() captured by closure — collapse the modal so the
                // alert isn't hidden behind it.
                modal.remove();
                Utils.showAlert(
                    `Family transfer recorded for ${res.member_count} member(s). Reference ${b.reference} — sort code ${b.sort_code}, account ${b.account_number}.`,
                    'success', 12000,
                );
                this.data = await API.get('/me');
                this.updatePaymentInfo();
            } catch (err) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-building-columns"></i> Bank Transfer';
                Utils.showAlert(err.message || 'Failed to record family bank transfer', 'error');
            }
        });
    },

    _escape(s) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    // First letters of the first and last name parts, for the sidebar avatar.
    _initials(name) {
        const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return '·';
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },

    // Time-of-day greeting for the Overview eyebrow.
    _greeting() {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    },

    async handleBankTransfer(type, installmentCount, e) {
        try {
            const body = { payment_type: type };
            if (type === 'installment') body.installment_count = installmentCount;

            await API.post('/payments/bank-transfer', body);
            Utils.showAlert('Bank transfer recorded! We\'ll confirm once payment is received.', 'success');

            // Reload data
            this.data = await API.get('/me');
            this.updatePaymentInfo();
        } catch (error) {
            Utils.showAlert(error.message || 'Failed to record bank transfer', 'error');
        }
    },

    bindPayButtons(container) {
        container.querySelectorAll('.pay-full-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handlePayment('full', null, e));
        });
        container.querySelectorAll('.pay-installment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const count = parseInt(e.currentTarget.dataset.count);
                this.handlePayment('installment', count, e);
            });
        });
    },

    async handlePayment(type, installmentCount, e) {
        try {
            const btn = e.currentTarget;
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirecting...';

            const body = { payment_type: type };
            if (type === 'installment') body.installment_count = installmentCount;

            const response = await API.post('/payments/checkout', body);

            if (response.checkout_url) {
                window.location.href = response.checkout_url;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error) {
            console.error('Payment error:', error);
            Utils.showAlert(error.message || 'Failed to start payment. Please try again.', 'error');
            document.querySelectorAll('.pay-full-btn, .pay-installment-btn').forEach(b => {
                b.disabled = false;
            });
            this.updatePaymentInfo();
        }
    },

    async loadPaymentHistory() {
        const section = document.getElementById('payment-history-section');
        if (!section) return;

        try {
            const response = await API.get('/payments/history');
            const payments = response.payments || [];

            if (payments.length === 0) {
                section.innerHTML = `
                    <div style="padding: 1.5rem; text-align: center; color: var(--text-tertiary);">
                        <i class="fas fa-receipt" style="font-size:1.5rem; opacity:0.5; display:block; margin-bottom:0.5rem;"></i>
                        <div style="font-size: 0.85rem;">No payments yet.</div>
                    </div>
                `;
                return;
            }

            // Now renders in the dedicated right-hand column with the
            // section title already provided by the parent panel — so no
            // need for an inline "Payment History" header here.
            const rows = payments.map(p => {
                const amount = (p.amount / 100).toFixed(2);
                const statusBadge = {
                    'succeeded': '<span class="badge badge-success">Paid</span>',
                    'pending': '<span class="badge badge-warning">Pending</span>',
                    'failed': '<span class="badge badge-danger">Failed</span>',
                    'cancelled': '<span class="badge badge-secondary">Cancelled</span>',
                }[p.status] || '<span class="badge badge-secondary">' + p.status + '</span>';
                const isStripe = !!p.stripe_checkout_session_id;
                const methodBadge = isStripe
                    ? '<span class="badge badge-secondary" style="font-size:0.65rem;"><i class="fas fa-credit-card"></i> Card</span>'
                    : '<span class="badge badge-secondary" style="font-size:0.65rem;"><i class="fas fa-building-columns"></i> Bank</span>';
                const date = p.paid_at || p.created_at;
                const dateStr = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

                return `<div style="display: flex; justify-content: space-between; align-items: center; padding: 0.7rem 0; border-bottom: 1px solid var(--border);">
                    <div style="min-width: 0;">
                        <div style="font-size: 0.95rem; font-weight: 600; color: #fff;">£${amount}</div>
                        <div style="font-size: 0.72rem; color: var(--text-tertiary); margin-top: 0.15rem;">${dateStr} &middot; ${methodBadge}</div>
                    </div>
                    ${statusBadge}
                </div>`;
            }).join('');

            section.innerHTML = rows;
        } catch (error) {
            // Silently fail - payment history is supplementary
            console.warn('Could not load payment history:', error);
        }
    },

    /**
     * Update group information section
     */
    updateGroupInfo() {
        const content = document.getElementById('group-info-content');
        if (!content) return;
        
        if (this.data.group && this.data.group.members && this.data.group.members.length > 0) {
            // Calculate group financial summary
            const groupFinancial = this.data.group.financial || {};
            const totalOutstanding = groupFinancial.totalOutstanding || 0;
            const membersWithPayments = groupFinancial.membersWithPayments || 0;
            const totalMembers = this.data.group.members.length + 1; // +1 for current user
            
            content.innerHTML = `
                <div class="info-item">
                    <div class="info-label">Group Name</div>
                    <div class="info-value">${Utils.escapeHtml(this.data.group.name)}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Total Members</div>
                    <div class="info-value">${totalMembers} members</div>
                </div>
                
                <!-- Enhanced Financial Information -->
                <div class="info-item" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                    <div class="info-label">
                        <i class="fas fa-pound-sign"></i> Group Outstanding Balance
                    </div>
                    <div class="info-value" style="font-size: 1.3rem; font-weight: 700; color: ${totalOutstanding > 0 ? 'var(--warning)' : 'var(--success)'};">
                        ${Utils.formatCurrency(totalOutstanding)}
                    </div>
                    ${totalOutstanding > 0 ? `
                        <div style="margin-top: 0.5rem;">
                            <span class="badge badge-warning">
                                <i class="fas fa-exclamation-triangle"></i> 
                                ${membersWithPayments} member${membersWithPayments !== 1 ? 's' : ''} with pending payments
                            </span>
                        </div>
                    ` : `
                        <div style="margin-top: 0.5rem;">
                            <span class="badge badge-success">
                                <i class="fas fa-check-circle"></i> 
                                All payments complete
                            </span>
                        </div>
                    `}
                </div>
                
                <div class="info-item">
                    <div class="info-label">Fellow Members (${this.data.group.members.length})</div>
                    <ul class="member-list enhanced-member-list">
                        ${this.data.group.members.map(member => {
                            const paymentDue = member.payment_due || 0;
                            const hasPayment = paymentDue > 0;
                            
                            return `
                                <li style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                                    <div>
                                        <span style="font-weight: 500;">${Utils.escapeHtml(member.name)}</span>
                                        <br>
                                        <small style="color: var(--text-secondary);">${Utils.escapeHtml(member.ref_number)}</small>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 600; color: ${hasPayment ? 'var(--warning)' : 'var(--success)'};">
                                            ${Utils.formatCurrency(paymentDue)}
                                        </div>
                                        <span class="badge badge-${hasPayment ? 'warning' : 'success'}" style="font-size: 0.7rem;">
                                            ${hasPayment ? 'Pending' : 'Paid'}
                                        </span>
                                    </div>
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </div>
                
                <!-- Group Payment Summary -->
                ${totalOutstanding > 0 ? `
                    <div class="info-item" style="margin-top: 1rem; padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: var(--border-radius); border: 1px solid rgba(245, 158, 11, 0.2);">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-info-circle" style="color: var(--warning);"></i>
                            <strong style="color: var(--warning);">Group Payment Status</strong>
                        </div>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-primary);">
                            Your group has <strong>${Utils.formatCurrency(totalOutstanding)}</strong> in outstanding payments. 
                            ${membersWithPayments} out of ${totalMembers} members still need to complete their payments.
                        </p>
                        ${membersWithPayments > 0 ? `
                            <small style="color: var(--text-secondary); display: block; margin-top: 0.5rem;">
                                Contact the retreat organizers if you need assistance with group payment coordination.
                            </small>
                        ` : ''}
                    </div>
                ` : `
                    <div class="info-item" style="margin-top: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: var(--border-radius); border: 1px solid rgba(16, 185, 129, 0.2);">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-check-circle" style="color: var(--success);"></i>
                            <strong style="color: var(--success);">All Payments Complete!</strong>
                        </div>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-primary);">
                            Excellent! All members in your group have completed their payments. 
                            You're all set for the retreat.
                        </p>
                    </div>
                `}
            `;
        } else if (this.data.group) {
            // User is in a group but is the only member
            const userPayment = this.data.payment_due || 0;
            
            content.innerHTML = `
                <div class="info-item">
                    <div class="info-label">Group Name</div>
                    <div class="info-value">${Utils.escapeHtml(this.data.group.name)}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">
                        <i class="fas fa-pound-sign"></i> Group Outstanding Balance
                    </div>
                    <div class="info-value" style="font-size: 1.3rem; font-weight: 700; color: ${userPayment > 0 ? 'var(--warning)' : 'var(--success)'};">
                        ${Utils.formatCurrency(userPayment)}
                    </div>
                    <span class="badge badge-${userPayment > 0 ? 'warning' : 'success'}">
                        ${userPayment > 0 ? 'Your payment pending' : 'Payment complete'}
                    </span>
                </div>
                
                <div class="info-item">
                    <div class="info-value" style="color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> You're the only member in this group so far
                    </div>
                    <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                        Other members may be added as they register for the retreat
                    </small>
                </div>
            `;
        } else {
            // No group assignment
            content.innerHTML = `
                <div class="info-item">
                    <div class="info-value" style="color: var(--text-secondary);">
                        <i class="fas fa-info-circle"></i> No group assignment yet
                    </div>
                    <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                        Group assignments help organize activities and meals
                    </small>
                </div>
            `;
        }
    },

    /**
     * Update detailed information section
     */
    updateDetailedInfo() {
        const content = document.getElementById('detailed-info-content');
        if (!content) return;
        
        const d = this.data;
        const field = (label, value) => value ? `<div class="info-item"><div class="info-label">${label}</div><div class="info-value">${Utils.escapeHtml(value)}</div></div>` : '';

        content.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; padding: 1rem;">
                <div>
                    <h4 style="color: var(--primary-400); margin-bottom: 0.75rem; font-size: 0.85rem;">
                        <i class="fas fa-user"></i> Personal
                    </h4>
                    ${field('Full Name', d.name)}
                    ${field('Reference', d.ref_number)}
                    ${field('Email', d.email)}
                    ${field('Phone', d.phone)}
                </div>
                <div>
                    <h4 style="color: var(--primary-400); margin-bottom: 0.75rem; font-size: 0.85rem;">
                        <i class="fas fa-heart"></i> Health & Safety
                    </h4>
                    ${field('Emergency Contact', d.emergency_contact)}
                    ${field('Dietary Requirements', d.dietary_requirements)}
                    ${field('Special Requests', d.special_requests)}
                    ${!d.emergency_contact && !d.dietary_requirements && !d.special_requests ? '<div style="font-size: 0.8rem; color: var(--text-tertiary);">No details provided — click Edit to add</div>' : ''}
                </div>
                <div>
                    <h4 style="color: var(--primary-400); margin-bottom: 0.75rem; font-size: 0.85rem;">
                        <i class="fas fa-bed"></i> Accommodation
                    </h4>
                    ${d.room
                        ? field('Room', d.room.number) + field('Type', d.room.description || 'Standard')
                        : '<div style="font-size: 0.8rem; color: var(--text-tertiary);"><i class="fas fa-clock"></i> Room assignment pending</div>'}
                </div>
                <div>
                    <h4 style="color: var(--primary-400); margin-bottom: 0.75rem; font-size: 0.85rem;">
                        <i class="fas fa-users"></i> Group
                    </h4>
                    ${d.group
                        ? field('Group', d.group.name) + `<div class="info-item"><div class="info-label">Members</div><div class="info-value">${d.group.members.length + 1}</div></div>`
                        : '<div style="font-size: 0.8rem; color: var(--text-tertiary);"><i class="fas fa-clock"></i> No group assigned yet</div>'}
                </div>
            </div>
        `;
    },

    // ==================== NEW FEATURES ====================

    updateCountdown() {
        const display = document.getElementById('countdown-display');
        if (!display) return;

        const retreatDate = new Date('2026-07-31T15:00:00');
        const update = () => {
            const now = new Date();
            const diff = retreatDate - now;
            if (diff <= 0) {
                display.innerHTML = '<div style="font-size: 1.25rem; font-weight: 700; color: #6ee7b7;">The retreat is here!</div>';
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            const unit = (val, label) => `
                <div style="text-align: center;">
                    <div style="font-size: 1.75rem; font-weight: 700; color: #fff; line-height: 1;">${val}</div>
                    <div style="font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-tertiary); margin-top: 0.2rem;">${label}</div>
                </div>`;
            display.innerHTML = unit(days, 'Days') + unit(hours, 'Hours') + unit(mins, 'Mins') + unit(secs, 'Secs');
        };
        update();
        setInterval(update, 1000);
    },

    // Wake-lock handle so the screen stays lit while the QR is on show.
    _wakeLock: null,

    /**
     * Prepare the check-in view. The QR is NOT drawn up front — the attendee
     * taps "I'm ready to check in" to reveal it (keeps the code off-screen
     * until they're actually at the desk, and lets us blow it up big +
     * keep the screen awake only while it's needed).
     */
    updateQRCode() {
        const refDisplay = document.getElementById('qr-ref-display');
        if (refDisplay && this.data.ref_number) refDisplay.textContent = this.data.ref_number;

        const revealBtn = document.getElementById('checkin-reveal-btn');
        const hideBtn = document.getElementById('checkin-hide-btn');
        if (revealBtn && !revealBtn._bound) {
            revealBtn._bound = true;
            revealBtn.addEventListener('click', () => this.revealCheckinQR());
        }
        if (hideBtn && !hideBtn._bound) {
            hideBtn._bound = true;
            hideBtn.addEventListener('click', () => this.hideCheckinQR());
        }
    },

    /**
     * Render the attendee's QR locally (vendored qrcode-generator — no
     * third-party image service, works offline once the page has loaded)
     * and swap the intro card for the enlarged code.
     */
    revealCheckinQR() {
        const container = document.getElementById('qr-code-container');
        const intro = document.getElementById('checkin-intro');
        const qrBlock = document.getElementById('checkin-qr');
        if (!container || !this.data || !this.data.ref_number) return;

        // Encode {ref, name} as JSON — the check-in scanner reads `.ref` and
        // tolerates a plain ref string too, so this stays compatible.
        const payload = JSON.stringify({ ref: this.data.ref_number, name: this.data.name });

        try {
            if (typeof qrcode !== 'function') throw new Error('QR library unavailable');
            const qr = qrcode(0, 'M');       // type 0 = auto-size, error-correction M
            qr.addData(payload);
            qr.make();
            // Scalable SVG so it stays crisp at any size; CSS caps the width.
            container.innerHTML = qr.createSvgTag({ cellSize: 8, margin: 1, scalable: true });
        } catch (err) {
            console.error('QR generation failed:', err);
            Utils.showAlert('Could not generate your QR code — please show your reference number instead.', 'error');
            return;
        }

        if (intro) intro.classList.add('hidden');
        if (qrBlock) qrBlock.classList.remove('hidden');
        this._requestWakeLock();
    },

    hideCheckinQR() {
        const intro = document.getElementById('checkin-intro');
        const qrBlock = document.getElementById('checkin-qr');
        if (intro) intro.classList.remove('hidden');
        if (qrBlock) qrBlock.classList.add('hidden');
        this._releaseWakeLock();
    },

    async _requestWakeLock() {
        try {
            if ('wakeLock' in navigator && navigator.wakeLock.request) {
                this._wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch { /* wake lock is a nice-to-have; ignore failures */ }
    },

    _releaseWakeLock() {
        try { this._wakeLock?.release?.(); } catch { /* ignore */ }
        this._wakeLock = null;
    },

    updateActivityTeams() {
        const container = document.getElementById('activity-teams-content');
        if (!container) return;

        const teams = this.data.activity_teams || [];
        if (teams.length === 0) {
            container.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-tertiary); text-align: center; padding: 1rem;">No activity teams assigned yet</div>';
            return;
        }

        // Card grid so multiple teams sit side-by-side on wide screens
        // instead of stacking in a narrow column.
        container.innerHTML = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.85rem;">${
            teams.map(team => {
              const color = team.color || '#8b5cf6';
              return `
                <div style="padding: 1rem 1.1rem 1rem 1.25rem; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); border-left: 4px solid ${Utils.escapeHtml(color)}; display: flex; flex-direction: column; gap: 0.4rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                        <span class="team-color-dot" style="background: ${Utils.escapeHtml(color)};"></span>
                        <div style="font-size: 0.95rem; font-weight: 700; color: #fff;">${Utils.escapeHtml(team.name)}</div>
                        ${team.is_leader ? '<span class="badge badge-primary"><i class="fas fa-crown"></i> Leader</span>' : ''}
                    </div>
                    ${team.description ? `<div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${Utils.escapeHtml(team.description)}</div>` : ''}
                    <div style="font-size: 0.72rem; color: var(--text-tertiary); margin-top: auto;">
                        <i class="fas fa-user-shield"></i> Leader: <strong style="color: var(--text-secondary);">${Utils.escapeHtml(team.leader_name || 'TBD')}</strong>
                        &nbsp;&middot;&nbsp; ${team.members.length} member${team.members.length === 1 ? '' : 's'}
                    </div>
                    ${team.members.length ? `<div style="font-size: 0.72rem; color: var(--text-tertiary); padding-top: 0.4rem; border-top: 1px solid rgba(255,255,255,0.06); line-height: 1.5;">
                        ${team.members.map(n => Utils.escapeHtml(n)).join(', ')}
                    </div>` : ''}
                </div>
            `;
            }).join('')
        }</div>`;
    },

    updatePackingChecklist() {
        const container = document.getElementById('packing-list');
        const progressEl = document.getElementById('packing-progress');
        if (!container) return;

        const items = [
            { category: 'Essentials', items: ['Bible', 'Notebook & Pen', 'Phone Charger', 'ID / Driving Licence', 'Cash / Card'] },
            { category: 'Clothing', items: ['Comfortable day clothes', 'Smart casual evening wear', 'Warm jacket / layers', 'Comfortable shoes', 'Sleepwear'] },
            { category: 'Toiletries', items: ['Toothbrush & Toothpaste', 'Shower gel / Shampoo', 'Towel', 'Any medications'] },
            { category: 'Optional', items: ['Snacks to share', 'Musical instrument', 'Board games', 'Walking shoes', 'Umbrella / Raincoat'] },
        ];

        const storageKey = `packing_${this.data.ref_number || 'guest'}`;
        let checked = {};
        try { checked = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch {}

        const allItems = items.flatMap(c => c.items);
        const checkedCount = allItems.filter(i => checked[i]).length;
        if (progressEl) progressEl.textContent = `${checkedCount}/${allItems.length} packed`;

        container.innerHTML = items.map(cat => `
            <div style="margin-bottom: 0.5rem;">
                <div style="font-size: 0.7rem; font-weight: 600; color: #a78bfa; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.3rem;">${cat.category}</div>
                ${cat.items.map(item => `
                    <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0; cursor: pointer; font-size: 0.8rem; color: ${checked[item] ? 'var(--text-tertiary)' : 'var(--text-secondary)'}; ${checked[item] ? 'text-decoration: line-through;' : ''}">
                        <input type="checkbox" class="packing-item" data-item="${Utils.escapeHtml(item)}" ${checked[item] ? 'checked' : ''} style="accent-color: var(--primary-500);">
                        ${Utils.escapeHtml(item)}
                    </label>
                `).join('')}
            </div>
        `).join('');

        // Bind checkbox changes
        container.querySelectorAll('.packing-item').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const item = e.target.dataset.item;
                if (e.target.checked) checked[item] = true;
                else delete checked[item];
                localStorage.setItem(storageKey, JSON.stringify(checked));
                this.updatePackingChecklist();
            });
        });
    },

    bindProfileEdit() {
        const editBtn = document.getElementById('edit-profile-btn');
        if (!editBtn) return;

        editBtn.addEventListener('click', () => {
            const content = document.getElementById('detailed-info-content');
            if (!content) return;

            content.innerHTML = `
                <form id="profile-edit-form" style="padding: 1rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Phone</label>
                            <input type="tel" name="phone" class="form-input" value="${Utils.escapeHtml(this.data.phone || '')}" placeholder="Your phone number">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Emergency Contact</label>
                            <input type="text" name="emergency_contact" class="form-input" value="${Utils.escapeHtml(this.data.emergency_contact || '')}" placeholder="Name and number">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Dietary Requirements</label>
                            <input type="text" name="dietary_requirements" class="form-input" value="${Utils.escapeHtml(this.data.dietary_requirements || '')}" placeholder="Any dietary needs">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Special Requests</label>
                            <input type="text" name="special_requests" class="form-input" value="${Utils.escapeHtml(this.data.special_requests || '')}" placeholder="Any special needs">
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                        <button type="submit" class="btn btn-primary btn-sm"><i class="fas fa-save"></i> Save Changes</button>
                        <button type="button" class="btn btn-ghost btn-sm" id="cancel-profile-edit"><i class="fas fa-times"></i> Cancel</button>
                    </div>
                </form>
            `;

            document.getElementById('cancel-profile-edit').addEventListener('click', () => {
                this.updateDetailedInfo();
            });

            document.getElementById('profile-edit-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                try {
                    await API.request('/profile', { method: 'PUT', body: JSON.stringify(data) });
                    Utils.showAlert('Profile updated successfully', 'success');
                    // Reload data
                    this.data = await API.get('/me');
                    this.updateDetailedInfo();
                } catch (error) {
                    Utils.showAlert(error.message || 'Failed to update profile', 'error');
                }
            });
        });
    },

    bindDownloadConfirmation() {
        const btn = document.getElementById('download-confirmation-btn');
        if (!btn) return;

        btn.addEventListener('click', () => {
            const d = this.data;
            const reg = d.family_registration;
            const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

            let familyRows = '';
            if (reg && reg.family_members) {
                familyRows = reg.family_members.map(m =>
                    `<tr><td style="padding:8px;border:1px solid #ddd;">${m.name}</td><td style="padding:8px;border:1px solid #ddd;">${m.member_type}</td><td style="padding:8px;border:1px solid #ddd;text-align:right;">£${(m.price || 0).toFixed(2)}</td></tr>`
                ).join('');
            }

            const html = `
                <html><head><meta charset="UTF-8"><title>Booking Confirmation - ${d.ref_number}</title>
                <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}h1{color:#667eea}table{border-collapse:collapse;width:100%}th{background:#667eea;color:#fff;padding:10px;text-align:left}td{padding:8px;border:1px solid #ddd}.header{text-align:center;margin-bottom:30px}.info{margin:20px 0;padding:15px;background:#f8f9fa;border-radius:8px}.footer{margin-top:40px;text-align:center;color:#999;font-size:12px}</style></head>
                <body>
                <div class="header">
                    <h1>Growth & Wisdom Family Retreat 2026</h1>
                    <p>Booking Confirmation</p>
                </div>
                <div class="info">
                    <strong>Reference:</strong> ${d.ref_number}<br>
                    <strong>Name:</strong> ${d.name}<br>
                    ${d.email ? `<strong>Email:</strong> ${d.email}<br>` : ''}
                    <strong>Payment Status:</strong> ${d.payment_due > 0 ? '£' + d.payment_due.toFixed(2) + ' outstanding' : 'Paid in Full'}<br>
                    <strong>Payment Plan:</strong> ${d.payment_option === 'installments' ? 'Installments' : d.payment_option === 'sponsorship' ? 'Sponsorship' : 'Full Payment'}<br>
                    ${d.room ? `<strong>Room:</strong> ${d.room.number}<br>` : ''}
                    ${d.group ? `<strong>Group:</strong> ${d.group.name}<br>` : ''}
                </div>
                ${familyRows ? `
                <h3>Family Members</h3>
                <table><thead><tr><th>Name</th><th>Type</th><th style="text-align:right">Cost</th></tr></thead>
                <tbody>${familyRows}</tbody>
                <tfoot><tr><td colspan="2" style="padding:8px;border:1px solid #ddd;font-weight:bold">Total</td><td style="padding:8px;border:1px solid #ddd;text-align:right;font-weight:bold">£${(reg.total_amount || 0).toFixed(2)}</td></tr></tfoot>
                </table>` : ''}
                <div class="info" style="margin-top:20px;">
                    <strong>Venue:</strong> The Hayes Conference Centre, Swanwick, Derbyshire DE55 1AU<br>
                    <strong>Dates:</strong> July 31 – August 2, 2026<br>
                    <strong>Check-in:</strong> 3:00 PM on Friday, July 31
                </div>
                <div class="footer">
                    Generated on ${now} | Growth & Wisdom Family Retreat 2026<br>
                    Hosted by Cloverleaf Christian Centre
                </div>
                </body></html>
            `;

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                    URL.revokeObjectURL(url);
                };
            }
        });
    },

    updateFamilySummary() {
        const reg = this.data.family_registration;
        if (!reg || !reg.family_members || reg.family_members.length <= 1) return;

        // Only show for primary attendees with a family registration
        const container = document.getElementById('detailed-info');
        if (!container) return;

        const typeBadges = {
            'adult': '<span class="badge badge-primary">Adult</span>',
            'child': '<span class="badge badge-info">Child</span>',
            'infant': '<span class="badge badge-success">Infant</span>',
        };

        const planLabels = {
            'full': 'Full Payment',
            'installments': 'Monthly Installments',
            'sponsorship': 'Sponsorship Requested',
        };

        const registeredDate = new Date(reg.submitted_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        const memberRows = reg.family_members.map((m, i) => `
            <tr>
                <td style="padding: 0.6rem 1rem;">
                    ${Utils.escapeHtml(m.name)}
                    ${i === 0 ? ' <span class="badge badge-primary" style="font-size: 0.55rem;">Primary</span>' : ''}
                </td>
                <td style="padding: 0.6rem 1rem;">${typeBadges[m.member_type] || m.member_type}</td>
                <td style="padding: 0.6rem 1rem;">${m.dietary_requirements ? Utils.escapeHtml(m.dietary_requirements) : '<span style="color: var(--text-tertiary);">None</span>'}</td>
                <td style="padding: 0.6rem 1rem; text-align: right; font-weight: 600;">${m.price === 0 ? '<span style="color: var(--success);">FREE</span>' : Utils.formatCurrency(m.price)}</td>
            </tr>
        `).join('');

        const totalPaid = reg.total_amount - (this.data.payment_due || 0);

        const familyHtml = `
            <div class="data-table" style="margin-top: 1.5rem;">
                <div class="table-header">
                    <h3 class="table-title"><i class="fas fa-people-roof"></i> Family Registration Summary</h3>
                    <span class="badge badge-secondary">Registered ${registeredDate}</span>
                </div>
                <div style="padding: 1rem 1.25rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
                        <div style="text-align: center; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 10px;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: #fff;">${reg.member_count}</div>
                            <div style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Family Members</div>
                        </div>
                        <div style="text-align: center; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 10px;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: #fff;">${Utils.formatCurrency(reg.total_amount)}</div>
                            <div style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Total Cost</div>
                        </div>
                        <div style="text-align: center; padding: 0.75rem; background: rgba(255,255,255,0.03); border-radius: 10px;">
                            <div style="font-size: 1.25rem; font-weight: 700; color: #a78bfa;">${planLabels[reg.payment_option] || reg.payment_option}</div>
                            <div style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em;">Payment Plan</div>
                        </div>
                    </div>
                </div>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Dietary</th>
                                <th style="text-align: right;">Cost</th>
                            </tr>
                        </thead>
                        <tbody>${memberRows}</tbody>
                        <tfoot>
                            <tr style="border-top: 2px solid rgba(255,255,255,0.1);">
                                <td colspan="3" style="padding: 0.75rem 1rem; font-weight: 600;">Total</td>
                                <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 700; font-size: 1.1rem;">${Utils.formatCurrency(reg.total_amount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('afterend', familyHtml);
    }
};

// Make component globally available
window.AttendeeDashboard = AttendeeDashboard;
