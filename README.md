# Idea-dump
Idea Dump is a platform for sharing and storing ideas.
Live hosted on [ideas.soylab.dpdns.org](https://ideas.soylab.dpdns.org/).

## System Architecture

### 1. Google OAuth Flow
```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Nest as NestJS Backend
    participant Google as Google OAuth Server

    User->>Browser: Click "Sign in with Google"
    Browser->>Nest: GET /auth/google
    Nest-->>Browser: Redirect to Google Consent Page
    Browser->>Google: Navigate with Client ID + Redirect URI
    User->>Google: Authenticate & Authorize
    Google-->>Browser: Redirect to /auth/google/callback with Auth Code
    Browser->>Nest: GET /auth/google/callback?code=...
    Nest->>Google: POST token exchange (Code -> Tokens)
    Google-->>Nest: Access Token & ID Token (User Info)
    Nest->>Nest: Find or Create User in Postgres DB
    Nest->>Nest: Generate JWT tokens (Access + Refresh)
    Nest-->>Browser: Redirect to FRONTEND_URL/app?token=... & set cookie
```

### 2. Idea Creation, Scoring & Ranking Flow
```mermaid
sequenceDiagram
    actor User
    participant API as NestJS API
    participant Scorer as Scoring Service
    participant Ranker as Ranking Engine
    participant DB as Postgres DB

    User->>API: POST /ideas (title, description, tags)
    API->>Scorer: calculateScore(idea)
    activate Scorer
    Scorer->>Scorer: Weighted evaluation (Fit * wFit + Novelty * wNovelty - Effort * wEffort)
    Scorer-->>API: Return composite score
    deactivate Scorer
    API->>DB: INSERT into ideas (with score)
    API->>Ranker: updateRanks()
    activate Ranker
    Ranker->>DB: Query daily quota and system rankings
    Ranker->>DB: Update rank indexes
    Ranker-->>API: Ranking update completed
    deactivate Ranker
    API-->>User: 201 Created (with ranked idea object)
```

### 3. Deployment & CI/CD Pipeline
```mermaid
graph TD
    Developer[Developer] -->|git push| GitHub[GitHub Repository]

    subgraph cicd ["CI/CD - GitHub Actions"]
        GitHub --> CI["CI - Lint (non-blocking)"]
        CI --> CD["CD - Build Docker Image"]
        CD --> GHCR[Push to GHCR]
         CD --> PrepVPS["Ensure VPS directory permissions"]
         PrepVPS --> SCP["SCP deploy.sh, compose.yml"]
        SCP --> DeploySSH["SSH - run deploy.sh"]
    end

    subgraph vps ["VPS Deployment"]
        GHCR -->|docker pull| VPS[Production VPS]
        DeploySSH --> VPS
        Infisical[Infisical Cloud] -->|Fetch Secrets| VPS
        VPS --> App[App Container]
        VPS --> Redis[Redis Container]
        VPS --> DB[Postgres Container]
        VPS --> Migrate[Migrate Container]
        Cloudflare[Cloudflare] -->|Proxy Traffic| VPS
    end
```

## Features

- **Idea Management**: Create, edit, and delete ideas
- **Health Check**: `/health` endpoint for monitoring

## Tech Stack

| Component | Technology |
|-----------|------------|
| Application | TypeScript, NestJS |
| Database | PostgreSQL |
| Cache | Redis |
| CI/CD | GitHub Actions |
| Registry | GitHub Container Registry (GHCR) |
| DNS/SSL | Cloudflare |
| Secrets | Infisical Cloud |
| Deployment | Docker Compose on VPS |

## Prerequisites

- Node.js 22+ (or use Docker)
- Docker and Docker Compose
- PostgreSQL 15+ (or use Docker)
- Redis 7+ (or use Docker)

## Local Development

### Quick Start

```bash
# Clone the repository
git clone https://github.com/gopal-chhetri/idea-dump.git
cd idea-dump

# Start all services (app, database, redis)
pnpm run start:dev

# Or with Docker Compose directly
cd deployments/local-dev
docker compose up --build
```

The app will be available at `http://localhost:3000`.


## Environment Variables

Copy `deployments/local-dev/.env.sample` to `deployments/local-dev/.env` and configure the following variables:

| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `PORT` | NestJS backend server port | `3000` |
| `DB_HOST` | PostgreSQL Host | `postgres` (local compose) or `localhost` |
| `DB_PORT` | PostgreSQL Port | `5432` |
| `DB_NAME` | PostgreSQL Database name | `idea_dump` |
| `DB_USER` | PostgreSQL Username | `postgres` |
| `DB_PASS` | PostgreSQL Password | `postgres` |
| `REDIS_HOST` | Redis Server Host | `redis` (local compose) or `localhost` |
| `REDIS_PORT` | Redis Server Port | `6379` |
| `FRONTEND_URL` | Application frontend redirection base | `http://localhost:3000/app` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | *(From Google Cloud Console)* |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | *(From Google Cloud Console)* |
| `JWT_PRIVATE_KEY` | Private key for RS256 JWT validation (base64 encoded) | *(Required for prod)* |
| `JWT_PUBLIC_KEY` | Public key for RS256 JWT validation (base64 encoded) | *(Required for prod)* |
| `JWT_ACCESS_EXPIRY` | Access token duration | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token duration in days | `7` |
| `IDEA_DAILY_LIMIT` | Max ideas per user per day | `10` |
| `SCORE_WEIGHT_FIT` | Weight for Idea strategic fit | `0.5` |
| `SCORE_WEIGHT_EFFORT` | Weight for Idea creation effort | `0.3` |
| `SCORE_WEIGHT_NOVELTY` | Weight for Idea uniqueness/novelty | `0.2` |
| `APP_ENCRYPTION_KEY` | Secret encryption key for system configuration | `insecure-dev-key-32-chars-long!!` |

## API Documentation

Once running, visit:
- **Swagger UI**: `http://localhost:3000/api/docs`

### Key Endpoints

> Note: routes have **no `/api` prefix** (the backend has no global prefix).
> `/api/auth/google/callback` is also served as a compatibility alias.

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login | No |
| GET | `/auth/google` | Start Google OAuth | No |
| GET | `/auth/google/callback` | Google OAuth callback | No |
| POST | `/ideas` | Create idea | Yes |
| GET | `/ideas` | List user's ideas | Yes |
| DELETE | `/ideas/:id` | Deactivate idea | Yes |

### Google OAuth Setup

1. In Google Cloud Console, under **APIs & Services → Credentials →
   OAuth 2.0 Client IDs**, configure the web client:
   - **Authorized JavaScript origins:** `https://ideas.soylab.dpdns.org`
   - **Authorized redirect URIs:** `https://ideas.soylab.dpdns.org/auth/google/callback`
2. Configure the secrets (via Infisical in prod):
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
3. `FRONTEND_URL` (e.g. `https://ideas.soylab.dpdns.org/app`) controls where the
   OAuth callback redirects the browser with the token pair.
4. `callbackURL` is derived from `FRONTEND_URL` (origin + `/auth/google/callback`)
   so it always matches the single registered redirect URI.

### CI/CD Pipeline

Push to `main` (or a `v*` tag) triggers:
1. **CI**: Lint (non-blocking) → Build
2. **CD**: Build Docker image → Push to GHCR → Ensure VPS permissions → SCP copies `compose.yml` + `deploy.sh` (migrations run from the image via the `migrate` service) → SSH `deploy.sh` on VPS

### Image Versioning

| Trigger | Tag | Example |
|---------|-----|---------|
| Push to main | `main-<sha>` | `main-abc1234` |
| Git tag | `v1.2.3` | `v1.2.3` |

## Roadmap & TODOs

- [ ] Add unit and integration test coverage for core redirection flows.
- [ ] Grafana and Prometheus setup for monitoring.

## License

MIT License