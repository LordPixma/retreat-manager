const QuickActions = {
    async init() {
        this.bindEvents();
        this.loadActivity();
    },

// Refactor bindEvents to eliminate repetition by using small mapping arrays:
bindEvents() {
  // Direct handlers
  const handlers = [
    { id: 'export-data-btn',         fn: () => Utils.showAlert('Data export started', 'success') },
    { id: 'send-announcement-btn',   fn: () => window.AnnouncementManagement?.showModal() },
  ];

  // QA proxies that simply forward click to another button
  const proxies = [
    { qaId: 'qa-add-attendee',       targetId: 'add-attendee-btn' },
    { qaId: 'qa-bulk-upload',        targetId: 'bulk-upload-btn' },
    { qaId: 'qa-send-announcement',  targetId: 'send-announcement-btn' },
    { qaId: 'qa-export-data',        targetId: 'export-data-btn' },
  ];

  handlers.forEach(({ id, fn }) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  });

  proxies.forEach(({ qaId, targetId }) => {
    const qaEl = document.getElementById(qaId);
    const targetEl = document.getElementById(targetId);
    if (qaEl && targetEl) {
      qaEl.addEventListener('click', () => targetEl.click());
    }
  });
}
        document.getElementById('export-data-btn')?.addEventListener('click', () => {
            Utils.showAlert('Data export started', 'success');
        });
        document.getElementById('send-announcement-btn')?.addEventListener('click', () => {
            if (window.AnnouncementManagement) {
                window.AnnouncementManagement.showModal();
            } else {
                Utils.showAlert('Announcement feature is currently unavailable.', 'warning');
                console.warn('window.AnnouncementManagement is undefined. Cannot show announcement modal.');
            }
        });
        document.getElementById('qa-add-attendee')?.addEventListener('click', () => {
            document.getElementById('add-attendee-btn')?.click();
        });
        document.getElementById('qa-bulk-upload')?.addEventListener('click', () => {
            document.getElementById('bulk-upload-btn')?.click();
        });
        document.getElementById('qa-send-announcement')?.addEventListener('click', () => {
            document.getElementById('send-announcement-btn')?.click();
        });
        document.getElementById('qa-export-data')?.addEventListener('click', () => {
            document.getElementById('export-data-btn')?.click();
        });
    },

    loadActivity() {
        const feed = document.getElementById('activity-feed');
        if (!feed) return;
        feed.innerHTML = `
            <li class="timeline-item"><span class="timeline-time">Just now</span> Admin logged in</li>
            <li class="timeline-item"><span class="timeline-time">1h ago</span> Announcement sent</li>
            <li class="timeline-item"><span class="timeline-time">Yesterday</span> New attendee added</li>
        `;
    }
};

window.QuickActions = QuickActions;
