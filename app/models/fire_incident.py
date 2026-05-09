from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, Text

from .base import Base


class FireIncident(Base):
    __tablename__ = "fire_incidents"

    id          = Column(String, primary_key=True)
    name        = Column(String)
    latitude    = Column(Float)
    longitude   = Column(Float)
    acres       = Column(Integer)
    containment = Column(Float)
    status      = Column(Text)
    timestamp   = Column(DateTime)
    saved_at    = Column(DateTime, default=lambda: datetime.now(timezone.utc))


Index("ix_fire_incidents_timestamp", FireIncident.timestamp)
