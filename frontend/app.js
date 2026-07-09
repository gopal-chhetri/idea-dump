/**
 * Idea Dump — Client Application
 * Dual-mode: landing page when logged out, dashboard when authenticated.
 * Admin users are redirected to /admin/.
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

// ── Offline Mock DB (localStorage) ───────────────────────────────────────────
class MockDatabase {
  constructor() { this.prefix = 'ip_mock_'; }
  get(key, def = null) {
    const v = localStorage.getItem(this.prefix + key);
    return v ? JSON.parse(v) : def;
  }
  set(key, val) { localStorage.setItem(this.prefix + key, JSON.stringify(val)); }
}

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
  const db = new MockDatabase();

  let state = {
    isAuthenticated: false,
    profile: { summaryText: '', skills: [] },
    ideas: [],
    quota: { count: 0, limit: 2 },
  };

  // DOM refs
  const $ = id => document.getElementById(id);
  const authCheck = $('auth-check');
  const landingView = $('landing-view');
  const dashboardView = $('dashboard-view');
  const connectionBadge = $('connection-badge');
  const authBtn = $('auth-btn');
  const authModal = $('auth-modal');
  const skillModal = $('skill-modal');
  const rankModal = $('rank-modal');
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

  // ── View switching ──────────────────────────────────────────────────────
  function showLanding() {
    showView('landing-view');
  }

  function showDashboard() {
    showView('dashboard-view');
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
      if (payload) {
        // Admin → redirect
        if (payload.role === 'admin') {
          window.location.href = '/admin/';
          return;
        }
        // User → show dashboard
        state.isAuthenticated = true;
        authCheck.style.display = 'none';
        showDashboard();
        await syncApp();
        return;
      }
    }
    // No valid token → show landing
    authCheck.style.display = 'none';
    showLanding();
  }

  // ── Sync pipeline ────────────────────────────────────────────────────────
  async function syncApp() {
    const online = await api.checkConnection();
    updateConnectionBadge(online);

    if (online && api.token) {
      state.isAuthenticated = true;
      authBtn.innerHTML = '<i data-lucide="log-out"></i> Log Out';
      ideasStack.innerHTML = renderSkeletons(3);
      lucide.createIcons();
      try {
        const [profile, ideas] = await Promise.all([
          api.request('/cv-profile').catch(() => null),
          api.request('/ideas').catch(() => []),
        ]);
        state.profile = profile || { summaryText: '', skills: [] };
        state.ideas = Array.isArray(ideas) ? ideas : [];
      } catch (err) {
        console.error('Backend sync error:', err);
        loadMockState();
        showToast('Sync failed — showing local data', 'warning');
      }
    } else {
      state.isAuthenticated = online && !!api.token;
      if (!api.token) {
        authBtn.innerHTML = '<i data-lucide="key-round"></i> Authenticate';
      }
      loadMockState();
    }

    renderUi();
  }

  function loadMockState() {
    state.profile.summaryText = db.get('summary', '');
    state.profile.skills = db.get('skills', []);
    state.ideas = db.get('ideas', []);
    state.quota.count = db.get('quota_count', 0);
  }

  function saveMockState() {
    db.set('summary', state.profile.summaryText);
    db.set('skills', state.profile.skills);
    db.set('ideas', state.ideas);
    db.set('quota_count', state.quota.count);
  }

  function updateConnectionBadge(online) {
    if (online) {
      connectionBadge.className = 'badge badge-online';
      connectionBadge.querySelector('.label').textContent = 'Engine Connected';
      rescoreAllBtn.style.display = 'inline-flex';
    } else {
      connectionBadge.className = 'badge badge-offline';
      connectionBadge.querySelector('.label').textContent = 'Mock Mode (Local)';
      rescoreAllBtn.style.display = 'none';
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  function renderUi() {
    cvSummaryInput.value = state.profile.summaryText || '';
    renderSkillsList();
    renderQuota();
    renderIdeas();
    lucide.createIcons();
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
          <i data-lucide="inbox" class="icon-lg"></i>
          <h3>No ideas captured</h3>
          <p>Submit your first project idea above — the engine will score and rank it instantly.</p>
        </div>`;
      return;
    }

    ideasStack.innerHTML = sorted.map(idea => {
      const s = idea.scores?.[0] || {};
      const score = s.finalScore ?? 0;
      const features = idea.features || [];
      const isPinned = idea.rankOverride?.pinned;
      const rank = idea.rankOverride?.manualRank;
      const scorePct = Math.min(100, Math.max(0, score));

      return `
      <article class="card idea-card ${isPinned ? 'pinned' : ''}" data-id="${escapeHtml(idea.id)}">
        <div class="card-body">
          <div class="idea-card-header">
            <div class="idea-title-block">
              <h3>${escapeHtml(idea.title)}</h3>
              <div class="idea-badges">
                <span class="badge badge-status">${escapeHtml(idea.status)}</span>
                ${isPinned ? `<span class="badge badge-pinned"><i data-lucide="pin" style="width:10px;height:10px;"></i> Pinned</span>` : ''}
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
            <button class="btn btn-secondary btn-sm rank-idea-btn"
              data-id="${escapeHtml(idea.id)}"
              data-pinned="${isPinned ? 'true' : 'false'}"
              data-rank="${rank ?? ''}">
              <i data-lucide="sliders"></i> Force Order
            </button>
            ${api.isOnline ? `
            <button class="btn btn-secondary btn-sm rescore-idea-btn" data-id="${escapeHtml(idea.id)}">
              <i data-lucide="rotate-cw"></i> Rescore
            </button>` : ''}
            <button class="btn btn-danger btn-sm delete-idea-btn" data-id="${escapeHtml(idea.id)}">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      </article>`;
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
  }

  // ── Operations ───────────────────────────────────────────────────────────
  async function deleteSkill(id) {
    if (api.isOnline && api.token) {
      try { await api.request(`/cv-profile/skills/${id}`, { method: 'DELETE' }); }
      catch (err) { showToast(err.message, 'error'); return; }
    } else {
      state.profile.skills = state.profile.skills.filter(s => s.id !== id);
      saveMockState();
    }
    await syncApp();
  }

  async function deleteIdea(id) {
    if (!confirm('Remove this idea from your backlog?')) return;
    if (api.isOnline && api.token) {
      try { await api.request(`/ideas/${id}`, { method: 'DELETE' }); }
      catch (err) { showToast(err.message, 'error'); return; }
    } else {
      state.ideas = state.ideas.filter(i => i.id !== id);
      saveMockState();
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

  // ── Form Handlers ────────────────────────────────────────────────────────
  saveSummaryBtn.addEventListener('click', async () => {
    const text = cvSummaryInput.value;
    if (api.isOnline && api.token) {
      try { await api.request('/cv-profile', { method: 'PUT', body: JSON.stringify({ summaryText: text }) }); }
      catch (err) { showToast(err.message, 'error'); return; }
    } else {
      state.profile.summaryText = text;
      saveMockState();
    }
    showToast('Profile summary saved', 'success');
    await syncApp();
  });

  ideaForm.addEventListener('submit', async e => {
    e.preventDefault();
    const submitBtn = ideaForm.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Scoring…';
    lucide.createIcons();

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
      } else {
        if (state.quota.count >= state.quota.limit) {
          showToast('Daily quota (2/day) reached in mock mode', 'warning');
          return;
        }
        const newIdea = {
          id: Date.now().toString(36),
          title, description: desc, useCase, status, features,
          createdAt: new Date().toISOString(),
        };
        const allWithNew = [...state.ideas, newIdea];
        newIdea.scores = [{ ...LocalScoringEngine.scoreIdea(newIdea, state.profile.skills, allWithNew), scoringMethod: 'rule_based' }];
        state.ideas.push(newIdea);
        state.quota.count++;
        saveMockState();
      }
      ideaForm.reset();
      showToast('Idea captured and scored!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i data-lucide="plus-circle"></i> Submit & Score Idea';
      lucide.createIcons();
    }

    await syncApp();
  });

  rescoreAllBtn.addEventListener('click', async () => {
    if (!api.isOnline) {
      state.ideas.forEach(idea => {
        idea.scores = [{ ...LocalScoringEngine.scoreIdea(idea, state.profile.skills, state.ideas), scoringMethod: 'rule_based' }];
      });
      saveMockState();
      renderUi();
      showToast('All ideas rescored locally', 'success');
      return;
    }
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
    } else {
      state.profile.skills.push({ id: Date.now().toString(36), name, category, weight });
      saveMockState();
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
    } else {
      const idea = state.ideas.find(i => i.id === id);
      if (idea) { idea.rankOverride = { pinned, manualRank }; saveMockState(); }
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
    } else {
      const idea = state.ideas.find(i => i.id === id);
      if (idea) { delete idea.rankOverride; saveMockState(); }
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

      // Check role
      const payload = decodeToken(data.accessToken);
      if (payload?.role === 'admin') {
        window.location.href = '/admin/';
        return;
      }

      closeModals();
      authBtn.innerHTML = '<i data-lucide="log-out"></i> Log Out';
      showToast('Authenticated successfully', 'success');
      state.isAuthenticated = true;
      showDashboard();
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

  // ── Start ──
  bootstrap();
});
