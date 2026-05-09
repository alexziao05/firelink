"""
rag_query.py
------------
Called every time a user sends an SMS to FireLink.
Takes the user's phone number + message, retrieves relevant fire
knowledge from Pinecone, injects their profile from mock_users.json,
and returns a Claude-generated SMS response.

Usage (standalone test):
    python -m app.services.knowledge.rag_query

Designed to be imported by the FastAPI route or a Twilio SMS webhook:
    from app.services.knowledge.rag_query import query_agent
    response = query_agent(phone_number="+16195550001", user_message="There's smoke outside")
"""

import os
import json
from pathlib import Path
from dotenv import load_dotenv

from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
import anthropic

load_dotenv()

# ── Config ───────────────────────────────────────────────────────────────────

OPENAI_API_KEY   = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME       = os.getenv("PINECONE_INDEX_NAME", "emberlink")
DOCS_NAMESPACE   = "docs"
TOP_K            = 5

# Resolve data files relative to this file: app/services/knowledge/rag_query.py
# parents[3] climbs to repo root (knowledge → services → app → root).
PROJECT_ROOT     = Path(__file__).resolve().parents[3]
MOCK_USERS_PATH  = PROJECT_ROOT / "app" / "data" / "mock_users.json"
TEST_CASES_PATH  = PROJECT_ROOT / "app" / "data" / "rag_test_cases.json"


def load_mock_users() -> dict:
    if not MOCK_USERS_PATH.exists():
        raise FileNotFoundError(
            f"mock_users.json not found at {MOCK_USERS_PATH}. "
            "Create it with at least one user profile."
        )

    with open(MOCK_USERS_PATH, "r") as f:
        users_list = json.load(f)

    return {user["phone"]: user for user in users_list}


def serialize_user_profile(profile: dict) -> str:
    name        = profile.get("name", "The user")
    zip_code    = profile.get("zip", "unknown ZIP")
    pets        = profile.get("pets", 0)
    has_vehicle = profile.get("has_vehicle", True)
    medical     = profile.get("medical_device", False)
    needs_ride  = profile.get("needs_ride", False)
    volunteer   = profile.get("volunteer", False)
    prep_done   = profile.get("prep_steps_complete", 0)
    prep_total  = profile.get("prep_steps_total", 5)

    vehicle_str  = "has a vehicle" if has_vehicle else "has no vehicle"
    medical_str  = "uses a medical device" if medical else "no medical device"
    ride_str     = "needs a ride to evacuate" if needs_ride else "can self-evacuate"
    volunteer_str = "is a registered volunteer" if volunteer else ""
    pets_str     = f"has {pets} pet{'s' if pets != 1 else ''}" if pets > 0 else "no pets"

    parts = [
        f"{name} lives in ZIP {zip_code}.",
        f"They {pets_str}, {vehicle_str}, {medical_str}, and {ride_str}.",
        f"They have completed {prep_done} of {prep_total} preparedness steps.",
    ]
    if volunteer_str:
        parts.append(f"{name} {volunteer_str}.")

    return " ".join(parts)


def retrieve_chunks(user_message: str) -> list[str]:
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=OPENAI_API_KEY,
    )

    vector_store = PineconeVectorStore(
        index_name=INDEX_NAME,
        embedding=embeddings,
        namespace=DOCS_NAMESPACE,
    )

    results = vector_store.similarity_search(user_message, k=TOP_K)
    return [doc.page_content for doc in results]


def build_prompt(user_profile_str: str, chunks: list[str], user_message: str) -> str:
    chunks_text = "\n\n".join(
        f"[Source {i+1}]:\n{chunk}" for i, chunk in enumerate(chunks)
    )

    return f"""You are EmberLink, a calm emergency wildfire assistant responding via SMS.
Only use the information provided below to answer. Do not add information not present here.
If you cannot answer from the provided knowledge, say: "I don't have specific guidance for that. Please call 911 if you are in immediate danger."

USER PROFILE:
{user_profile_str}

RELEVANT KNOWLEDGE:
{chunks_text}

USER MESSAGE:
"{user_message}"

Respond in 1-3 short sentences. Be direct, calm, and actionable. No bullet points — this is an SMS."""


def call_claude(prompt: str) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        messages=[
            {"role": "user", "content": prompt}
        ],
    )

    return message.content[0].text


def query_agent(phone_number: str, user_message: str) -> str:
    """
    Full RAG pipeline for one incoming SMS.

    Args:
        phone_number: E.164 format e.g. "+16195550001"
        user_message: raw text the user sent

    Returns:
        SMS response string from Claude
    """
    users = load_mock_users()
    profile = users.get(phone_number)

    if profile:
        user_profile_str = serialize_user_profile(profile)
    else:
        user_profile_str = "User profile unknown. No personalization available."

    chunks = retrieve_chunks(user_message)
    prompt = build_prompt(user_profile_str, chunks, user_message)
    return call_claude(prompt)


def load_test_cases() -> list[dict]:
    if not TEST_CASES_PATH.exists():
        raise FileNotFoundError(
            f"rag_test_cases.json not found at {TEST_CASES_PATH}."
        )
    with open(TEST_CASES_PATH, "r") as f:
        return json.load(f)


if __name__ == "__main__":
    test_cases = load_test_cases()

    for test in test_cases:
        print(f"\n{'='*50}")
        print(f"Phone:   {test['phone']}")
        print(f"Message: {test['message']}")
        print(f"{'='*50}")
        response = query_agent(
            phone_number=test["phone"],
            user_message=test["message"],
        )
        print(f"EmberLink: {response}")
