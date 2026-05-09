COMPOSE_FILE := docker-compose.yml
COMPOSE := docker compose -f $(COMPOSE_FILE)
FRONTEND_DIR := ../frontend
# nvm-managed node is not on make's restricted PATH; resolve npm explicitly.
NPM_BIN ?= /Users/alexhuang/.nvm/versions/node/v24.15.0/bin/npm
NPM := $(NPM_BIN) --prefix $(FRONTEND_DIR)

.PHONY: help check up up-build down clean logs ps health \
        logs-calfire logs-noaa logs-all logs-mcp logs-recommendation \
        stream-fire stream-weather stream-recommendations \
        context topics mcp-server ingest sms sms-replay test \
        frontend-install frontend-dev frontend-build frontend-start frontend-lint

help:
	@echo "Available targets:"
	@echo "  make check          Verify Docker and Docker Compose are installed"
	@echo "  make up             Start all containers"
	@echo "  make up-build       Build and start all containers"
	@echo "  make down           Stop all containers"
	@echo "  make clean          Stop, remove volumes (wipes SQLite) and orphans"
	@echo "  make ps             Show container status"
	@echo "  make health         Check the backend health endpoint"
	@echo ""
	@echo "  make logs           Follow backend logs"
	@echo "  make logs-calfire   Follow CAL FIRE producer logs"
	@echo "  make logs-noaa      Follow NOAA producer logs"
	@echo "  make logs-all       Follow all container logs"
	@echo ""
	@echo "  make stream-fire    Live Kafka stream: firelink.fire"
	@echo "  make stream-weather Live Kafka stream: firelink.weather"
	@echo "  make context        Fetch /context/latest (pretty-printed JSON)"
	@echo "  make topics         List all Kafka topics"
	@echo "  make logs-mcp            Follow MCP server logs"
	@echo "  make logs-recommendation Follow recommendation agent logs"
	@echo "  make stream-recommendations Live Kafka stream: firelink.recommendations"
	@echo "  make mcp-server          Run FastMCP context server locally (stdio transport)"
	@echo "  make ingest              One-shot ingest of docs/*.pdf into Pinecone"
	@echo "  make sms                 Interactive SMS simulator (talks to /sms/inbound)"
	@echo "  make sms-replay          Batch-replay sms_test_cases.json through the Help Agent"
	@echo "  make test                Smoke-test running stack (make + REST + Help Agent)"
	@echo ""
	@echo "  make frontend-install    Install Next.js dependencies (npm install)"
	@echo "  make frontend-dev        Run Next.js dev server (port 3000)"
	@echo "  make frontend-build      Production build of the Next.js app"
	@echo "  make frontend-start      Run the production Next.js server"
	@echo "  make frontend-lint       Run eslint on the frontend"

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

clean:
	$(COMPOSE) down -v --remove-orphans

logs:
	$(COMPOSE) logs -f backend

ps:
	$(COMPOSE) ps

health:
	$(COMPOSE) exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://localhost:8000/health').read().decode())"

logs-calfire:
	$(COMPOSE) logs -f calfire-producer

logs-noaa:
	$(COMPOSE) logs -f noaa-producer

logs-all:
	$(COMPOSE) logs -f

logs-mcp:
	$(COMPOSE) logs -f mcp-server

logs-recommendation:
	$(COMPOSE) logs -f recommendation-agent

stream-fire:
	docker exec firelink-kafka kafka-console-consumer \
		--bootstrap-server localhost:9092 \
		--topic firelink.fire \
		--from-beginning

stream-weather:
	docker exec firelink-kafka kafka-console-consumer \
		--bootstrap-server localhost:9092 \
		--topic firelink.weather \
		--from-beginning

stream-recommendations:
	docker exec firelink-kafka kafka-console-consumer \
		--bootstrap-server localhost:9092 \
		--topic firelink.recommendations \
		--from-beginning

context:
	@curl -s http://localhost:8000/context/latest | python3 -m json.tool

topics:
	docker exec firelink-kafka kafka-topics \
		--bootstrap-server localhost:9092 \
		--list

mcp-server:
	@python3 -c "import fastmcp" 2>/dev/null || pip3 install -r requirements-mcp.txt
	KAFKA_BOOTSTRAP=localhost:9092 python3 -m app.mcp_server

ingest:
	$(COMPOSE) exec backend python -m app.services.knowledge.ingest

sms:
	@python3 test/sms_cli.py

sms-replay:
	@python3 test/sms_cli.py --batch

test:
	@python3 test/smoke_test.py

frontend-install:
	$(NPM) install

frontend-dev:
	@test -d $(FRONTEND_DIR)/node_modules || $(NPM) install
	$(NPM) run dev

frontend-build:
	@test -d $(FRONTEND_DIR)/node_modules || $(NPM) install
	$(NPM) run build

frontend-start:
	$(NPM) run start

frontend-lint:
	$(NPM) run lint