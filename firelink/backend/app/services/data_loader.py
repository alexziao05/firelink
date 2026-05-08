"""
Data loader service to seed the database with initial data.
"""
import json
import os
from sqlalchemy.orm import Session
from ..models import Report, Shelter, ReportType


def load_shelters(db: Session, filepath: str = None):
    """Load shelters from JSON into the database."""
    if filepath is None:
        filepath = os.path.join(os.path.dirname(__file__), "../../seed/shelters.json")
    
    if not os.path.exists(filepath):
        print(f"Shelters file not found: {filepath}")
        return
    
    with open(filepath, "r") as f:
        shelters_data = json.load(f)
    
    for shelter in shelters_data:
        existing = db.query(Shelter).filter(Shelter.name == shelter["name"]).first()
        if not existing:
            db_shelter = Shelter(**shelter)
            db.add(db_shelter)
    
    db.commit()
    print(f"Loaded {len(shelters_data)} shelters")


def load_fire_points(db: Session, filepath: str = None):
    """Load fire points from JSON into the database as reports."""
    if filepath is None:
        filepath = os.path.join(os.path.dirname(__file__), "../../seed/fire_points.json")
    
    if not os.path.exists(filepath):
        print(f"Fire points file not found: {filepath}")
        return
    
    with open(filepath, "r") as f:
        fire_points = json.load(f)
    
    for fire_point in fire_points:
        fire_point["report_type"] = ReportType.FIRE_SEEN
        existing = db.query(Report).filter(
            Report.latitude == fire_point["latitude"],
            Report.longitude == fire_point["longitude"],
            Report.report_type == ReportType.FIRE_SEEN
        ).first()
        if not existing:
            db_report = Report(**fire_point)
            db.add(db_report)
    
    db.commit()
    print(f"Loaded {len(fire_points)} fire points")


def load_mock_reports(db: Session, filepath: str = None):
    """Load mock reports from JSON into the database."""
    if filepath is None:
        filepath = os.path.join(os.path.dirname(__file__), "../../seed/mock_reports.json")
    
    if not os.path.exists(filepath):
        print(f"Mock reports file not found: {filepath}")
        return
    
    with open(filepath, "r") as f:
        reports_data = json.load(f)
    
    for report in reports_data:
        report["report_type"] = ReportType[report["report_type"].upper()]
        existing = db.query(Report).filter(
            Report.latitude == report["latitude"],
            Report.longitude == report["longitude"],
            Report.report_type == report["report_type"]
        ).first()
        if not existing:
            db_report = Report(**report)
            db.add(db_report)
    
    db.commit()
    print(f"Loaded {len(reports_data)} mock reports")


def seed_database(db: Session):
    """Load all seed data."""
    print("Seeding database...")
    load_shelters(db)
    load_fire_points(db)
    load_mock_reports(db)
    print("Database seeding complete!")
