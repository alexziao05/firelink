"""
FireLink Backend - Wildfire Evacuation Intelligence Platform

Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import init_db

# Initialize FastAPI app
app = FastAPI(
    title="FireLink API",
    description="Wildfire evacuation intelligence platform",
    version="0.1.0"
)

# Configure CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers

@app.on_event("startup")
def startup():
    """Initialize database and seed with data on startup."""
    init_db()


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
