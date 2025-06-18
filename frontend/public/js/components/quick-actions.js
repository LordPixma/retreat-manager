const QuickActions = {
    async init() {
        this.bindEvents();
        this.loadActivity();
    },

    bindEvents() {
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
