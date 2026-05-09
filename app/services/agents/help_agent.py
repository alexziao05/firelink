"""
Help Agent — unified conversational SMS handler.

Blends:
  - User profile (mock_users.json)
  - Latest fire + weather context (Kafka via context_service)
  - Latest official advisory (Kafka firelink.recommendations)
  - RAG chunks (Pinecone, top-K)
  - Open shelter list (shelters.json)

into a single Claude prompt and returns an SMS-shaped reply in the user's
language.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from pathlib import Path

import anthropic

from app.services.context_service import (
    get_latest_context,
    get_latest_recommendation,
)
from app.services.knowledge.rag_query import (
    PROJECT_ROOT,
    load_mock_users,
    retrieve_chunks,
    serialize_user_profile,
)

logger = logging.getLogger(__name__)

SHELTERS_PATH = PROJECT_ROOT / "app" / "data" / "shelters.json"

CLAUDE_MODEL = "claude-sonnet-4-20250514"
MAX_TOKENS = 400


def load_shelters() -> list[dict]:
    if not SHELTERS_PATH.exists():
        return []
    with open(SHELTERS_PATH, "r") as f:
        return json.load(f)


def serialize_shelters(shelters: list[dict]) -> str:
    if not shelters:
        return "No shelter data available."
    lines = []
    for s in shelters:
        flags = []
        if s.get("has_pet_area"):
            flags.append("pet-friendly")
        if s.get("accessible"):
            flags.append("ADA-accessible")
        flags_str = ", ".join(flags) if flags else "no extra amenities"
        status = "OPEN" if s.get("open") else "CLOSED"
        lines.append(
            f"- [{status}] {s['name']} — {s['address']} (capacity {s.get('capacity', '?')}; {flags_str})"
        )
    return "\n".join(lines)


def serialize_fire(fire_records: list[dict]) -> str:
    if not fire_records:
        return "No recent fire data available."
    latest = fire_records[-1]
    return (
        f"{latest.get('name', 'Fire')} — "
        f"{latest.get('acres', '?')} acres, "
        f"containment {latest.get('containment', '?')}%, "
        f"status: {latest.get('status', 'unknown')}, "
        f"as of {latest.get('timestamp', 'unknown')}."
    )


def serialize_weather(weather_records: list[dict]) -> str:
    if not weather_records:
        return "No recent weather data available."
    latest = weather_records[-1]
    return (
        f"{latest.get('event', 'Weather')} ({latest.get('severity', '?')}) — "
        f"wind {latest.get('wind_mph', '?')} mph, "
        f"humidity {latest.get('humidity_pct', '?')}%, "
        f"area: {latest.get('area', 'unknown')}, "
        f"as of {latest.get('timestamp', 'unknown')}."
    )


def serialize_advisory(advisory: dict | None) -> str:
    if not advisory:
        return "No official advisory issued yet."
    return (
        f"Risk: {advisory.get('risk_level', 'unknown')}. "
        f"Advisory: {advisory.get('advisory', 'n/a')} "
        f"(reason: {advisory.get('reasoning', 'n/a')})"
    )


def build_prompt(
    profile_text: str,
    fire_text: str,
    weather_text: str,
    advisory_text: str,
    shelter_text: str,
    rag_text: str,
    user_message: str,
) -> str:
    return f"""You are EmberLink, a calm, multilingual emergency assistant for the 2025 Eaton Fire in Los Angeles.
You respond via SMS: 1-3 short sentences, plain text, no markdown, no bullet points.

Detect the language of the USER MESSAGE and respond in the SAME language. Match the user's language exactly.

Use ONLY the information provided below. If you cannot answer from this information, reply (translated into the user's language):
"I don't have specific guidance for that. Please call 911 if you are in immediate danger."

USER PROFILE:
{profile_text}

LATEST FIRE STATUS:
{fire_text}

LATEST WEATHER:
{weather_text}

LATEST OFFICIAL ADVISORY:
{advisory_text}

NEARBY SHELTERS:
{shelter_text}

RELEVANT KNOWLEDGE:
{rag_text}

USER MESSAGE:
"{user_message}"

Respond as EmberLink:"""


async def _retrieve_chunks_async(message: str) -> list[str]:
    return await asyncio.to_thread(retrieve_chunks, message)


async def _call_claude(prompt: str) -> str:
    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    message = await client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


async def handle_sms(phone: str, user_message: str) -> str:
    """Full Help-Agent pipeline for one inbound SMS. Returns the reply text."""
    # 1. User profile
    try:
        users = load_mock_users()
        profile = users.get(phone)
        profile_text = (
            serialize_user_profile(profile)
            if profile
            else "User profile unknown. No personalization available."
        )
    except FileNotFoundError as e:
        logger.warning("mock_users missing: %s", e)
        profile_text = "User profile unavailable."

    # 2. Fire + weather context, advisory, RAG, shelters — fan out
    fire_weather_task = asyncio.create_task(get_latest_context())
    advisory_task = asyncio.create_task(get_latest_recommendation())
    rag_task = asyncio.create_task(_retrieve_chunks_async(user_message))

    fire_records: list[dict] = []
    weather_records: list[dict] = []
    advisory: dict | None = None
    chunks: list[str] = []

    try:
        ctx = await fire_weather_task
        fire_records = ctx.get("fire", [])
        weather_records = ctx.get("weather", [])
    except Exception as e:
        logger.warning("fire/weather context unavailable: %s", e)

    try:
        advisory = await advisory_task
    except Exception as e:
        logger.warning("advisory unavailable: %s", e)

    try:
        chunks = await rag_task
    except Exception as e:
        logger.warning("RAG retrieval failed: %s", e)

    shelters = load_shelters()

    rag_text = (
        "\n\n".join(f"[Source {i+1}]:\n{c}" for i, c in enumerate(chunks))
        if chunks
        else "No knowledge chunks retrieved."
    )

    prompt = build_prompt(
        profile_text=profile_text,
        fire_text=serialize_fire(fire_records),
        weather_text=serialize_weather(weather_records),
        advisory_text=serialize_advisory(advisory),
        shelter_text=serialize_shelters(shelters),
        rag_text=rag_text,
        user_message=user_message,
    )

    return await _call_claude(prompt)
