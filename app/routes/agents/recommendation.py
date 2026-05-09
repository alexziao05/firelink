import asyncio
import json
import logging

from fastapi import APIRouter, HTTPException
from aiokafka import AIOKafkaConsumer, TopicPartition
from app.core.kafka import KAFKA_BOOTSTRAP

router = APIRouter(prefix="/agents", tags=["agents"])
logger = logging.getLogger(__name__)

TOPIC = "firelink.recommendations"


async def _read_latest_recommendation() -> dict | None:
    consumer = AIOKafkaConsumer(
        TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP,
        auto_offset_reset="earliest",
        enable_auto_commit=False,
    )
    await consumer.start()
    try:
        partitions = [TopicPartition(TOPIC, p) for p in consumer.partitions_for_topic(TOPIC) or [0]]
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


@router.get("/recommendations/latest")
async def latest_recommendation():
    try:
        result = await _read_latest_recommendation()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Could not read recommendations: {e}")
    if result is None:
        raise HTTPException(status_code=404, detail="No recommendations published yet")
    return result
