from pydantic import BaseModel, Field


class SMSInboundRequest(BaseModel):
    phone: str = Field(..., description="E.164 phone number, e.g. +16195550001")
    message: str = Field(..., min_length=1, description="Inbound SMS body")


class SMSOutboundResponse(BaseModel):
    reply: str
