import asyncio
import json
import logging

from aiokafka import AIOKafkaProducer
from app.core.kafka import KAFKA_BOOTSTRAP

logger = logging.getLogger(__name__)

RETRY_DELAY = 5


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
                        logger.info(f"{self.__class__.__name__} → {self.topic}: {json.dumps(record)}")
                        await asyncio.to_thread(self._save_to_db, record)
                except Exception as e:
                    logger.error(f"{self.__class__.__name__} fetch error: {e}")
                await asyncio.sleep(self.interval)
        finally:
            await producer.stop()

    def _save_to_db(self, record: dict):
        if self.model_class is None:
            return
        from app.core.database import SessionLocal
        db = SessionLocal()
        try:
            db.merge(self.model_class(**record))
            db.commit()
        except Exception as e:
            logger.error(f"{self.__class__.__name__} DB save error: {e}")
            db.rollback()
        finally:
            db.close()

    async def _connect(self) -> AIOKafkaProducer:
        while True:
            producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP)
            try:
                await producer.start()
                logger.info(f"{self.__class__.__name__} connected to Kafka")
                return producer
            except Exception as e:
                await producer.stop()
                logger.warning(f"{self.__class__.__name__} Kafka not ready: {e}. Retry in {RETRY_DELAY}s")
                await asyncio.sleep(RETRY_DELAY)
