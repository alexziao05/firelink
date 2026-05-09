import asyncio
import json
from datetime import datetime, timezone

from aiokafka import AIOKafkaConsumer, TopicPartition
from app.core.kafka import KAFKA_BOOTSTRAP

TOPICS = {
    "weather": "firelink.weather",
    "fire": "firelink.fire",
}

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
                except (asyncio.TimeoutError, Exception):
                    break
        return messages
    finally:
        await consumer.stop()


async def get_latest_context() -> dict:
    weather, fire = await asyncio.gather(
        _read_latest(TOPICS["weather"], MESSAGES_PER_TOPIC),
        _read_latest(TOPICS["fire"], MESSAGES_PER_TOPIC),
    )
    return {
        "weather": weather,
        "fire": fire,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
