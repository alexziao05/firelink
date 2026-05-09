from datetime import datetime, timezone

from sqlalchemy import Column, Float, Integer, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class FireIncident(Base):
    __tablename__ = "fire_incidents"

    id          = Column(String, primary_key=True)
    name        = Column(String)
    latitude    = Column(Float)
    longitude   = Column(Float)
    acres       = Column(Integer)
    containment = Column(Float)
    status      = Column(Text)
    timestamp   = Column(String)
    saved_at    = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())


class WeatherAlert(Base):
    __tablename__ = "weather_alerts"

    id           = Column(String, primary_key=True)
    event        = Column(String)
    severity     = Column(String)
    area         = Column(String)
    description  = Column(Text)
    wind_mph     = Column(Float)
    humidity_pct = Column(Float)
    onset        = Column(String)
    expires      = Column(String)
    timestamp    = Column(String)
    saved_at     = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())
