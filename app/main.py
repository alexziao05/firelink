import asyncio
import logging
from fastapi import FastAPI

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
from fastapi.middleware.cors import CORSMiddleware
from .core.database import init_db
from .routes.context import router as context_router
from .services.producers.noaa_producer import NoaaProducer
from .services.producers.calfire_producer import CalFireProducer

app = FastAPI(
    title="FireLink API",
    description="Wildfire evacuation intelligence platform",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(context_router)


@app.on_event("startup")
async def startup():
    init_db()
    asyncio.create_task(NoaaProducer().run())
    asyncio.create_task(CalFireProducer().run())


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "FireLink API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
