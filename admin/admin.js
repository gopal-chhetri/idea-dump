lucide.createIcons();

// ── State ──
const state = {
  token: localStorage.getItem('admin_token') || null,
  user: null,
  usersPage: 1,
  ideasPage: 1,
};

// ── DOM refs ──
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const loginScreen = $('#login-screen');
const dashboardScreen = $('#dashboard-screen');
const loginForm = $('#login-form');
const loginError = $('#login-error');
const adminEmail = $('#admin-email');
const logoutBtn = $('#logout-btn');
const usersTbody = $('#users-tbody');
const ideasTbody = $('#ideas-tbody');
const settingsList = $('#settings-list');
const createUserModal = $('#create-user-modal');

// ── API helper ──
async function api(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
}

// ── Auth ──
async function handleLogin(email, password) {
  try {
    const data = await api('POST', '/auth/login', { email, password });
    const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
    if (payload.role !== 'admin') throw new Error('Not an admin account');
    state.token = data.accessToken;
    state.user = payload;
    localStorage.setItem('admin_token', data.accessToken);
    showDashboard();
  } catch (err) {
    loginError.textContent = err.message;
  }
}

function handleLogout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('admin_token');
  loginScreen.style.display = '';
  dashboardScreen.style.display = 'none';
  loginForm.reset();
  loginError.textContent = '';
}

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboardScreen.style.display = '';
  adminEmail.textContent = state.user.email;
  logoutBtn.style.display = '';
  lucide.createIcons();
  loadOverview();
}

// ── Navigation ──
$$('.admin-side a').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    $$('.admin-side a').forEach((a) => a.classList.remove('active'));
    link.classList.add('active');
    $$('.section-content').forEach((s) => (s.style.display = 'none'));
    const section = document.getElementById(`section-${link.dataset.section}`);
    if (section) section.style.display = '';
    const action = `load${link.dataset.section.charAt(0).toUpperCase()}${link.dataset.section.slice(1)}`;
    if (typeof window[action] === 'function') window[action]();
    lucide.createIcons();
  });
});

// ── Overview ──
async function loadOverview() {
  try {
    const stats = await api('GET', '/admin/stats');
    $('#stat-users').textContent = stats.userCount;
    $('#stat-admins').textContent = stats.adminCount;
    $('#stat-ideas').textContent = stats.ideaCount;
  } catch (err) {
    if (err.message.includes('401') || err.message.includes('Unauthorized')) handleLogout();
  }
}

// ── Users ──
async function loadUsers() {
  try {
    const data = await api('GET', `/admin/users?page=${state.usersPage}&limit=20`);
    usersTbody.innerHTML = data.users.map((u) => `
      <tr>
        <td>${escapeHtml(u.email)}</td>
        <td><span class="pill ${u.role === 'admin' ? 'pill-admin' : 'pill-user'}">${u.role}</span></td>
        <td>${new Date(u.createdAt).toLocaleDateString()}</td>
        <td class="row-actions">
          <button class="btn btn-sm btn-secondary" onclick="toggleRole('${u.id}','${u.role}')">
            ${u.role === 'admin' ? 'Demote' : 'Promote'}
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
    $('#users-page-info').textContent = `Page ${data.page} of ${Math.ceil(data.total / data.limit)}`;
    $('#users-prev').disabled = data.page <= 1;
    $('#users-next').disabled = data.page * data.limit >= data.total;
  } catch (err) {
    if (err.message.includes('401') || err.message.includes('Unauthorized')) handleLogout();
    else usersTbody.innerHTML = `<tr><td colspan="4" style="color:var(--danger-color)">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function toggleRole(userId, currentRole) {
  const newRole = currentRole === 'admin' ? 'user' : 'admin';
  await api('PATCH', `/admin/users/${userId}`, { role: newRole });
  loadUsers();
}

async function deleteUser(userId) {
  if (!confirm('Delete this user? This cannot be undone.')) return;
  await api('DELETE', `/admin/users/${userId}`);
  loadUsers();
}

$('#users-prev').addEventListener('click', () => { state.usersPage = Math.max(1, state.usersPage - 1); loadUsers(); });
$('#users-next').addEventListener('click', () => { state.usersPage++; loadUsers(); });

// ── Create User Modal ──
$('#create-user-btn').addEventListener('click', () => {
  createUserModal.classList.add('active');
  $('#cu-error').textContent = '';
  lucide.createIcons();
});

$$('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById(btn.dataset.close).classList.remove('active');
  });
});

$('#create-user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#cu-email').value;
  const password = $('#cu-password').value;
  const role = $('#cu-role').value;
  try {
    await api('POST', '/admin/users', { email, passwordHash: password || undefined, role });
    createUserModal.classList.remove('active');
    $('#create-user-form').reset();
    loadUsers();
  } catch (err) {
    $('#cu-error').textContent = err.message;
  }
});

