import json
import os
from .base_producer import BaseProducer

DATA_FILE = os.path.join(os.path.dirname(__file__), "../../data/weather_alerts.json")


class NoaaProducer(BaseProducer):
    topic = "firelink.weather"
    interval = 10

    def __init__(self):
        with open(DATA_FILE) as f:
            self._queue = json.load(f)

    async def fetch(self) -> list[dict]:
        if not self._queue:
            with open(DATA_FILE) as f:
                self._queue = json.load(f)
        return [self._queue.pop(0)]
