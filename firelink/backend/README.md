(# FireLink Backend

This directory contains the FastAPI backend for FireLink.

## Quick Start

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

## API Endpoints (summary)

- `GET /health` — Health check
- `POST /reports` — Create incident report
- `GET /reports` — List reports
- `GET /reports/{id}` — Get report details
- `PATCH /reports/{id}` — Update report (resolve)
- `GET /layers/shelters` — Get evacuation shelters
- `GET /layers/fire` — Get fire reports (GeoJSON)
- `GET /risk/grid` — Risk heatmap data
- `POST /route` — Compute evacuation route

## Seed Data

Seed files live in `backend/seed/`. The app auto-seeds on first run.

## Development Notes

- Use `backend/requirements.txt` for dependencies.
- App entrypoint: `backend/app/main.py`.
- Database: SQLite (local development). Replace with Postgres for production.

If you want the frontend, it now lives in a separate repository—ask the team for the URL.
)
