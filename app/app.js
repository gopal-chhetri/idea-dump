/**
 * Idea Dump — Unified Client Application
 * Single SPA: landing when logged out, dashboard app-shell when authenticated.
 * Admins see extra sidebar items (Users / Ideas / Settings).
 */

// ── API Client ────────────────────────────────────────────────────────────────
class ApiClient {
  constructor(baseUrl = window.location.origin) {
    this.baseUrl = baseUrl;
    this.tokenKey = 'ip_access_token';
    this.refreshKey = 'ip_refresh_token';
    this.isOnline = false;
  }

  get token() { return localStorage.getItem(this.tokenKey); }
  get refreshToken() { return localStorage.getItem(this.refreshKey); }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.refreshKey, refreshToken);
  }

  clearTokens() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
  }

  async checkConnection() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      this.isOnline = res.ok;
    } catch {
      this.isOnline = false;
    }
    return this.isOnline;
  }

  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    let response = await fetch(`${this.baseUrl}${path}`, { ...options, headers });

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this._attemptRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.token}`;
        response = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
      }
    }

    let payload;
    try { payload = await response.json(); } catch { payload = {}; }

    if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
    return payload.data ?? payload;
  }

  async uploadFile(path, file) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    let response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this._attemptRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.token}`;
        response = await fetch(`${this.baseUrl}${path}`, {
          method: 'POST',
          headers,
          body: formData,
        });
      }
    }

    let payload;
    try { payload = await response.json(); } catch { payload = {}; }

    if (!response.ok) throw new Error(payload.message || `Upload failed (${response.status})`);
    return payload.data ?? payload;
  }

  async _attemptRefresh() {
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
      if (res.ok) {
        const data = await res.json();
        this.setTokens(data.accessToken || data.data?.accessToken, data.refreshToken || data.data?.refreshToken);
        return true;
      }
    } catch { /* silent */ }
    this.clearTokens();
    return false;
  }
}

// ── Decode JWT payload ──
function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function statusValue(status) {
  if (!status) return 'draft';
  return typeof status === 'string' ? status : status.value;
}

const STATUS_ORDER = ['draft', 'in_progress', 'completed', 'archived'];
const STATUS_LABELS = {
  draft: 'Draft',
  in_progress: 'In Progress',
  completed: 'Completed',
  archived: 'Archived',
};

// ── Local Scoring Engine (mirrors backend RuleBasedScoringStrategy) ───────────
class LocalScoringEngine {
  static tokenize(text) {
    return new Set(
      String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 1)
    );
  }

  static scoreIdea(idea, skills, allIdeas) {
    const fitScore = this._fitScore(idea, skills);
    const effortScore = this._effortScore(idea);
    const noveltyScore = this._noveltyScore(idea, allIdeas);
    const finalScore = Math.round((0.5 * fitScore + 0.3 * (100 - effortScore) + 0.2 * noveltyScore) * 10) / 10;
    return { fitScore, effortScore, noveltyScore, finalScore };
  }

  static _fitScore(idea, skills) {
    if (!skills.length) return 50;
    const ideaText = [idea.description, ...(idea.features || []), idea.useCase].join(' ');
    const ideaTokens = this.tokenize(ideaText);
    if (!ideaTokens.size) return 0;
    let matched = 0, total = 0;
    for (const s of skills) {
      total += s.weight;
      const st = this.tokenize(s.name);
      if ([...st].some(t => ideaTokens.has(t))) matched += s.weight;
    }
    return total ? Math.round((matched / total) * 100) : 50;
  }

  static _effortScore(idea) {
    const fp = Math.min((idea.features?.length || 0) * 10, 60);
    const lp = Math.min(Math.floor((idea.description?.length || 0) / 50), 40);
    return Math.max(0, 100 - fp - lp);
  }

  static _noveltyScore(idea, allIdeas) {
    const others = allIdeas.filter(i => i.id !== idea.id);
    if (!others.length) return 100;
    const ideaTokens = this.tokenize(
      [idea.title, idea.description, ...(idea.features || []), idea.useCase].join(' ')
    );
    if (!ideaTokens.size) return 100;
    let totalDist = 0;
    for (const o of others) {
      const ot = this.tokenize([o.title, o.description, ...(o.features || []), o.useCase].join(' '));
      const intersection = [...ideaTokens].filter(t => ot.has(t)).length;
      const union = new Set([...ideaTokens, ...ot]).size;
      totalDist += union > 0 ? 1 - (intersection / union) : 1;
    }
    return Math.round((totalDist / others.length) * 100);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function renderSkeletons(count = 3) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skel skel-title"></div>
      <div class="skel skel-body"></div>
      <div class="skel skel-bars"></div>
    </div>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById(name);
  if (view) view.classList.add('active');
}

