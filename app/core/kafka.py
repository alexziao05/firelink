import os
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")


async def get_producer() -> AIOKafkaProducer:
    producer = AIOKafkaProducer(bootstrap_servers=KAFKA_BOOTSTRAP)
    await producer.start()
    return producer


async def get_consumer(topics: list[str], group_id: str = None) -> AIOKafkaConsumer:
    consumer = AIOKafkaConsumer(
        *topics,
        bootstrap_servers=KAFKA_BOOTSTRAP,
        auto_offset_reset="earliest",
        enable_auto_commit=False,
        group_id=group_id,
    )
    await consumer.start()
    return consumer
