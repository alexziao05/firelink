"""
Router for evacuation routing endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..schemas import RouteRequest, RouteResponse
from ..database import get_db
from ..services.routing_engine import RoutingEngine

router = APIRouter(prefix="/route", tags=["routing"])


@router.post("", response_model=RouteResponse)
def compute_route(route_req: RouteRequest, db: Session = Depends(get_db)):
    """
    Compute a safe evacuation route to a shelter.
    If shelter_id is not provided, routes to the nearest shelter.
    """
    try:
        response = RoutingEngine.compute_route(
            db,
            route_req.start_latitude,
            route_req.start_longitude,
            route_req.shelter_id
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
