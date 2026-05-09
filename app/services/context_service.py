import asyncio
import json
import logging
from datetime import datetime, timezone

from aiokafka import AIOKafkaConsumer, TopicPartition
from app.core.kafka import KAFKA_BOOTSTRAP

logger = logging.getLogger(__name__)

TOPICS = {
    "weather": "firelink.weather",
    "fire":    "firelink.fire",
}

RECOMMENDATIONS_TOPIC = "firelink.recommendations"

MESSAGES_PER_TOPIC = 10


async def _read_latest(topic: str, n: int) -> list[dict]:
    consumer = AIOKafkaConsumer(
        topic,
        bootstrap_servers=KAFKA_BOOTSTRAP,
        auto_offset_reset="earliest",
        enable_auto_commit=False,
    )
    await consumer.start()
    try:
        partitions = [TopicPartition(topic, p) for p in consumer.partitions_for_topic(topic) or [0]]
        end_offsets = await consumer.end_offsets(partitions)

        messages = []
        for tp in partitions:
            end = end_offsets[tp]
            if end == 0:
                continue
            start = max(0, end - n)
            consumer.seek(tp, start)
            for _ in range(end - start):
                try:
                    msg = await asyncio.wait_for(consumer.getone(tp), timeout=2.0)
                    messages.append(json.loads(msg.value))
                except asyncio.TimeoutError:
                    logger.warning("Timeout reading from topic %s partition %d", topic, tp.partition)
                    break
                except Exception as e:
                    logger.error("Error reading from topic %s: %s", topic, e, exc_info=True)
                    break
        return messages
    finally:
        await consumer.stop()


async def get_latest_context() -> dict:
    try:
        weather, fire = await asyncio.wait_for(
            asyncio.gather(
                _read_latest(TOPICS["weather"], MESSAGES_PER_TOPIC),
                _read_latest(TOPICS["fire"], MESSAGES_PER_TOPIC),
            ),
            timeout=10.0,
        )
    except asyncio.TimeoutError:
        logger.error("context fetch timed out after 10s")
        raise
    return {
        "weather": weather,
        "fire":    fire,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


async def get_latest_recommendation() -> dict | None:
    """Read the most recent advisory from the recommendations topic, or None if empty."""
    consumer = AIOKafkaConsumer(
        RECOMMENDATIONS_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP,
        auto_offset_reset="earliest",
        enable_auto_commit=False,
    )
    await consumer.start()
    try:
        partitions = [
            TopicPartition(RECOMMENDATIONS_TOPIC, p)
            for p in consumer.partitions_for_topic(RECOMMENDATIONS_TOPIC) or [0]
        ]
        end_offsets = await consumer.end_offsets(partitions)
        for tp in partitions:
            end = end_offsets[tp]
            if end == 0:
                return None
            consumer.seek(tp, end - 1)
            msg = await asyncio.wait_for(consumer.getone(tp), timeout=3.0)
            return json.loads(msg.value)
        return None
    finally:
        await consumer.stop()
