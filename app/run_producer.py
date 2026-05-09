import asyncio
import logging
import sys

from app.core.database import init_db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s",
)


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m app.run_producer <calfire|noaa>")
        sys.exit(1)

    name = sys.argv[1]
    if name == "calfire":
        from app.services.producers.calfire_producer import CalFireProducer
        producer = CalFireProducer()
    elif name == "noaa":
        from app.services.producers.noaa_producer import NoaaProducer
        producer = NoaaProducer()
    else:
        print(f"Unknown producer: {name}. Choose 'calfire' or 'noaa'.")
        sys.exit(1)

    init_db()
    asyncio.run(producer.run())


if __name__ == "__main__":
    main()
