import os

from fastmcp import FastMCP

from app.services.context_service import get_latest_context

mcp = FastMCP(
    name="FireLink Context",
    instructions="Provides real-time wildfire and weather alert context from Kafka streams.",
)


@mcp.tool()
async def get_context() -> dict:
    """Fetch the latest fire incidents and weather alerts from Kafka."""
    return await get_latest_context()


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
