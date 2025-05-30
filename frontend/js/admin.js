// js/admin.js
const API_BASE = '/api/admin';

// Utility: get/set Admin JWT
function setAdminToken(token) {
  localStorage.setItem('adminToken', token);
}
function getAdminToken() {
  return localStorage.getItem('adminToken');
}
function clearAdminToken() {
  localStorage.removeItem('adminToken');
}

// Show error messages
function showAdminError(selector, msg) {
  const el = document.querySelector(selector);
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 5000);
}

// 1. Admin Login (admin.html)
if (document.getElementById('admin-login-form')) {
  document.getElementById('admin-login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const user = document.getElementById('user').value.trim();
    const pass = document.getElementById('pass').value;

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setAdminToken(data.token);
      window.location.href = 'dashboard.html';
    } catch (err) {
      showAdminError('#admin-error', err.message);
    }
  });
}

// 2. Admin Dashboard (dashboard.html)
if (document.getElementById('attendee-table')) {
  const token = getAdminToken();
  if (!token) {
    window.location.href = 'admin.html';
  } else {
    // Fetch and render attendees
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/attendees`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) throw new Error('Invalid session');
        const list = await res.json();
        const tbody = document.querySelector('#attendee-table tbody');
        tbody.innerHTML = list.map(a => `
          <tr>
            <td>${a.ref_number}</td>
            <td>${a.name}</td>
            <td>${a.room ? a.room.number : '—'}</td>
            <td>£${a.payment_due.toFixed(2)}</td>
            <td>${a.group ? a.group.name : '—'}</td>
            <td>
              <button data-id="${a.id}" class="edit">Edit</button>
              <button data-id="${a.id}" class="delete">Delete</button>
            </td>
          </tr>
        `).join('');

        // Attach edit/delete handlers
        document.querySelectorAll('button.edit').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            // TODO: open edit form/modal
          });
        });
        document.querySelectorAll('button.delete').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('Delete this attendee?')) return;
            await fetch(`${API_BASE}/attendees/${btn.dataset.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            window.location.reload();
          });
        });

      } catch (err) {
        clearAdminToken();
        window.location.href = 'admin.html';
      }
    })();
  }

  // Add Attendee button
  document.getElementById('add-attendee').addEventListener('click', () => {
    // TODO: open create form/modal
  });

  // Logout
  document.getElementById('admin-logout').addEventListener('click', () => {
    clearAdminToken();
    window.location.href = 'admin.html';
  });
}