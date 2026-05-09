import json
import os
from .base_producer import BaseProducer
from app.models import FireIncident

DATA_FILE = os.path.join(os.path.dirname(__file__), "../../data/fire_incidents.json")


class CalFireProducer(BaseProducer):
    topic = "firelink.fire"
    interval = 10
    model_class = FireIncident

    def __init__(self):
        with open(DATA_FILE) as f:
            self._queue = json.load(f)  # already sorted chronologically

    async def fetch(self) -> list[dict]:
        if not self._queue:
            with open(DATA_FILE) as f:
                self._queue = json.load(f)
        return [self._queue.pop(0)]
