"""Community dashboard data — JSON-backed, in-memory cached for low latency."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "communities"


@lru_cache(maxsize=64)
def _load(zip_code: str) -> dict | None:
    path = DATA_DIR / f"{zip_code}.json"
    if not path.is_file():
        return None
    with open(path) as f:
        return json.load(f)


def get_community(zip_code: str) -> dict | None:
    return _load(zip_code.strip())
