# Idea-dump
Idea Dump is a platform for sharing and storing ideas.
Live hosted on [ideas.soylab.dpdns.org](https://ideas.soylab.dpdns.org/).

## System Architecture

### 1. Deployment & CI/CD Pipeline
```mermaid
graph TD
    Developer[Developer] -->|git push| GitHub[GitHub Repository]

    subgraph cicd ["CI/CD - GitHub Actions"]
        GitHub --> CI["CI - Lint and Test"]
        CI --> CD["CD - Build Docker Image"]
        CD --> GHCR[Push to GHCR]
        CD --> PrepVPS["Ensure VPS directory permissions"]
        PrepVPS --> SCP["SCP deploy.sh, compose.yml, migrations"]
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
npm run start:dev

# Or with Docker Compose directly
cd deployments/local-dev
docker compose up --build
```

The app will be available at `http://localhost:3000`.


## Environment Variables

Copy `deployments/local-dev/.env.sample` to `deployments/local-dev/.env` and configure:

## API Documentation

Once running, visit:
- **Swagger UI**: `http://localhost:3000/api/docs`

### Key Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/ideas` | Create idea | Yes |
| GET | `/api/ideas` | List user's ideas | Yes |
| DELETE | `/api/ideas/:id` | Deactivate idea | Yes |

### CI/CD Pipeline

Push to `main` triggers:
1. **CI**: Lint → Test → Build
2. **CD**: Build Docker image → Push to GHCR → Ensure VPS permissions → SCP deploy files and root `migrations/` → SSH `deploy.sh` on VPS

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