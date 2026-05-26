from fastapi import APIRouter, HTTPException

from app.services.community_service import get_community

router = APIRouter(prefix="/community", tags=["community"])


@router.get("/{zip_code}")
def community_dashboard(zip_code: str):
    data = get_community(zip_code)
    if data is None:
        raise HTTPException(status_code=404, detail=f"No community data for ZIP {zip_code}")
    return data
