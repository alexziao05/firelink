import asyncio
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m app.run_agent <recommendation>")
        sys.exit(1)

    name = sys.argv[1]
    if name == "recommendation":
        from app.services.agents.recommendation_agent import RecommendationAgent
        agent = RecommendationAgent()
    else:
        print(f"Unknown agent: {name}. Choose 'recommendation'.")
        sys.exit(1)

    asyncio.run(agent.run())


if __name__ == "__main__":
    main()
