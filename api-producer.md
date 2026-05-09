# FireLink — Real-Time Data Streaming Pipeline

## Context
FireLink streams real Eaton Fire incident data and Open-Meteo weather observations to power an AI agent that answers evacuation routing queries. Data files are replayed through Kafka producers and exposed via a single `/context/latest` endpoint. Each producer runs as its own container with isolated logs and restart lifecycle.

**Everything runs in Docker Compose** — 5 containers total. `make up-build` starts the full system.

---

## Architecture Overview

```
Data Files                     Containers                  Kafka                    FastAPI
──────────────────────         ──────────────────          ────────────────         ──────────────────
fire_incidents.json   ──────►  calfire-producer    ──────► firelink.fire     ──────► GET /context/latest
weather_alerts.json   ──────►  noaa-producer       ──────► firelink.weather          (reads last 10 msgs
                                                                                      per topic → JSON
                                                                                      snapshot for AI agent)
```

All services communicate over `firelink-network` (Docker bridge).
Producers and backend connect to Kafka at `kafka:9092` (internal DNS).

---

## Data Sources

| Source | How generated | Replay interval |
|--------|--------------|-----------------|
| CAL FIRE Eaton Fire updates | `scrape_calfire.py` — Playwright scrape of fire.ca.gov, 199 real update reports (Jan 7–27 2025) | 1 record / 10s |
| Open-Meteo weather archive | `scrape_calfire.py` — real hourly observations matched to each incident timestamp (Jan 7–31 2025) | 1 record / 10s |

Re-run `python scrape_calfire.py` to refresh both JSON files.

---

## Docker Compose — Full Service Map

5 containers: `firelink-zookeeper`, `firelink-kafka`, `firelink-backend`, `firelink-calfire-producer`, `firelink-noaa-producer`

```yaml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: firelink-zookeeper
    restart: unless-stopped
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    networks:
      - firelink-network

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: firelink-kafka
    restart: unless-stopped
    depends_on:
      - zookeeper
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    ports:
      - "9092:9092"
    networks:
      - firelink-network
    healthcheck:
      test: ["CMD", "kafka-broker-api-versions", "--bootstrap-server", "localhost:9092"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 15s

  backend:
    build: .
    container_name: firelink-backend
    restart: unless-stopped
    depends_on:
      kafka:
        condition: service_healthy
    environment:
      - KAFKA_BOOTSTRAP=kafka:9092
      - CORS_ORIGINS=http://localhost:3000
    ports:
      - "8000:8000"
    volumes:
      - ./app:/app/app
      - firelink-db:/app/data
    networks:
      - firelink-network

  calfire-producer:
    build: .
    container_name: firelink-calfire-producer
    restart: unless-stopped
    depends_on:
      kafka:
        condition: service_healthy
    environment:
      - KAFKA_BOOTSTRAP=kafka:9092
    volumes:
      - ./app:/app/app
      - firelink-db:/app/data
    command: python -m app.run_producer calfire
    networks:
      - firelink-network

  noaa-producer:
    build: .
    container_name: firelink-noaa-producer
    restart: unless-stopped
    depends_on:
      kafka:
        condition: service_healthy
    environment:
      - KAFKA_BOOTSTRAP=kafka:9092
    volumes:
      - ./app:/app/app
      - firelink-db:/app/data
    command: python -m app.run_producer noaa
    networks:
      - firelink-network

volumes:
  firelink-db:
```

---

## Kafka Topics

| Topic | Container | Message shape |
|-------|-----------|---------------|
| `firelink.weather` | noaa-producer | `{id, event, severity, area, description, wind_mph, humidity_pct, onset, expires, timestamp}` |
| `firelink.fire` | calfire-producer | `{id, name, latitude, longitude, acres, containment, status, timestamp}` |

---

## DB Persistence

Every message published to Kafka is also upserted into SQLite (`/app/data/evaclink.db`, shared via the `firelink-db` Docker volume). `FireIncident` and `WeatherAlert` rows are merged on `id` — replays are idempotent. AI agent reads go through `/context/latest` → Kafka.

---

## File Structure

```
app/
  core/
    kafka.py                    ← AIOKafkaProducer + AIOKafkaConsumer factory
    database.py                 ← SQLite engine, SessionLocal, init_db
  models/
    __init__.py                 ← FireIncident, WeatherAlert ORM models (DateTime + indexes)
  services/
    producers/
      base_producer.py          ← async poll loop, exponential backoff, Kafka send, SQLite upsert
      calfire_producer.py       ← fire_incidents.json replay → firelink.fire (10s)
      noaa_producer.py          ← weather_alerts.json replay → firelink.weather (10s)
    context_service.py          ← reads last 10 msgs per topic, 10s timeout, returns snapshot
  routes/
    context.py                  ← GET /context/latest
  data/
    fire_incidents.json         ← 199 real CAL FIRE update records (Jan 7–27 2025)
    weather_alerts.json         ← 199 real Open-Meteo observations (Jan 7–31 2025)
  run_producer.py               ← standalone entry point: python -m app.run_producer <calfire|noaa>
scrape_calfire.py               ← one-shot Playwright scraper + Open-Meteo fetch → writes data files
generate_data.py                ← alternative synthetic data generator (Eaton Fire scenario)
```

---

## AI Agent Interface

```
GET /context/latest
```
Returns:
```json
{
  "weather": [ ...last 10 weather alerts... ],
  "fire":    [ ...last 10 fire incidents... ],
  "fetched_at": "2025-01-08T05:46:00Z"
}
```
AI agent calls this endpoint before generating any evacuation recommendation.

---

## Verification

```bash
make up-build                         # start all 5 containers
curl http://localhost:8000/health     # → {"status": "healthy"}
# wait ~30s for producers to publish
curl http://localhost:8000/context/latest   # → JSON with weather and fire arrays

# view producer logs separately
docker logs -f firelink-calfire-producer
docker logs -f firelink-noaa-producer

# inspect Kafka directly
docker exec firelink-kafka kafka-topics --bootstrap-server localhost:9092 --list
docker exec firelink-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic firelink.fire --from-beginning
docker exec firelink-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic firelink.weather --from-beginning
```
