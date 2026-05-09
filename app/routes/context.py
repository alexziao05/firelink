from fastapi import APIRouter, HTTPException
from app.services.context_service import get_latest_context

router = APIRouter(prefix="/context", tags=["context"])


@router.get("/latest")
async def latest_context():
    try:
        return await get_latest_context()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Kafka unavailable: {e}")
