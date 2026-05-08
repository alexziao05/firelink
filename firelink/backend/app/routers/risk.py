"""
Router for risk scoring and analysis endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..schemas import RiskCell
from ..database import get_db
from ..services.risk_engine import RiskEngine

router = APIRouter(prefix="/risk", tags=["risk"])


@router.get("/grid", response_model=list[RiskCell])
def get_risk_grid(
    min_lat: float,
    max_lat: float,
    min_lon: float,
    max_lon: float,
    db: Session = Depends(get_db)
):
    """
    Get risk grid for a bounding box.
    Returns cells with risk > 0 for visualization.
    """
    if min_lat >= max_lat or min_lon >= max_lon:
        raise HTTPException(status_code=400, detail="Invalid bounding box")

    risk_cells = RiskEngine.compute_risk_grid(db, min_lat, max_lat, min_lon, max_lon)

    return [
        RiskCell(latitude=lat, longitude=lon, risk_score=risk)
        for lat, lon, risk in risk_cells
    ]
