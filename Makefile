.PHONY: help build up down restart logs shell db-shell clean status

help: ## Show help
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Rebuild Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs of all services
	docker-compose logs -f

logs-app: ## Show logs of the application
	docker-compose logs -f app

logs-db: ## Show logs of the database
	docker-compose logs -f db

shell: ## Enter the application container
	docker-compose exec app sh

db-shell: ## Enter the MySQL console
	docker-compose exec db mysql -u funraise_user -p funraise

clean: ## Clean Docker (be careful!)
	docker-compose down -v
	docker system prune -f

status: ## Show the status of the containers
	docker-compose ps

setup: ## Initial setup (create .env from example)
	@if [ ! -f .env ]; then \
		cp env.example .env; \
		echo ".env file created from env.example"; \
		echo "Edit .env file before running!"; \
	else \
		echo ".env file already exists"; \
	fi

dev: ## Run in development mode (with rebuild)
	docker-compose up --build

prod: build up ## Run in production

health: ## Check the health of the application
	curl -f http://localhost:3000/health || echo "Service is not available"

seed: ## Run all seeders
	npm run seed

seed-achievements: ## Run only achievements seeder
	npm run seed:achievements

seed-testdata: ## Run only test data seeder
	npm run seed:testdata

seed-prod: ## Run production seeders
	npm run seed:prod 