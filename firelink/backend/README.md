# FireLink Backend

FastAPI backend for the FireLink wildfire evacuation intelligence platform.

## Setup

### Prerequisites

- Python 3.10+
- pip

### Installation

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running:

- **Interactive Swagger UI**: http://localhost:8000/docs
  - Test all endpoints directly from your browser
  - See request/response schemas
- **ReDoc**: http://localhost:8000/redoc

## Database

The application uses SQLite for the MVP. The database file (`evaclink.db`) is created automatically on first run and seeded with sample data:

- 3 shelters
- 3 fire points
- 3 mock incident reports

## API Endpoints

### Health & Status

- `GET /health` - Health check

### Reports

- `POST /reports` - Create a new incident report
- `GET /reports` - Get all reports (with optional type filter)
- `GET /reports/{report_id}` - Get a specific report
- `PATCH /reports/{report_id}` - Update a report (mark as resolved, add notes)

### Shelters & Layers

- `GET /layers/shelters` - Get all shelter locations
- `GET /layers/fire` - Get active fire reports as GeoJSON

### Risk Analysis

- `GET /risk/grid?min_lat=X&max_lat=Y&min_lon=A&max_lon=B` - Get risk grid for visualization

### Routing

- `POST /route` - Compute safest evacuation route to a shelter

## Report Types

- `blocked_road` - Road blocked by debris or damage
- `fire_seen` - Active fire spotted
- `heavy_smoke` - Heavy smoke in area
- `assistance_needed` - Residents need evacuation help
- `power_outage` - Power or signal outage

## Risk Scoring

The risk engine computes evacuation risk based on:

- **Fire proximity** (2km radius) - highest weight
- **Blocked roads** (1.5km radius) - high weight
- **Smoke** (1km radius) - medium weight

Risk scores range from 0.0 to 1.0, where 1.0 is maximum danger.

## Project Structure

```
backend/
  app/
    main.py              # FastAPI app initialization
    models.py            # SQLAlchemy database models
    schemas.py           # Pydantic validation schemas
    database.py          # Database configuration
    routers/
      reports.py         # Report management endpoints
      routing.py         # Route computation endpoint
      risk.py            # Risk analysis endpoint
      layers.py          # Data layer endpoints
    services/
      risk_engine.py     # Risk scoring logic
      routing_engine.py  # Route computation logic
      data_loader.py     # Database seeding
  seed/
    shelters.json        # Shelter seed data
    fire_points.json     # Fire seed data
    mock_reports.json    # Mock report seed data
```

## Development Notes

- The routing engine currently returns mock routes between start and nearest shelter
- This can be replaced with NetworkX/OSMnx for real-world routing
- Risk grid uses 0.01 degree steps (~1km at equator) for sampling
- CORS is configured for local development (localhost:3000, localhost:5173)

## Future Enhancements

- Real OSM road network routing (NetworkX/OSMnx)
- WebSocket updates for real-time incident feeds
- Authentication and user management
- Advanced risk modeling
- Integration with real fire/hazard data sources