// ── Ideas ──
async function loadIdeas() {
  try {
    const data = await api('GET', `/admin/ideas?page=${state.ideasPage}&limit=20`);
    ideasTbody.innerHTML = data.ideas.map((idea) => {
      const scores = idea.scores && idea.scores.length ? idea.scores : [];
      const scoreVal = scores.length ? Math.round(scores[0].finalScore) : '—';
      const userEmail = idea.user ? idea.user.email || idea.user : '—';
      return `
        <tr>
          <td>${escapeHtml(idea.title)}</td>
          <td>${escapeHtml(userEmail)}</td>
          <td>${scoreVal}</td>
          <td><span class="pill">${idea.status}</span></td>
          <td>${new Date(idea.createdAt).toLocaleDateString()}</td>
          <td class="row-actions">
            <button class="btn btn-sm btn-secondary" onclick="rescoreIdea('${idea.id}')">Rescore</button>
            <button class="btn btn-sm btn-danger" onclick="deleteIdea('${idea.id}')">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
    $('#ideas-page-info').textContent = `Page ${data.page} of ${Math.ceil(data.total / data.limit)}`;
    $('#ideas-prev').disabled = data.page <= 1;
    $('#ideas-next').disabled = data.page * data.limit >= data.total;
  } catch (err) {
    if (err.message.includes('401') || err.message.includes('Unauthorized')) handleLogout();
    else ideasTbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger-color)">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function rescoreIdea(ideaId) {
  await api('POST', `/admin/ideas/${ideaId}/rescore`);
  loadIdeas();
}

async function deleteIdea(ideaId) {
  if (!confirm('Delete this idea?')) return;
  await api('DELETE', `/admin/ideas/${ideaId}`);
  loadIdeas();
}

$('#rescore-all-btn').addEventListener('click', async () => {
  if (!confirm('Rescore all ideas? This may take a moment.')) return;
  $('#rescore-all-btn').disabled = true;
  $('#rescore-all-btn').innerHTML = '<span class="spin">&#8635;</span> Rescoring...';
  try {
    const result = await api('POST', '/admin/rescore/all');
    loadIdeas();
    alert(`Rescored ${result.rescored} ideas.`);
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
  $('#rescore-all-btn').disabled = false;
  $('#rescore-all-btn').innerHTML = '<i data-lucide="rotate-cw"></i> Rescore All';
  lucide.createIcons();
});

$('#ideas-prev').addEventListener('click', () => { state.ideasPage = Math.max(1, state.ideasPage - 1); loadIdeas(); });
$('#ideas-next').addEventListener('click', () => { state.ideasPage++; loadIdeas(); });

// ── Settings ──
async function loadSettings() {
  try {
    const settings = await api('GET', '/admin/settings');
    if (!settings.length) {
      settingsList.innerHTML = '<p style="color:var(--text-muted)">No settings configured yet.</p>';
      return;
    }
    settingsList.innerHTML = '<table class="data"><thead><tr><th>Key</th><th>Value</th><th>Updated</th></tr></thead><tbody>' +
      settings.map((s) => `
        <tr>
          <td><code>${escapeHtml(s.key)}</code></td>
          <td><code>${escapeHtml(maskValue(s.value))}</code></td>
          <td>${new Date(s.updatedAt).toLocaleDateString()}</td>
        </tr>
      `).join('') + '</tbody></table>';
  } catch (err) {
    if (err.message.includes('401') || err.message.includes('Unauthorized')) handleLogout();
    else settingsList.innerHTML = `<p style="color:var(--danger-color)">${escapeHtml(err.message)}</p>`;
  }
}

function maskValue(val) {
  if (!val || val.length < 8) return val || '';
  return val.slice(0, 4) + '••••' + val.slice(-4);
}

$('#settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const key = $('#setting-key').value.trim();
  const value = $('#setting-value').value.trim();
  if (!key || !value) return;
  try {
    await api('PUT', '/admin/settings', { key, value });
    $('#setting-key').value = '';
    $('#setting-value').value = '';
    loadSettings();
  } catch (err) {
    alert(err.message);
  }
});

// ── Login form ──
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleLogin($('#login-email').value, $('#login-password').value);
});

logoutBtn.addEventListener('click', handleLogout);

// ── Helpers ──
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Bootstrap ──
if (state.token) {
  try {
    const payload = JSON.parse(atob(state.token.split('.')[1]));
    if (payload.role === 'admin') {
      state.user = payload;
      showDashboard();
    } else {
      handleLogout();
    }
  } catch {
    handleLogout();
  }
} else {
  loginScreen.style.display = '';
}
