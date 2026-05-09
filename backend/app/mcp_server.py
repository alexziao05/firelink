import os

from fastmcp import FastMCP

from app.services.context_service import get_latest_context
from app.services.dispatch_service import notify_dispatch as _notify_dispatch_impl

mcp = FastMCP(
    name="FireLink Context",
    instructions="Provides real-time wildfire and weather alert context from Kafka streams.",
)


@mcp.tool()
async def get_context() -> dict:
    """Fetch the latest fire incidents and weather alerts from Kafka."""
    return await get_latest_context()


@mcp.tool()
async def notify_dispatch(user_phone: str, emergency_type: str, details: str) -> dict:
    """Notify emergency dispatch (mock 911). Call ONLY for active life-threatening danger.

    Args:
        user_phone: E.164 phone of the person reporting the emergency.
        emergency_type: Short label, e.g. 'trapped', 'medical', 'fire_at_residence'.
        details: One-sentence summary of the situation.
    """
    return _notify_dispatch_impl(user_phone, emergency_type, details)


if __name__ == "__main__":
    transport = os.getenv("MCP_TRANSPORT", "stdio")
    if transport == "stdio":
        mcp.run()
    else:
        mcp.run(
            transport=transport,
            host=os.getenv("MCP_HOST", "0.0.0.0"),
            port=int(os.getenv("MCP_PORT", "8001")),
        )
