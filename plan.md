# Idea Prioritizer — Implementation Plan

## 0. Context

Third project in the portfolio sequence: URL Shortener (done, Go/Gin + Casbin + Traefik) → **Idea Prioritizer** (this project, NestJS) → Video Streaming Platform (future, first project on Kubernetes). This plan reuses the deployment pattern proven on the URL shortener: Docker → GHCR → GitHub Actions → Traefik, secrets via Infisical, no Kubernetes.

## 1. Goals / Non-Goals

**Goals**
- Capture ideas: title, description, features[], use-case
- Score each idea against the user's CV profile (skills, tech stack, experience)
- Auto-rank ideas by computed priority
- Allow manual force-ordering that overrides the computed rank
- Multi-tenant: each user has their own idea list, isolated by `user_id`
- Auth: email/password (JWT, RS256, refresh rotation) + OAuth (Google, GitHub)
- Rate limit: 2 idea submissions per user per day
- Deploy identically to the URL shortener: Docker + Traefik + GitHub Actions + Infisical

**Non-goals (this phase)**
- No Kubernetes (reserved for the streaming project)
- No resume file parsing (PDF/DOCX ingestion) — CV profile is entered as structured data initially
- No team/shared workspaces — single-owner ideas only
- No admin roles/RBAC — not needed at this scale (unlike Casbin on the URL shortener)

## 2. Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | NestJS (TypeScript) | |
| Package manager | pnpm | |
| Primary DB | PostgreSQL | |
| Cache / rate limiting | Redis | |
| ORM | MikroORM | Unit-of-Work pattern — remember explicit `em.flush()` |
| Auth | Passport.js — JWT (RS256) + OAuth2 strategies | Mirrors the RS256/refresh-rotation design already planned for the streaming project |
| Reverse proxy | Traefik | Same instance/config pattern as URL shortener |
| Secrets | Infisical | |
| CI/CD | GitHub Actions → GHCR → deploy script | Same pipeline shape as URL shortener |
| Container | Docker, multi-stage build | |

## 3. Domain Model

```
User
  id, email, password_hash (nullable if OAuth-only), created_at

OAuthAccount
  id, user_id, provider (google|github), provider_account_id, created_at
  -- unique(provider, provider_account_id)

RefreshToken
  id, user_id, token_hash, expires_at, revoked_at, created_at

CvProfile
  id, user_id (unique — one active profile per user), summary_text
  updated_at

CvSkill
  id, cv_profile_id, name, category (language|framework|tool|domain), weight (1-5)

Idea
  id, user_id, title, description, features (jsonb: string[]), use_case
  status (inbox|active|archived), created_at

IdeaScore
  id, idea_id, fit_score, effort_score, novelty_score, final_score
  scoring_method (rule_based|llm), scored_at

IdeaRankOverride
  id, idea_id (unique), manual_rank (int, nullable), pinned (bool, default false), set_at

DailyIdeaQuota   -- optional DB backstop; Redis is primary enforcement
  user_id, date, count
```

## 4. Scoring & Ranking Engine

This is the one non-CRUD subsystem — worth pinning down precisely.

**Design: a `ScoringStrategy` interface, swappable, so v1 ships without any LLM dependency.**

```typescript
interface ScoringStrategy {
  score(idea: Idea, profile: CvProfile): Promise<{
    fitScore: number;      // 0–100, overlap between idea and CV skills/domains
    effortScore: number;   // 0–100, lower = more effort (inverted at aggregation)
    noveltyScore: number;  // 0–100, how different from user's existing idea set
  }>;
}
```

- **v1 — `RuleBasedScoringStrategy`**: tokenize `description` + `features` + `use_case`, match against `CvSkill.name` (weighted by `CvSkill.weight`), compute overlap ratio → `fitScore`. `effortScore` derived from a simple heuristic (feature count, description length) until something better is justified. Deterministic, free, explainable, no external dependency — this is the one that should exist before anything else works.
- **v2 — `LlmScoringStrategy`** *(optional, later)*: send idea + CV summary to an LLM via OpenRouter's OpenAI-compatible `chat/completions` endpoint (key via Infisical, model selected by slug e.g. `anthropic/claude-sonnet-4-6`), request structured JSON (`fit`, `effort`, `novelty`, `reasoning`). Adds latency/cost but better qualitative judgment. Store `scoring_method` per record so both can coexist and be compared.
- **Aggregation**: `final_score = w1*fitScore + w2*(100-effortScore) + w3*noveltyScore`, weights configurable (env or per-user later).

**Ranking query**:
```sql
ORDER BY pinned DESC, manual_rank ASC NULLS LAST, final_score DESC
```
Pinned/manually-ranked ideas float to the top in the order specified; everything else falls back to `final_score`. Rescoring on CV profile update is a decision point — see §13.

## 5. Rate Limiting (2/day)

- Primary: Redis `INCR idea_quota:{userId}:{date}` with `EXPIRE` set to seconds-until-midnight; guard rejects with 429 at count ≥ 2.
- Backstop: DB `DailyIdeaQuota` row updated in the same transaction as idea creation, in case Redis is unavailable — treat Redis as fast-path, DB as source of truth if they ever disagree.
- Timezone for "day" boundary is an open decision — see §13.

