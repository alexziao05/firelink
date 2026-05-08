"""
Router for data layers (shelters, fire points, etc.).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..models import Shelter
from ..schemas import ShelterRead
from ..database import get_db

router = APIRouter(prefix="/layers", tags=["layers"])


@router.get("/fire", response_model=list[dict])
def get_fire_layer(db: Session = Depends(get_db)):
    """
    Get all active fire reports as a GeoJSON feature collection.
    """
    from ..models import Report, ReportType
    
    fire_reports = db.query(Report).filter(
        Report.report_type == ReportType.FIRE_SEEN,
        Report.is_resolved == 0
    ).all()
    
    features = [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [report.longitude, report.latitude]
            },
            "properties": {
                "id": report.id,
                "type": "fire",
                "note": report.note,
                "created_at": report.created_at.isoformat()
            }
        }
        for report in fire_reports
    ]
    
    return {
        "type": "FeatureCollection",
        "features": features
    }


@router.get("/shelters", response_model=list[ShelterRead])
def get_shelters_layer(db: Session = Depends(get_db)):
    """Get all shelters."""
    shelters = db.query(Shelter).all()
    return shelters
