Consolidated Plan
Phase 0 — Theme / design-system refresh (match the logo)
Redefine the shared tokens in frontend/style.css (used by all three UIs):
- Background: deep navy→indigo gradient (#05060f → #0b0a1f) instead of flat #08090d.
- Surfaces: violet-tinted (#11111f, cards #15132b) with subtle glassmorphism + soft violet borders.
- Primary accent: vivid violet #7c5cff (interactive), deep #3010b0 (shade) — replaces the cyan.
- Accent gradient: linear-gradient(135deg, #6d28d9, #c026d3) (violet→magenta).
- Secondary pop (coral): #ff5a2c/#f05020 for CTAs, score badges, highlights.
- Text: #f3f4f6 / violet-tinted #a5a7c0; glows rgba(124,92,255,.35).
- Add richer visuals: gradient hero text, glowing primary buttons, glass cards, animated gradient borders.
- Brand mark: use frontend/logo.png (served at /app/logo.png) in the SPA header, admin header, and landing hero. Copy/reference it from public/ and admin/ too.
- Apply the refresh to the existing SPA (/app) first so the foundation is proven before building landing/admin.
Phase 1 — Roles foundation (backend)
- enums.ts: add UserRole { USER='user', ADMIN='admin' }.
- user.entity.ts: add role!: UserRole (default USER); new migration for the column.
- jwt.strategy.ts: include role in payload + req.user.
- New auth/guards/roles.guard.ts + auth/decorators/roles.decorator.ts (@Roles(UserRole.ADMIN)).
- users.service.ts: create() accepts optional role.
- Extend seeder.ts to also seed an admin (admin@idea-prioritizer.dev / admin1234, ADMIN).
Phase 2 — Admin APIs (backend)
- New SystemSetting entity (key unique, value encrypted AES-256-GCM via APP_ENCRYPTION_KEY): holds AI keys (ai.openai.apiKey, etc.) + scoring weights.
- New src/admin/: admin.module.ts, admin.service.ts, admin.controller.ts (@ApiTags('Admin'), @ApiBearerAuth(), @UseGuards(JwtAuthGuard, RolesGuard), @Roles(ADMIN)), Swagger-decorated like existing controllers:
- GET /admin/stats
- GET/POST /admin/users, GET/PATCH/DELETE /admin/users/:id
- GET /admin/ideas, DELETE /admin/ideas/:id, POST /admin/ideas/:id/rescore, POST /admin/rescore/all
- GET /admin/settings, PUT /admin/settings
- Register AdminModule in app.module.ts.
Phase 3 — Landing page (vanilla, /)
- New public/landing.html + landing.js (+ reuse style.css), served at / (app.useStaticAssets(join(cwd,'public'))).
- Content with the new theme + logo: hero, use cases (capture/score/rank ideas), how it works, why (CV-fit scoring, rule + future ML, privacy), CTA → /app.
Phase 4 — Admin dashboard (vanilla SPA, /admin)
- New admin/admin.html + admin.js, served via app.useStaticAssets(join(cwd,'admin'), { prefix:'/admin' }) + /admin→/admin/ redirect.
- Admin login via /auth/login; if role===admin, show dashboard (users table, ideas table, re-score buttons, AI-key settings form) with the refreshed theme + logo.
Phase 5 — Production CI/CD (mirror url-shortener)
deployments/production/:
- Dockerfile (multi-stage Node 22): build → pnpm run build + compile src/migrate.ts→dist/src/migrate.js (migrations run in prod without ts-node); runtime serves frontend/,public/,admin/, healthcheck /health.
- compose.yml: app (GHCR image, Traefik labels + TLS like url-shortener), postgres, redis, traefik (external traefik-network), migrate service = node dist/src/migrate.js. Secrets as ${VAR} injected by infisical run.
- deploy.sh + setup-vps.sh: adapted from url-shortener (port 3000, node-based migrate, image ghcr.io/<you>/idea-prioritizer).
- .env.example: all prod vars (DB_*, REDIS_, JWT_, AI keys, scoring weights, APP_ENCRYPTION_KEY, INFISICAL_*, REGISTRY_*, VPS_*, DOMAIN).
- .github/workflows/deploy.yml: Infisical OIDC → build & push GHCR → SSH to VPS → infisical run + ./deploy.sh <tag>. Repo vars: INFISICAL_IDENTITY_ID, INFISICAL_VPS_IDENTITY_ID, INFISICAL_PROJECT_SLUG, INFISICAL_PROJECT_ID, VPS_HOST, VPS_SSH_USER, VPS_SSH_KEY.
Phase 6 — Verification
- make build + lint pass; new migration applies via make migrate; make seed creates demo + admin.
- Manual: / landing (new theme + logo), /app SPA (refreshed), /admin dashboard (admin login), /api/docs (admin endpoints).
- Prod dry-run: docker compose --env-file .env -f deployments/production/compose.yml up -d, hit /health + /api/docs.
Scope notes
- LLM scoring not implemented — admin stores keys + triggers rule-based re-score (per your answer).
- AI keys encrypted at rest; never returned in full to non-admins.
- Everything stays vanilla (no new framework); the theme refresh is shared CSS.
Two open calls before I build: (1) proceed in this order (theme → foundation → admin backend → landing → admin UI → deploy)? (2) For the coral accent, use it sparingly as a pop (CTAs/scores) rather than primary — agree?