## 6. Auth Design

- Local: email/password, bcrypt hash, standard NestJS `AuthModule` + `LocalStrategy`.
- JWT: RS256-signed access token (~15 min), refresh token rotated and stored hashed in `RefreshToken`, reused pattern from the streaming project design.
- OAuth: `GoogleStrategy` and `GithubStrategy` via `passport-google-oauth20` / `passport-github2`. Account linking by verified email into the same `User` row via `OAuthAccount`.
- Guards: `JwtAuthGuard` on all idea/CV endpoints. No role guard needed (no admin surface yet).

## 7. Module Structure

```
AuthModule        — local + OAuth strategies, JWT issuance/refresh
UsersModule        — user CRUD, profile
CvProfileModule    — CV profile + skills CRUD
IdeasModule        — idea CRUD, applies RateLimitGuard on create
ScoringModule       — ScoringStrategy implementations + scoring orchestration
RankingModule      — computes ordered list, handles manual overrides
RateLimitModule    — Redis-backed guard, reusable
CommonModule       — Infisical config loader, MikroORM EntityManager, filters/interceptors
```

## 8. API Surface

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
GET    /auth/google            GET  /auth/google/callback
GET    /auth/github            GET  /auth/github/callback

GET    /cv-profile             PUT /cv-profile
POST   /cv-profile/skills      DELETE /cv-profile/skills/:id

POST   /ideas                  -- guarded by RateLimitGuard (2/day)
GET    /ideas                  -- returns ranked list
GET    /ideas/:id
PATCH  /ideas/:id
DELETE /ideas/:id
POST   /ideas/:id/rescore

PATCH  /ideas/:id/rank         -- body: { manualRank?: number, pinned?: boolean }
DELETE /ideas/:id/rank         -- clear override, revert to computed rank
```

## 9. Deployment Plan (mirrors URL shortener)

- **Dockerfile**: multi-stage — `build` stage installs via `pnpm install --frozen-lockfile` and compiles, then a slim runtime image copies only `dist/` + production `node_modules` (via `pnpm deploy` or `pnpm install --prod`).
- **docker-compose.yml**: `app`, `postgres`, `redis`, plus Traefik labels on `app` (router rule, TLS via existing cert resolver, entrypoint) — same shape as the URL shortener compose file.
- **GitHub Actions**: `pnpm/action-setup` + cache the pnpm store, build → push to GHCR → trigger deploy (same GHCR auth pattern that had to be debugged last time — reuse the working login step directly rather than re-deriving it).
- **Infisical**: inject `DATABASE_URL`, `REDIS_URL`, `JWT_PRIVATE_KEY`/`JWT_PUBLIC_KEY`, OAuth client secrets, `OPENROUTER_API_KEY` (if/when LLM scoring ships) at deploy time.
- **Config files**: unlike Casbin's policy file on the URL shortener, this service has no file-based config to bake into the image — one less failure mode to debug.
- Carry over the checklist from the URL shortener deployment: confirm env vars actually reach the container, confirm Redis starts before the app (startup ordering was the issue last time), confirm Traefik port doesn't collide with the URL shortener's.

## 10. Implementation Phases

| Phase | Deliverable |
|---|---|
| 0 | Repo scaffold, NestJS init, MikroORM entities + migrations, Docker Compose skeleton, CI skeleton |
| 1 | Local auth: register/login, JWT issuance, refresh rotation |
| 2 | OAuth: Google + GitHub, account linking |
| 3 | CV Profile CRUD |
| 4 | Ideas CRUD + RateLimitGuard (2/day) |
| 5 | RuleBasedScoringStrategy + scoring on idea create/update |
| 6 | Ranking query + manual override endpoints |
| 7 | Deployment: Docker, Traefik, GitHub Actions, Infisical — same pipeline as URL shortener |
| 8 | *(optional)* LlmScoringStrategy behind the existing interface |
| 9 | Tests: unit tests on scoring math, e2e on auth + rate-limit boundary |

## 11. Testing Priorities

- Unit-test the scoring aggregation formula in isolation (pure function, easy to get wrong silently).
- e2e-test the rate limit boundary (3rd idea in a day must 429; 1st idea next day must succeed) — this is the part most likely to have an off-by-one or timezone bug.
- e2e-test that pinned/manual-ranked ideas survive a rescore.

## 12. Open Decisions for Codex Review

1. **Quota day boundary**: UTC midnight (simple, consistent) vs user-local midnight (more intuitive, needs a timezone field on `User`). Recommend UTC for v1.
2. **Rescoring on CV update**: does editing the CV profile trigger a rescore of every existing idea, or only new/edited ideas? Affects whether `IdeaScore` needs a "stale" flag.
3. **Idea status lifecycle**: is `inbox/active/archived` sufficient, or is a `completed` state needed for ideas that get built (tie-in to the portfolio project sequence itself)?
4. **LLM scoring in v1 or deferred**: rule-based is the safer critical path; confirm before Phase 8 is scheduled or cut.