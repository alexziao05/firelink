"""
SQLAlchemy models for EvacLink.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()


class ReportType(str, enum.Enum):
    """Enumeration of possible report types."""
    BLOCKED_ROAD = "blocked_road"
    FIRE_SEEN = "fire_seen"
    HEAVY_SMOKE = "heavy_smoke"
    ASSISTANCE_NEEDED = "assistance_needed"
    POWER_OUTAGE = "power_outage"


class Report(Base):
    """Model for incident reports."""
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(SQLEnum(ReportType), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_resolved = Column(Integer, default=0)  # 0 = False, 1 = True for SQLite compatibility


class Shelter(Base):
    """Model for evacuation shelters."""
    __tablename__ = "shelters"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=True)
    description = Column(String, nullable=True)