// ── Application ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const api = new ApiClient();

  let state = {
    isAuthenticated: false,
    role: null,
    email: null,
    profile: { summaryText: '', skills: [] },
    ideas: [],
    quota: { count: 0, limit: 2 },
    currentPage: 'my-backlog',
    admin: { usersPage: 1, ideasPage: 1 },
  };

  // ── Theme Toggle ──────────────────────────────────────────────────────
  function getPreferredTheme() {
    const stored = localStorage.getItem('id_theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('id_theme', theme);
  }

  function toggleTheme() {
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  function wireThemeToggles() {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', toggleTheme);
    });
  }

  setTheme(getPreferredTheme());

  const $ = id => document.getElementById(id);
  const authCheck = $('auth-check');
  const landingView = $('landing-view');
  const dashboardView = $('dashboard-view');
  const sidebar = $('sidebar');
  const sidebarOverlay = $('sidebar-overlay');
  const mobileMenuToggle = $('mobile-menu-toggle');
  const sidebarLogout = $('sidebar-logout');
  const connectionBadge = $('connection-badge');
  const authBtn = $('auth-btn');
  const authModal = $('auth-modal');
  const skillModal = $('skill-modal');
  const rankModal = $('rank-modal');
  const adminUserModal = $('admin-user-modal');
  const cvSummaryInput = $('cv-summary');
  const saveSummaryBtn = $('save-summary-btn');
  const skillsList = $('skills-list');
  const ideaForm = $('idea-form');
  const ideasStack = $('ideas-stack');
  const addSkillTrigger = $('add-skill-trigger');
  const quotaDisplay = $('quota-display');
  const rescoreAllBtn = $('rescore-all-btn');
  const skillForm = $('skill-form');
  const rankForm = $('rank-form');
  const authForm = $('auth-form');
  const cvFileInput = $('cv-file-input');
  const cvUploadZone = $('cv-upload-zone');
  const cvUploadStatus = $('cv-upload-status');

  // ── View switching ──────────────────────────────────────────────────────
  function showLanding() {
    showView('landing-view');
  }

  function showDashboard() {
    showView('dashboard-view');
    showPage('my-backlog');
  }

  // ── Page switching (sidebar nav) ──
  function showPage(name) {
    state.currentPage = name;
    document.querySelectorAll('.page').forEach(p =>
      p.classList.toggle('active', p.id === `page-${name}`));
    document.querySelectorAll('.nav-item').forEach(t =>
      t.classList.toggle('active', t.dataset.view === name));

    if (name === 'admin-users') { loadAdminStats(); loadAdminUsers(); }
    if (name === 'admin-ideas') { loadAdminStats(); loadAdminIdeas(); }
    if (name === 'admin-settings') loadAdminSettings();
  }

  // ── Role gating ──
  function applyRoleGating() {
    const isAdmin = state.role === 'admin';
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = isAdmin ? '' : 'none';
    });
    if (!isAdmin && state.currentPage && $(`page-${state.currentPage}`)?.classList.contains('admin-only')) {
      showPage('my-backlog');
    }
  }

  function populateUserPill() {
    const email = state.email || (state.role || 'user');
    const name = email.split('@')[0];
    $('sidebar-name').textContent = email;
    $('sidebar-role').textContent = state.role || 'user';
    $('sidebar-avatar').textContent = (name[0] || 'U').toUpperCase();
  }

  // ── OAuth token pickup from URL (redirect flow) ──────────────────────────
  (function consumeOAuthParams() {
    const params = new URLSearchParams(window.location.search);
    const at = params.get('accessToken');
    const rt = params.get('refreshToken');
    if (at && rt) {
      api.setTokens(at, rt);
      window.history.replaceState({}, '', window.location.pathname);
    }
  })();

  // ── Bootstrap: check token and role ──────────────────────────────────────
  async function bootstrap() {
    const token = api.token;
    if (token) {
      const payload = decodeToken(token);
      if (payload && payload.role) {
        state.isAuthenticated = true;
        state.role = payload.role;
        state.email = payload.email || null;
        authCheck.style.display = 'none';
        populateUserPill();
        showDashboard();
        applyRoleGating();
        await syncApp();
        return;
      }
    }
    authCheck.style.display = 'none';
    showLanding();
  }

  // ── Sync pipeline ────────────────────────────────────────────────────────
  async function syncApp() {
    const online = await api.checkConnection();
    updateConnectionBadge(online);

    if (online && api.token) {
      state.isAuthenticated = true;
      authBtn.innerHTML = '<i class="ph ph-sign-out"></i> Log Out';
      if (state.currentPage === 'my-backlog') {
        ideasStack.innerHTML = renderSkeletons(3);
        PhosphorIcons.render();
      }
      try {
        const [profile, ideas] = await Promise.all([
          api.request('/cv-profile').catch(() => null),
          api.request('/ideas').catch(() => []),
        ]);
        state.profile = profile || { summaryText: '', skills: [] };
        state.ideas = Array.isArray(ideas) ? ideas : [];
      } catch (err) {
        console.error('Backend sync error:', err);
        showToast('Sync failed — showing local data', 'warning');
      }
    } else {
      state.isAuthenticated = online && !!api.token;
      if (!api.token) {
        authBtn.innerHTML = '<i class="ph ph-key"></i> Authenticate';
      }
    }

    renderUi();
  }

  function updateConnectionBadge(online) {
    connectionBadge.className = `badge ${online ? 'badge-online' : 'badge-offline'}`;
    connectionBadge.querySelector('.label').textContent = online ? 'Engine Connected' : 'Mock Mode (Local)';
    rescoreAllBtn.style.display = online ? 'inline-flex' : 'none';
  }

  // ── Render ───────────────────────────────────────────────────────────────
  function renderUi() {
    cvSummaryInput.value = state.profile.summaryText || '';
    renderSkillsList();
    renderQuota();
    renderIdeas();
    PhosphorIcons.render();
  }

  function renderSkillsList() {
    const skills = state.profile.skills || [];
    if (!skills.length) {
      skillsList.innerHTML = `
        <div class="empty-state" style="padding: 1.5rem; border: none;">
          <p>No skills added yet. Define your profile to calibrate the scoring engine.</p>
        </div>`;
      return;
    }
    skillsList.innerHTML = skills.map(skill => `
      <div class="skill-tag">
        <div class="skill-info">
          <span class="skill-name">${escapeHtml(skill.name)}</span>
          <span class="skill-meta">${escapeHtml(skill.category)}</span>
        </div>
        <div class="skill-weight-dots" title="Relevance: ${skill.weight}/5">
          ${[1, 2, 3, 4, 5].map(i => `<span class="dot ${i <= skill.weight ? 'active' : ''}"></span>`).join('')}
        </div>
        <button class="btn-close delete-skill-btn" data-id="${escapeHtml(skill.id)}" title="Remove skill">×</button>
      </div>
    `).join('');

    skillsList.querySelectorAll('.delete-skill-btn').forEach(btn => {
      btn.addEventListener('click', e => deleteSkill(e.currentTarget.dataset.id));
    });
  }

  function renderQuota() {
    const left = Math.max(0, state.quota.limit - state.quota.count);
    quotaDisplay.textContent = `${left} / ${state.quota.limit} ideas today`;
    quotaDisplay.style.color = left === 0 ? 'var(--danger-color)' : '';
  }

  function renderIdeas() {
    const sorted = [...state.ideas].sort((a, b) => {
      const ap = a.rankOverride?.pinned ? 1 : 0, bp = b.rankOverride?.pinned ? 1 : 0;
      if (bp !== ap) return bp - ap;
      const ar = a.rankOverride?.manualRank ?? Infinity, br = b.rankOverride?.manualRank ?? Infinity;
      if (ar !== br) return ar - br;
      return (b.scores?.[0]?.finalScore ?? 0) - (a.scores?.[0]?.finalScore ?? 0);
    });

    if (!sorted.length) {
      ideasStack.innerHTML = `
        <div class="empty-state">
          <i class="ph ph-inbox"></i>
          <h3>No ideas captured</h3>
          <p>Submit your first project idea above — the engine will score and rank it instantly.</p>
        </div>`;
      return;
    }

    // Group by status
    const groups = {};
    for (const s of STATUS_ORDER) groups[s] = [];
    for (const idea of sorted) {
      const sv = statusValue(idea.status);
      (groups[sv] || (groups[sv] = [])).push(idea);
    }

    ideasStack.innerHTML = STATUS_ORDER.map(sv => {
      const list = groups[sv] || [];
      const cards = list.length ? list.map(renderIdeaCard).join('') : `
        <div class="group-empty">No ideas in ${STATUS_LABELS[sv]}.</div>`;
      return `
        <div class="status-group">
          <div class="status-group-head">
            <span class="badge badge-status status-${sv}">${STATUS_LABELS[sv]}</span>
            <span class="status-count">${list.length}</span>
          </div>
          <div class="stack-layout">${cards}</div>
        </div>`;
    }).join('');

    ideasStack.querySelectorAll('.delete-idea-btn').forEach(btn =>
      btn.addEventListener('click', e => deleteIdea(e.currentTarget.dataset.id)));
    ideasStack.querySelectorAll('.rescore-idea-btn').forEach(btn =>
      btn.addEventListener('click', e => rescoreIdea(e.currentTarget.dataset.id)));
    ideasStack.querySelectorAll('.rank-idea-btn').forEach(btn =>
      btn.addEventListener('click', e => {
        const b = e.currentTarget;
        openRankModal(b.dataset.id, b.dataset.pinned === 'true', b.dataset.rank);
      }));
    ideasStack.querySelectorAll('.status-change-select').forEach(sel =>
      sel.addEventListener('change', e =>
        changeIdeaStatus(e.currentTarget.dataset.id, e.currentTarget.value)));
  }

  function renderIdeaCard(idea) {
    const s = idea.scores?.[0] || {};
    const score = s.finalScore ?? 0;
    const features = idea.features || [];
    const isPinned = idea.rankOverride?.pinned;
    const rank = idea.rankOverride?.manualRank;

    return `
    <article class="card idea-card ${isPinned ? 'pinned' : ''}" data-id="${escapeHtml(idea.id)}">
      <div class="card-body">
        <div class="idea-card-header">
          <div class="idea-title-block">
            <h3>${escapeHtml(idea.title)}</h3>
            <div class="idea-badges">
              <span class="badge badge-status">${escapeHtml(STATUS_LABELS[statusValue(idea.status)] || statusValue(idea.status))}</span>
              ${isPinned ? `<span class="badge badge-pinned"><i class="ph ph-pin"></i> Pinned</span>` : ''}
              ${rank ? `<span class="badge badge-pinned">Force #${rank}</span>` : ''}
            </div>
          </div>
          <div class="score-badge-circle" title="Fit×0.5 + (100−Effort)×0.3 + Novelty×0.2">
            <span class="score-value">${score}</span>
            <span class="score-lbl">Score</span>
          </div>
        </div>

        <p class="idea-desc-text">${escapeHtml(idea.description)}</p>

        ${features.length ? `
        <div class="features-list">
          ${features.map(f => `<span class="feature-tag">${escapeHtml(f)}</span>`).join('')}
        </div>` : ''}

        <div class="idea-metrics-bar">
          <div class="metric-item">
            <span class="metric-label">CV Fit — ${s.fitScore ?? 0}%</span>
            <div class="metric-bar-bg"><div class="metric-bar-fill" style="width:${s.fitScore ?? 0}%"></div></div>
          </div>
          <div class="metric-item">
            <span class="metric-label">Ease — ${100 - (s.effortScore ?? 0)}%</span>
            <div class="metric-bar-bg"><div class="metric-bar-fill" style="width:${100 - (s.effortScore ?? 0)}%"></div></div>
          </div>
          <div class="metric-item">
            <span class="metric-label">Novelty — ${s.noveltyScore ?? 0}%</span>
            <div class="metric-bar-bg"><div class="metric-bar-fill" style="width:${s.noveltyScore ?? 0}%"></div></div>
          </div>
        </div>

        <div class="idea-actions">
          <select class="status-change-select" data-id="${escapeHtml(idea.id)}">
            ${STATUS_ORDER.map(sv => `<option value="${sv}" ${sv === statusValue(idea.status) ? 'selected' : ''}>${STATUS_LABELS[sv]}</option>`).join('')}
          </select>
          <button class="btn btn-secondary btn-sm rank-idea-btn"
            data-id="${escapeHtml(idea.id)}"
            data-pinned="${isPinned ? 'true' : 'false'}"
            data-rank="${rank ?? ''}">
            <i class="ph ph-sliders"></i> Force Order
          </button>
          ${api.isOnline ? `
          <button class="btn btn-secondary btn-sm rescore-idea-btn" data-id="${escapeHtml(idea.id)}">
            <i class="ph ph-arrow-clockwise"></i> Rescore
          </button>` : ''}
          <button class="btn btn-danger btn-sm delete-idea-btn" data-id="${escapeHtml(idea.id)}">
            <i class="ph ph-trash"></i>
          </button>
        </div>
      </div>
    </article>`;
  }

  // ── Operations ───────────────────────────────────────────────────────────
  async function deleteSkill(id) {
    if (api.isOnline && api.token) {
      try { await api.request(`/cv-profile/skills/${id}`, { method: 'DELETE' }); }
      catch (err) { showToast(err.message, 'error'); return; }
    }
    await syncApp();
  }

  async function deleteIdea(id) {
    if (!confirm('Remove this idea from your backlog?')) return;
    if (api.isOnline && api.token) {
      try { await api.request(`/ideas/${id}`, { method: 'DELETE' }); }
      catch (err) { showToast(err.message, 'error'); return; }
    }
    await syncApp();
  }

  async function rescoreIdea(id) {
    try {
      await api.request(`/ideas/${id}/rescore`, { method: 'POST' });
      await syncApp();
      showToast('Idea rescored', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function changeIdeaStatus(id, status) {
    try {
      await api.request(`/ideas/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await syncApp();
      showToast(`Status set to ${STATUS_LABELS[status] || status}`, 'success');
    } catch (err) { showToast(err.message, 'error'); }
  }

  // ── Form Handlers ────────────────────────────────────────────────────────
  saveSummaryBtn.addEventListener('click', async () => {
    const text = cvSummaryInput.value;
    if (api.isOnline && api.token) {
      try { await api.request('/cv-profile', { method: 'PUT', body: JSON.stringify({ summaryText: text }) }); }
      catch (err) { showToast(err.message, 'error'); return; }
    }
    showToast('Profile summary saved', 'success');
    await syncApp();
  });

  // ── CV File Upload ─────────────────────────────────────────────────────
  function handleCvFile(file) {
    if (!file) return;
    const validTypes = ['application/pdf', 'text/plain'];
    const validExt = /\.(pdf|txt)$/i;
    if (!validTypes.includes(file.type) && !validExt.test(file.name)) {
      showToast('Please upload a PDF or TXT file.', 'error');
      return;
    }
    cvUploadStatus.textContent = `Uploading ${file.name}…`;
    cvUploadStatus.className = 'upload-status uploading';
    api.uploadFile('/cv-profile/upload', file)
      .then(result => {
        cvUploadStatus.textContent = `Imported: summary extracted, ${result.skillsAdded} new skills added.`;
        cvUploadStatus.className = 'upload-status success';
        showToast(`CV parsed — ${result.skillsAdded} skills imported`, 'success');
        return syncApp();
      })
      .catch(err => {
        cvUploadStatus.textContent = err.message;
        cvUploadStatus.className = 'upload-status error';
        showToast(err.message, 'error');
      });
  }

  cvFileInput.addEventListener('change', e => {
    if (e.target.files.length) handleCvFile(e.target.files[0]);
    e.target.value = '';
  });

  cvUploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    cvUploadZone.classList.add('drag-over');
  });
  cvUploadZone.addEventListener('dragleave', e => {
    e.preventDefault();
    cvUploadZone.classList.remove('drag-over');
  });
  cvUploadZone.addEventListener('drop', e => {
    e.preventDefault();
    cvUploadZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleCvFile(e.dataTransfer.files[0]);
  });

  ideaForm.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = ideaForm.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="ph ph-spinner spin"></span> Scoring…';
    PhosphorIcons.render();

    const title = $('idea-title').value.trim();
    const desc = $('idea-desc').value.trim();
    const useCase = $('idea-usecase').value.trim();
    const status = $('idea-status').value;
    const features = $('idea-features').value
      .split(',').map(s => s.trim()).filter(Boolean);

    try {
      if (api.isOnline && api.token) {
        await api.request('/ideas', {
          method: 'POST',
          body: JSON.stringify({ title, description: desc, useCase, status, features }),
        });
      }
      ideaForm.reset();
      showToast('Idea captured and scored!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="ph ph-plus-circle"></i> Submit & Score Idea';
      PhosphorIcons.render();
    }

    await syncApp();
  });

  rescoreAllBtn.addEventListener('click', async () => {
    rescoreAllBtn.disabled = true;
    try {
      await Promise.all(state.ideas.map(i => api.request(`/ideas/${i.id}/rescore`, { method: 'POST' })));
      await syncApp();
      showToast('All ideas rescored', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      rescoreAllBtn.disabled = false;
    }
  });

  skillForm.addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('skill-name').value.trim();
    const category = $('skill-category').value;
    const weight = parseInt($('skill-weight').value, 10);

    if (api.isOnline && api.token) {
      try { await api.request('/cv-profile/skills', { method: 'POST', body: JSON.stringify({ name, category, weight }) }); }
      catch (err) { showToast(err.message, 'error'); return; }
    }
    closeModals();
    showToast(`"${name}" added to profile`, 'success');
    await syncApp();
  });

  rankForm.addEventListener('submit', async e => {
    e.preventDefault();
    const id = $('rank-idea-id').value;
    const pinned = $('rank-pinned').checked;
    const rawRank = $('rank-manual').value;
    const manualRank = rawRank ? parseInt(rawRank, 10) : undefined;

    if (api.isOnline && api.token) {
      try { await api.request(`/ideas/${id}/rank`, { method: 'PATCH', body: JSON.stringify({ pinned, manualRank }) }); }
      catch (err) { showToast(err.message, 'error'); return; }
    }
    closeModals();
    showToast('Ordering override applied', 'success');
    await syncApp();
  });

  $('clear-rank-btn').addEventListener('click', async () => {
    const id = $('rank-idea-id').value;
    if (api.isOnline && api.token) {
      try { await api.request(`/ideas/${id}/rank`, { method: 'DELETE' }); }
      catch (err) { showToast(err.message, 'error'); return; }
    }
    closeModals();
    showToast('Rank override cleared', 'success');
    await syncApp();
  });

  // ── Auth ─────────────────────────────────────────────────────────────────
  let authMode = 'login';
  const tabLogin = $('tab-login');
  const tabRegister = $('tab-register');
  const authSubmitBtn = $('auth-submit-btn');
  const authTitle = $('auth-modal-title');

  tabLogin.addEventListener('click', () => {
    authMode = 'login';
    tabLogin.classList.add('active'); tabRegister.classList.remove('active');
    authTitle.textContent = 'Sign In to Engine';
    authSubmitBtn.textContent = 'Sign In';
  });
  tabRegister.addEventListener('click', () => {
    authMode = 'register';
    tabRegister.classList.add('active'); tabLogin.classList.remove('active');
    authTitle.textContent = 'Create Account';
    authSubmitBtn.textContent = 'Register';
  });

  function handleAuthClick() {
    if (state.isAuthenticated) {
      api.clearTokens();
      state.isAuthenticated = false;
      state.role = null;
      state.email = null;
      showToast('Signed out', 'success');
      showLanding();
    } else {
      openModal(authModal);
    }
  }

  // Wire landing page auth buttons
  $('landing-auth-btn').addEventListener('click', () => openModal(authModal));
  $('landing-cta-btn').addEventListener('click', () => openModal(authModal));
  $('landing-footer-cta').addEventListener('click', () => openModal(authModal));

  authBtn.addEventListener('click', handleAuthClick);
  sidebarLogout.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    handleAuthClick();
  });

  authForm.addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('auth-email').value;
    const password = $('auth-password').value;
    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const data = await api.request(path, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      api.setTokens(data.accessToken, data.refreshToken);

      const payload = decodeToken(data.accessToken);
      state.isAuthenticated = true;
      state.role = payload?.role || 'user';
      state.email = payload?.email || email;

      closeModals();
      authBtn.innerHTML = '<i class="ph ph-sign-out"></i> Log Out';
      populateUserPill();
      showToast('Authenticated successfully', 'success');
      showDashboard();
      applyRoleGating();
      await syncApp();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // OAuth redirect buttons
  $('google-auth-btn').addEventListener('click', () => {
    window.location.href = `${api.baseUrl}/auth/google`;
  });
  $('github-auth-btn').addEventListener('click', () => {
    window.location.href = `${api.baseUrl}/auth/github`;
  });

  // ── Sidebar nav + mobile drawer ─────────────────────────────────────────
  document.querySelectorAll('.nav-item').forEach(tab =>
    tab.addEventListener('click', e => {
      e.preventDefault();
      showPage(tab.dataset.view);
      sidebar.classList.remove('open');
      sidebarOverlay.classList.remove('active');
    }));

  mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('active');
  });
  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
  });

  // ── Admin: Stats ──
  async function loadAdminStats() {
    try {
      const stats = await api.request('/admin/stats');
      if ($('stat-users')) $('stat-users').textContent = stats.userCount;
      if ($('stat-admins')) $('stat-admins').textContent = stats.adminCount;
      if ($('stat-ideas')) $('stat-ideas').textContent = stats.ideaCount;
    } catch (err) {
      if (isUnauthorized(err)) handleAuthClick();
    }
  }

  // ── Admin: Users ──
  async function loadAdminUsers() {
    const tbody = $('admin-users-tbody');
    try {
      const data = await api.request(`/admin/users?page=${state.admin.usersPage}&limit=20`);
      tbody.innerHTML = data.users.map(u => `
        <tr>
          <td>${escapeHtml(u.email)}</td>
          <td class="hide-mobile">${new Date(u.createdAt).toLocaleDateString()}</td>
          <td><span class="pill ${u.role === 'admin' ? 'pill-admin' : 'pill-user'}">${escapeHtml(u.role)}</span></td>
          <td class="row-actions">
            <button class="btn btn-sm btn-secondary" onclick="window.__app.toggleRole('${u.id}','${u.role}')">
              ${u.role === 'admin' ? 'Demote' : 'Promote'}
            </button>
            <button class="btn btn-sm btn-danger" onclick="window.__app.deleteUser('${u.id}')">Delete</button>
          </td>
        </tr>
      `).join('');
      $('admin-users-page').textContent = `Page ${data.page} of ${Math.ceil(data.total / data.limit)}`;
      $('admin-users-prev').disabled = data.page <= 1;
      $('admin-users-next').disabled = data.page * data.limit >= data.total;
    } catch (err) {
      if (isUnauthorized(err)) handleAuthClick();
      else tbody.innerHTML = `<tr><td colspan="4" style="color:var(--danger-color)">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  async function toggleRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.request(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) });
      loadAdminUsers();
    } catch (err) { showToast(err.message, 'error'); }
  }

  async function deleteUser(userId) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.request(`/admin/users/${userId}`, { method: 'DELETE' });
      loadAdminUsers();
    } catch (err) { showToast(err.message, 'error'); }
  }

  $('admin-users-prev').addEventListener('click', () => { state.admin.usersPage = Math.max(1, state.admin.usersPage - 1); loadAdminUsers(); });
  $('admin-users-next').addEventListener('click', () => { state.admin.usersPage++; loadAdminUsers(); });

  // ── Admin: Create User ──
  $('admin-create-user-btn').addEventListener('click', () => {
    adminUserModal.classList.add('active');
    $('admin-user-error').textContent = '';
    PhosphorIcons.render();
  });
  $('admin-user-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('admin-user-email').value;
    const password = $('admin-user-password').value;
    const role = $('admin-user-role').value;
    try {
      await api.request('/admin/users', { method: 'POST', body: JSON.stringify({ email, passwordHash: password || undefined, role }) });
      adminUserModal.classList.remove('active');
      $('admin-user-form').reset();
      loadAdminUsers();
    } catch (err) {
      $('admin-user-error').textContent = err.message;
    }
  });

  // ── Admin: Ideas ──
  async function loadAdminIdeas() {
    const tbody = $('admin-ideas-tbody');
    try {
      const data = await api.request(`/admin/ideas?page=${state.admin.ideasPage}&limit=20`);
      tbody.innerHTML = data.ideas.map(idea => {
        const scores = idea.scores && idea.scores.length ? idea.scores : [];
        const scoreVal = scores.length ? Math.round(scores[0].finalScore) : '—';
        const userEmail = idea.user ? idea.user.email : '—';
        return `
          <tr>
            <td>${escapeHtml(idea.title)}</td>
            <td class="hide-mobile">${escapeHtml(userEmail)}</td>
            <td>${scoreVal}</td>
            <td><span class="pill">${escapeHtml(statusValue(idea.status))}</span></td>
            <td class="hide-mobile">${new Date(idea.createdAt).toLocaleDateString()}</td>
            <td class="row-actions">
              <button class="btn btn-sm btn-secondary" onclick="window.__app.rescoreAdminIdea('${idea.id}')">Rescore</button>
              <button class="btn btn-sm btn-danger" onclick="window.__app.deleteAdminIdea('${idea.id}')">Delete</button>
            </td>
          </tr>`;
      }).join('');
      $('admin-ideas-page').textContent = `Page ${data.page} of ${Math.ceil(data.total / data.limit)}`;
      $('admin-ideas-prev').disabled = data.page <= 1;
      $('admin-ideas-next').disabled = data.page * data.limit >= data.total;
    } catch (err) {
      if (isUnauthorized(err)) handleAuthClick();
      else tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger-color)">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  async function rescoreAdminIdea(ideaId) {
    try { await api.request(`/admin/ideas/${ideaId}/rescore`, { method: 'POST' }); loadAdminIdeas(); }
    catch (err) { showToast(err.message, 'error'); }
  }
  async function deleteAdminIdea(ideaId) {
    if (!confirm('Delete this idea?')) return;
    try { await api.request(`/admin/ideas/${ideaId}`, { method: 'DELETE' }); loadAdminIdeas(); }
    catch (err) { showToast(err.message, 'error'); }
  }
  $('admin-ideas-prev').addEventListener('click', () => { state.admin.ideasPage = Math.max(1, state.admin.ideasPage - 1); loadAdminIdeas(); });
  $('admin-ideas-next').addEventListener('click', () => { state.admin.ideasPage++; loadAdminIdeas(); });
  $('admin-rescore-all-btn').addEventListener('click', async () => {
    if (!confirm('Rescore all ideas? This may take a moment.')) return;
    try {
      const result = await api.request('/admin/rescore/all', { method: 'POST' });
      loadAdminIdeas();
      showToast(`Rescored ${result.rescored} ideas.`, 'success');
    } catch (err) { showToast(err.message, 'error'); }
  });

  // ── Admin: Settings ──
  async function loadAdminSettings() {
    const list = $('admin-settings-list');
    try {
      const settings = await api.request('/admin/settings');
      if (!settings.length) {
        list.innerHTML = '<p style="color:var(--text-secondary)">No settings configured yet.</p>';
        return;
      }
      list.innerHTML = '<table class="data"><thead><tr><th>Key</th><th>Value</th><th>Updated</th></tr></thead><tbody>' +
        settings.map(s => `
          <tr>
            <td><code>${escapeHtml(s.key)}</code></td>
            <td><code>${escapeHtml(maskValue(s.value))}</code></td>
            <td>${new Date(s.updatedAt).toLocaleDateString()}</td>
          </tr>
        `).join('') + '</tbody></table>';
    } catch (err) {
      if (isUnauthorized(err)) handleAuthClick();
      else list.innerHTML = `<p style="color:var(--danger-color)">${escapeHtml(err.message)}</p>`;
    }
  }
  function maskValue(val) {
    if (!val || val.length < 8) return val || '';
    return val.slice(0, 4) + '••••' + val.slice(-4);
  }
  $('admin-settings-form').addEventListener('submit', async e => {
    e.preventDefault();
    const key = $('admin-setting-key').value.trim();
    const value = $('admin-setting-value').value.trim();
    if (!key || !value) return;
    try {
      await api.request('/admin/settings', { method: 'PUT', body: JSON.stringify({ key, value }) });
      $('admin-setting-key').value = '';
      $('admin-setting-value').value = '';
      loadAdminSettings();
    } catch (err) { showToast(err.message, 'error'); }
  });

  function isUnauthorized(err) {
    return err.message && (err.message.includes('401') || err.message.includes('Unauthorized'));
  }

  // ── Modals ───────────────────────────────────────────────────────────────
  function openModal(modal) { modal.classList.add('active'); }
  function closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    skillForm.reset();
    rankForm.reset();
    $('skill-weight-bubble').textContent = '3';
  }

  addSkillTrigger.addEventListener('click', () => openModal(skillModal));
  document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeModals));
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModals(); });
  });

  function openRankModal(id, pinned, rank) {
    $('rank-idea-id').value = id;
    $('rank-pinned').checked = pinned;
    $('rank-manual').value = rank || '';
    openModal(rankModal);
  }

  const weightSlider = $('skill-weight');
  const weightBubble = $('skill-weight-bubble');
  weightSlider.addEventListener('input', e => { weightBubble.textContent = e.target.value; });

  // ── Toast Notifications ──────────────────────────────────────────────────
  function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
      toast.classList.remove('visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3500);
  }

  // Expose admin handlers used by inline onclick attributes
  window.__app = { toggleRole, deleteUser, rescoreAdminIdea, deleteAdminIdea };

  // ── Start ──
  wireThemeToggles();
  bootstrap();
});
