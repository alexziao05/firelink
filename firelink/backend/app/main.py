"""
FireLink Backend - Wildfire Evacuation Intelligence Platform

Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db, SessionLocal
from .services.data_loader import seed_database
from .routers import reports, routing, risk, layers

# Initialize FastAPI app
app = FastAPI(
    title="FireLink API",
    description="Wildfire evacuation intelligence platform",
    version="0.1.0"
)

# Configure CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(reports.router)
app.include_router(routing.router)
app.include_router(risk.router)
app.include_router(layers.router)


@app.on_event("startup")
def startup():
    """Initialize database and seed with data on startup."""
    init_db()
    db = SessionLocal()

    # Check if database already has data; seed only on first run
    from .models import Shelter
    if db.query(Shelter).count() == 0:
        seed_database(db)

    db.close()


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "FireLink API"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
