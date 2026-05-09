import logging

from fastapi import APIRouter, HTTPException

from app.schemas.sms import SMSInboundRequest, SMSOutboundResponse
from app.services.agents.help_agent import handle_sms

router = APIRouter(prefix="/sms", tags=["sms"])
logger = logging.getLogger(__name__)


@router.post("/inbound", response_model=SMSOutboundResponse)
async def inbound_sms(req: SMSInboundRequest) -> SMSOutboundResponse:
    try:
        result = await handle_sms(phone=req.phone, user_message=req.message)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.exception("Help Agent failed")
        raise HTTPException(status_code=502, detail=f"Help Agent error: {e}")
    return SMSOutboundResponse(**result)
