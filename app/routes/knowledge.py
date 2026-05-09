import logging

from fastapi import APIRouter, HTTPException

from app.schemas.knowledge import KnowledgeQueryRequest, KnowledgeQueryResponse
from app.services.knowledge.rag_query import query_agent

router = APIRouter(prefix="/knowledge", tags=["knowledge"])
logger = logging.getLogger(__name__)


@router.post("/query", response_model=KnowledgeQueryResponse)
def query_knowledge(req: KnowledgeQueryRequest) -> KnowledgeQueryResponse:
    try:
        reply = query_agent(phone_number=req.phone, user_message=req.message)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.exception("RAG query failed")
        raise HTTPException(status_code=502, detail=f"RAG pipeline error: {e}")
    return KnowledgeQueryResponse(reply=reply)
