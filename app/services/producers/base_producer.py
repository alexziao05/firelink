import asyncio
import json
import logging

from aiokafka import AIOKafkaProducer
from app.core.kafka import KAFKA_BOOTSTRAP

logger = logging.getLogger(__name__)

RETRY_BASE = 2
RETRY_MAX = 30


class BaseProducer:
    topic: str
    interval: int
    model_class = None

    async def fetch(self) -> list[dict]:
        raise NotImplementedError

    async def run(self):
        producer = await self._connect()
        try:
            while True:
                try:
                    records = await self.fetch()
                    for record in records:
                        await producer.send(self.topic, json.dumps(record).encode())
                        logger.info("%s → %s: %s", self.__class__.__name__, self.topic, json.dumps(record))
                        await asyncio.to_thread(self._save_to_db, record)
                except asyncio.CancelledError:
                    raise
                except Exception as e:
                    logger.error("%s fetch error: %s", self.__class__.__name__, e, exc_info=True)
                await asyncio.sleep(self.interval)
        finally:
            await producer.stop()

    def _save_to_db(self, record: dict):
        if self.model_class is None:
            return
        from datetime import datetime
        from app.core.database import SessionLocal
        row = dict(record)
        if "timestamp" in row and isinstance(row["timestamp"], str):
            row["timestamp"] = datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00"))
        db = SessionLocal()
        try:
            db.merge(self.model_class(**row))
            db.commit()
        except Exception as e:
            logger.error("%s DB save error: %s", self.__class__.__name__, e)
            db.rollback()
        finally:
            db.close()

    async def _connect(self) -> AIOKafkaProducer:
        delay = RETRY_BASE
        attempt = 0
        while True:
            attempt += 1
            producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP)
            try:
                await producer.start()
                logger.info("%s connected to Kafka (attempt %d)", self.__class__.__name__, attempt)
                return producer
            except Exception as e:
                await producer.stop()
                logger.warning(
                    "%s Kafka not ready (attempt %d): %s. Retry in %ds",
                    self.__class__.__name__, attempt, e, delay,
                )
                await asyncio.sleep(delay)
                delay = min(delay * 2, RETRY_MAX)
