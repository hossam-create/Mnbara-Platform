.PHONY: up down migrate seed logs

up:
	docker compose -f docker-compose_mocks.yml up --build -d

down:
	docker compose -f docker-compose_mocks.yml down

migrate:
	# Example using docker-compose exec to run migrations (adjust to your migration tool)
	docker compose -f docker-compose_mocks.yml exec -T postgres bash -lc "psql -U postgres -d crowdshipping -c 'CREATE TABLE IF NOT EXISTS migrations(id serial primary key, name text, applied_at timestamptz default now());'"

seed:
	# run seed scripts inside service container (example)
	docker compose -f docker-compose_mocks.yml exec -T user-service bash -lc "node scripts/seed.js"

logs:
	docker compose -f docker-compose_mocks.yml logs -f
