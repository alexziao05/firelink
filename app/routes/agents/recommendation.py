import logging

from fastapi import APIRouter, HTTPException

from app.services.context_service import get_latest_recommendation

router = APIRouter(prefix="/agents", tags=["agents"])
logger = logging.getLogger(__name__)


@router.get("/recommendations/latest")
async def latest_recommendation():
    try:
        result = await get_latest_recommendation()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Could not read recommendations: {e}")
    if result is None:
        raise HTTPException(status_code=404, detail="No recommendations published yet")
    return result
