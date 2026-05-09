import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.database import init_db
from .routes.context import router as context_router
from .routes.fire_incidents import router as fire_incidents_router
from .routes.weather_alerts import router as weather_alerts_router
from .routes.agents.recommendation import router as recommendation_router
from .routes.knowledge import router as knowledge_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="FireLink API",
    description="Wildfire evacuation intelligence platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(context_router)
app.include_router(fire_incidents_router)
app.include_router(weather_alerts_router)
app.include_router(recommendation_router)
app.include_router(knowledge_router)


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "FireLink API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
