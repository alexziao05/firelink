import asyncio
import json
import logging

from .base_agent import BaseAgent
from app.services.context_service import get_latest_context

logger = logging.getLogger(__name__)

TOPIC = "firelink.recommendations"
INTERVAL = 60  # seconds


class RecommendationAgent(BaseAgent):

    async def run(self):
        producer = await self._connect_producer()
        try:
            while True:
                try:
                    context = await get_latest_context()
                    recommendation = await self.call_llm(context)
                    await producer.send(TOPIC, json.dumps(recommendation).encode())
                    logger.info(
                        "Advisory published [%s]: %s",
                        recommendation.get("risk_level", "?"),
                        recommendation.get("advisory", ""),
                    )
                except asyncio.CancelledError:
                    raise
                except Exception as e:
                    logger.error("RecommendationAgent error: %s", e, exc_info=True)
                await asyncio.sleep(INTERVAL)
        finally:
            await producer.stop()
