// js/attendee.js
const API_BASE = '/api';

// Utility: get/set JWT
function setToken(token) {
  localStorage.setItem('attendeeToken', token);
}
function getToken() {
  return localStorage.getItem('attendeeToken');
}
function clearToken() {
  localStorage.removeItem('attendeeToken');
}

// Show error messages
function showError(selector, msg) {
  const el = document.querySelector(selector);
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 5000);
}

// 1. Attendee Login (index.html)
if (document.getElementById('login-form')) {
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const ref = document.getElementById('ref').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setToken(data.token);
      window.location.href = 'attendee.html';
    } catch (err) {
      showError('#error', err.message);
    }
  });
}

// 2. Attendee Dashboard (attendee.html)
if (document.getElementById('logout')) {
  const token = getToken();
  if (!token) {
    window.location.href = 'index.html';
  } else {
    // Fetch attendee info
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) throw new Error('Invalid session');
        const me = await res.json();
        // Populate UI
        document.getElementById('name').textContent = me.name;

        // Room Info
        const roomEl = document.getElementById('room-info');
        if (me.room) {
          roomEl.innerHTML = `
            <h2>Room Allocation</h2>
            <p>Room: ${me.room.number}</p>
            <p>${me.room.description}</p>
          `;
        } else {
          roomEl.innerHTML = '<p>No room assigned yet.</p>';
        }

        // Payments
        const payEl = document.getElementById('payments');
        payEl.innerHTML = `
          <h2>Outstanding Payments</h2>
          <p>£${me.payment_due.toFixed(2)}</p>
        `;

        // Group Members
        const groupEl = document.getElementById('group');
        if (me.group && me.group.members.length) {
          groupEl.innerHTML = `
            <h2>Your Group: ${me.group.name}</h2>
            <ul>${me.group.members.map(m => `<li>${m.name} (${m.ref_number})</li>`).join('')}</ul>
          `;
        } else {
          groupEl.innerHTML = '<p>You have no group members yet.</p>';
        }

      } catch (err) {
        clearToken();
        window.location.href = 'index.html';
      }
    })();
  }

  // Logout button
  document.getElementById('logout').addEventListener('click', () => {
    clearToken();
    window.location.href = 'index.html';
  });
}
```### js/admin.js
```js
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