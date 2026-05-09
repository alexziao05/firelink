from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Index, String, Text

from .base import Base


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
    timestamp    = Column(DateTime)
    saved_at     = Column(DateTime, default=lambda: datetime.now(timezone.utc))


Index("ix_weather_alerts_timestamp", WeatherAlert.timestamp)
