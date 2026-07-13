#!/usr/bin/env bash
# Debug script to check migration status on production

set -euo pipefail

echo "=== Checking Docker Compose services ==="
cd /opt/app/idea_dump
docker compose ps

echo ""
echo "=== Checking migrate service logs ==="
docker compose logs migrate

echo ""
echo "=== Checking database tables ==="
docker compose exec -T postgres psql -U "${DB_USER}" -d "${DB_NAME}" -c "\dt"

echo ""
echo "=== Checking mikro-orm migrations table ==="
docker compose exec -T postgres psql -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT * FROM mikro_orm_migrations;" || echo "Migration tracking table doesn't exist"
