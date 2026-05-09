"""Mock emergency dispatch service. Demo only — does not contact real responders."""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

USERS_PATH = Path(__file__).resolve().parent.parent / "data" / "mock_users.json"
FALLBACK_POSITION = {"lat": 34.1478, "lon": -118.1445, "source": "mock_default_pasadena"}
MOCK_UNITS = ["LAFD Engine 12", "LAPD Unit 47"]
MOCK_ETA_MIN = 6


def _lookup_position(phone: str) -> dict:
    if not USERS_PATH.exists():
        return FALLBACK_POSITION
    with open(USERS_PATH) as f:
        users = json.load(f)
    for u in users:
        if u.get("phone") == phone and "lat" in u and "lon" in u:
            return {"lat": u["lat"], "lon": u["lon"], "source": "mock_user_profile"}
    return FALLBACK_POSITION


def notify_dispatch(user_phone: str, emergency_type: str, details: str) -> dict:
    """Mock 911 dispatch. Returns JSON for frontend rendering."""
    position = _lookup_position(user_phone)
    incident_id = f"EMG-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()

    response = {
        "status": "DISPATCHED",
        "incident_id": incident_id,
        "emergency_type": emergency_type,
        "details": details,
        "user_phone": user_phone,
        "position_logged": position,
        "dispatched_units": MOCK_UNITS,
        "eta_minutes": MOCK_ETA_MIN,
        "dispatched_at": now,
        "message": "Dispatch notified. Units en route.",
    }

    logger.warning(
        "[EMERGENCY] notify_dispatch phone=%s type=%s position=(%s,%s)",
        user_phone, emergency_type, position["lat"], position["lon"],
    )
    logger.warning(
        "[EMERGENCY] response incident_id=%s eta=%dmin units=%s",
        incident_id, MOCK_ETA_MIN, MOCK_UNITS,
    )
    return response
