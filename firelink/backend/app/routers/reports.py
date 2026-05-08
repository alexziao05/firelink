"""
Router for incident reports management.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models import Report
from ..schemas import ReportCreate, ReportRead
from ..database import get_db

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportRead)
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    """Create a new incident report."""
    db_report = Report(
        report_type=report.report_type,
        latitude=report.latitude,
        longitude=report.longitude,
        note=report.note
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


@router.get("", response_model=list[ReportRead])
def get_reports(
    report_type: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all reports, optionally filtered by type."""
    query = db.query(Report)

    if report_type:
        query = query.filter(Report.report_type == report_type)

    reports = query.offset(skip).limit(limit).all()
    return reports


@router.get("/{report_id}", response_model=ReportRead)
def get_report(report_id: int, db: Session = Depends(get_db)):
    """Get a specific report by ID."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.patch("/{report_id}", response_model=ReportRead)
def update_report(
    report_id: int,
    is_resolved: bool = None,
    note: str = None,
    db: Session = Depends(get_db)
):
    """Update a report (mark as resolved or add note)."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if is_resolved is not None:
        report.is_resolved = 1 if is_resolved else 0

    if note is not None:
        report.note = note

    db.commit()
    db.refresh(report)
    return report
