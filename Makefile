.PHONY: format run build up down migrate migrate-down seed swagger

format:
	pnpm run format

run:
	pnpm run start:dev

build:
	pnpm run build

up:
	docker compose --env-file .env -f deployments/local-dev/compose.yml up --build

down:
	docker compose --env-file .env -f deployments/local-dev/compose.yml down

migrate:
	@set -a; [ -f .env ] && . ./.env; set +a; pnpm run migration:up

migrate-down:
	@set -a; [ -f .env ] && . ./.env; set +a; pnpm run migration:down

seed:
	@set -a; [ -f .env ] && . ./.env; set +a; pnpm run seed

swagger:
	@echo "Swagger UI:      http://localhost:3000/api/docs"
	@echo "SPA (frontend): http://localhost:3000/app"
