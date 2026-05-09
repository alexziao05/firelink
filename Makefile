COMPOSE_FILE := docker-compose.yml
COMPOSE := docker compose -f $(COMPOSE_FILE)

.PHONY: help check up up-build down logs ps health

help:
	@echo "Available targets:"
	@echo "  make check      Verify Docker and Docker Compose are installed"
	@echo "  make up         Start the backend container"
	@echo "  make up-build   Build and start the backend container"
	@echo "  make down      Stop the backend container"
	@echo "  make logs      Follow backend logs"
	@echo "  make ps        Show container status"
	@echo "  make health    Check the backend health endpoint"

check:
	@command -v docker >/dev/null 2>&1 || { echo "Docker is not installed or not on PATH."; exit 1; }
	@docker compose version >/dev/null 2>&1 || { echo "Docker Compose v2 is not available."; exit 1; }
	@echo "Docker and Docker Compose are available."

up:
	$(COMPOSE) up

up-build:
	$(COMPOSE) up --build

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f backend

ps:
	$(COMPOSE) ps

health:
	$(COMPOSE) exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read().decode())"