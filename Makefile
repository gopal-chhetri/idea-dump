.PHONY: format run build up down migrate migrate-down seed swagger

format:
	pnpm run format

run:
	pnpm run start:dev

build:
	pnpm run build

up:
	docker compose -f deployments/docker-compose.yml up --build

down:
	docker compose -f deployments/docker-compose.yml down

migrate:
	pnpm run migration:up

migrate-down:
	pnpm run migration:down

seed:
	@echo "No seed command configured yet. Implement your seeder first."

swagger:
	@echo "Swagger UI is running at http://localhost:3000/api/docs"
