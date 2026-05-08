# FireLink - Wildfire Evacuation Intelligence Platform

**24-Hour Hackathon MVP**

FireLink is a real-time wildfire evacuation intelligence platform that helps communities respond to emergencies by providing:

- **Incident Reporting**: Real-time reports of fires, blocked roads, smoke, and assistance needs
- **Risk Scoring**: Dynamic evacuation risk assessment based on hazard proximity
- **Smart Routing**: Safest evacuation routes to designated shelters
- **Interactive Visualization**: Real-time map with hazard layers and evacuation routes

## Architecture

```
┌─────────────────────────────────────────┐
│         FireLink Frontend                │
│    (React + TypeScript + Leaflet)       │
│   - Interactive Map                     │
│   - Report Form                         │
│   - Route Planning                      │
└──────────────────┬──────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────┐
│       FireLink Backend                   │
│    (FastAPI + SQLAlchemy + SQLite)      │
│   - Report Management                   │
│   - Risk Engine                         │
│   - Routing Engine                      │
│   - Data Layers API                     │
└─────────────────────────────────────────┘
```

## Quick Start

### Backend Setup

```bash
cd evaclink/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd evaclink/frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will open at: `http://localhost:3000`

## API Endpoints

### Health & Status

- `GET /health` - Health check

### Reports

- `POST /reports` - Create incident report
- `GET /reports` - List reports
- `GET /reports/{id}` - Get report details
- `PATCH /reports/{id}` - Update report (mark resolved)

### Data Layers

- `GET /layers/shelters` - Get all shelters
- `GET /layers/fire` - Get active fire reports (GeoJSON)

### Risk Analysis

- `GET /risk/grid?min_lat=X&max_lat=Y&min_lon=A&max_lon=B` - Get risk grid

### Routing

- `POST /route` - Compute safest evacuation route

## Report Types

- **🔥 Fire Seen** - Active fire spotted in area
- **🛑 Blocked Road** - Road blocked by debris/damage
- **💨 Heavy Smoke** - Severe smoke reducing visibility
- **🆘 Assistance Needed** - Residents need evacuation help
- **⚡ Power Outage** - Power or signal outage

## Risk Scoring Algorithm

The risk engine computes evacuation risk (0.0 - 1.0) based on:

1. **Fire Proximity** (2km radius)
   - Highest risk weight
   - Decreases with distance from fire

2. **Blocked Roads** (1.5km radius)
   - High risk weight
   - Indicates impassable evacuation routes

3. **Heavy Smoke** (1km radius)
   - Medium risk weight
   - Affects visibility and air quality

Risk scores are combined and capped at 1.0 (maximum danger).

## Routing Algorithm (MVP)

Current implementation returns mock routes with risk analysis:

1. Finds nearest shelter to evacuation start point
2. Samples 10 points along route to compute average risk
3. Detects nearby hazards and generates explanation
4. Returns GeoJSON LineString, risk score, and route reasoning

Future: Can be replaced with NetworkX/OSMnx for real road network routing.

## Database

Uses SQLite for MVP deployment:

- Automatic creation on first run
- Pre-seeded with:
  - 3 evacuation shelters
  - 3 fire point reports
  - 3 mock incident reports

Located at: `evaclink/backend/evaclink.db`

## Development Notes

### CORS Configuration

Backend is configured for local development:

- `http://localhost:3000` (React default)
- `http://localhost:5173` (Vite default)

### Real-Time Updates

- Frontend auto-refreshes data every 30 seconds
- Consider adding WebSockets for live incident feeds in production

### Mock Data

Seed files located in `backend/seed/`:

- `shelters.json` - Evacuation shelter locations
- `fire_points.json` - Active fire reports
- `mock_reports.json` - Sample incident reports

Update these files to test with different scenarios.

## Project Structure

```
evaclink/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic validation
│   │   ├── database.py          # DB config
│   │   ├── routers/
│   │   │   ├── reports.py       # Report endpoints
│   │   │   ├── routing.py       # Route endpoint
│   │   │   ├── risk.py          # Risk grid endpoint
│   │   │   └── layers.py        # Data layer endpoints
│   │   └── services/
│   │       ├── risk_engine.py   # Risk scoring logic
│   │       ├── routing_engine.py# Route computation
│   │       └── data_loader.py   # Database seeding
│   ├── seed/
│   │   ├── shelters.json
│   │   ├── fire_points.json
│   │   └── mock_reports.json
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapView.tsx
│   │   │   ├── ReportForm.tsx
│   │   │   ├── RoutePanel.tsx
│   │   │   └── RiskLegend.tsx
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
└── README.md
```

## Technologies Used

### Backend

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight embedded database
- **Pydantic** - Data validation with Python type hints
- **Uvicorn** - ASGI server

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Leaflet** - Interactive mapping library
- **CSS** - Styling (inline for hackathon MVP)

## Deployment Considerations

### Production Setup

1. Replace SQLite with PostgreSQL
2. Add user authentication
3. Deploy with Docker containers
4. Use environment variables for configuration
5. Add request rate limiting
6. Implement request logging
7. Add data backup strategy

### Scaling

1. Move risk computation to background jobs (Celery)
2. Add caching layer (Redis)
3. Implement database indexing on location fields
4. Use spatial indexing (PostGIS) for geographic queries
5. Add CDN for frontend assets

## Future Enhancements

- Real OSM routing with NetworkX/OSMnx
- Live integration with USGS fire data
- Weather data integration (wind, temperature)
- Push notifications for incidents
- User authentication and roles
- Mobile app with offline support
- Historical incident tracking
- Predictive evacuation modeling
- Integration with emergency services
- Multi-shelter evacuation planning

## Hackathon Notes

This is a **24-hour hackathon MVP** designed to be:

- ✅ **Quick to set up** - No external dependencies, SQLite DB
- ✅ **Easy to demo** - Mock data pre-seeded
- ✅ **Extensible** - Clean architecture for future features
- ✅ **Full-stack** - Working frontend and backend
- ✅ **Well-documented** - Code comments and READMEs

**Estimated Setup Time**: ~10 minutes
**Tech Stack**: Python + React (no DevOps required)

## Team Notes

- Backend team: Focus on risk engine refinement and routing algorithms
- Frontend team: Enhance UI/UX, add animations, improve map styling
- Data team: Improve seed data, add real geographic scenarios
- DevOps team: Add Docker, CI/CD, cloud deployment options

---

**Built with ❤️ for wildfire emergency response**

> **Team Note**: See [Team Setup Guide](#team-setup) below for collaboration instructions.
