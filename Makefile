COMPOSE_FILE := docker-compose.yml
COMPOSE := docker compose -f $(COMPOSE_FILE)

.PHONY: help check up up-build down logs ps health \
        logs-calfire logs-noaa logs-all logs-mcp \
        stream-fire stream-weather \
        context topics mcp-server

help:
	@echo "Available targets:"
	@echo "  make check          Verify Docker and Docker Compose are installed"
	@echo "  make up             Start all containers"
	@echo "  make up-build       Build and start all containers"
	@echo "  make down           Stop all containers"
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
	@echo "  make logs-mcp       Follow MCP server logs"
	@echo "  make mcp-server     Run FastMCP context server locally (stdio transport)"

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

logs-calfire:
	$(COMPOSE) logs -f calfire-producer

logs-noaa:
	$(COMPOSE) logs -f noaa-producer

logs-all:
	$(COMPOSE) logs -f

logs-mcp:
	$(COMPOSE) logs -f mcp-server

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

context:
	@curl -s http://localhost:8000/context/latest | python3 -m json.tool

topics:
	docker exec firelink-kafka kafka-topics \
		--bootstrap-server localhost:9092 \
		--list

mcp-server:
	@python3 -c "import fastmcp" 2>/dev/null || pip3 install -r requirements-mcp.txt
	KAFKA_BOOTSTRAP=localhost:9092 python3 -m app.mcp_server