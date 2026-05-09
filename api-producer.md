# FireLink — Real-Time Data Streaming Pipeline

## Context
FireLink needs live situational data (weather, fire incidents, federal disaster declarations) to power an AI agent that answers evacuation routing queries. The pipeline pulls from multiple external APIs asynchronously, funnels data through Kafka, and exposes a single `/context/latest` endpoint so the AI agent always gets a fresh snapshot without touching Kafka directly. No real fire is nearby, so CAL FIRE historical incidents are replayed as simulated live events.

**Everything runs in Docker Compose** — backend, Zookeeper, Kafka, and all producers are co-located. `make up` starts the full system.

---

## Architecture Overview

```
External APIs                  Producers (asyncio)         Kafka                    FastAPI
─────────────────────          ──────────────────          ────────────────         ──────────────────
NOAA NWS alerts/CA    ──────►  noaa_producer.py    ──────► firelink.weather  ──────► GET /context/latest
CAL FIRE historical   ──────►  calfire_producer.py ──────► firelink.fire            (reads last 10 msgs
FEMA disaster decls   ──────►  fema_producer.py    ──────► firelink.fema             from all topics,
                                                                                      returns JSON snapshot
                                                                                      for AI agent)
```

All services communicate over `firelink-network` (Docker bridge).
`backend` connects to Kafka at `kafka:9092` (internal DNS).

---

## External API Sources

| Source | Endpoint | Auth | Poll interval |
|--------|----------|------|---------------|
| NOAA NWS | `https://api.weather.gov/alerts/active?area=CA` | None | 60s |
| CAL FIRE (historical replay) | `https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Active_Incidents/FeatureServer/0/query` | None | Replay 1 incident / 15s |
| FEMA | `https://www.fema.gov/api/open/v2/disasterDeclarations?state=CA&$top=20` | None | 120s |

---

## Docker Compose — Full Service Map

3 containers: `firelink-zookeeper`, `firelink-kafka`, `firelink-backend`

```yaml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: firelink-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    networks:
      - firelink-network

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: firelink-kafka
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

  backend:
    build: .
    container_name: firelink-backend
    depends_on:
      - kafka
    environment:
      - KAFKA_BOOTSTRAP=kafka:9092
    ports:
      - "8000:8000"
    volumes:
      - ./app:/app/app
    networks:
      - firelink-network
```

---

## Kafka Topics

| Topic | Producer | Message shape |
|-------|----------|---------------|
| `firelink.weather` | noaa_producer | `{id, event, severity, area, description, onset, expires}` |
| `firelink.fire` | calfire_producer | `{id, name, latitude, longitude, acres, containment, updated_at}` |
| `firelink.fema` | fema_producer | `{id, disaster_type, state, declaration_date, title}` |

---

## File Structure

```
app/
  core/
    kafka.py                    ← AIOKafkaProducer + AIOKafkaConsumer factory
  services/
    producers/
      __init__.py
      base_producer.py          ← shared async poll loop with retry
      noaa_producer.py          ← NOAA NWS → firelink.weather (60s)
      calfire_producer.py       ← CAL FIRE historical replay → firelink.fire (15s)
      fema_producer.py          ← FEMA → firelink.fema (120s)
    context_service.py          ← reads last 10 msgs per topic, returns snapshot
  routes/
    context.py                  ← GET /context/latest
```

---

## AI Agent Interface

```
GET /context/latest
```
Returns:
```json
{
  "weather": [ ...last 10 NOAA alerts... ],
  "fire":    [ ...last 10 CAL FIRE incidents... ],
  "fema":    [ ...last 10 FEMA declarations... ],
  "fetched_at": "2026-05-08T19:00:00Z"
}
```
AI agent calls this endpoint before generating any evacuation recommendation.

---

## Verification

```bash
make up-build                         # start all 3 containers
curl http://localhost:8000/health     # → {"status": "healthy"}
# wait ~30s for producers to publish
curl http://localhost:8000/context/latest   # → JSON with all 3 arrays

# inspect Kafka directly
docker exec firelink-kafka kafka-topics --bootstrap-server localhost:9092 --list
docker exec firelink-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic firelink.fire --from-beginning
```
