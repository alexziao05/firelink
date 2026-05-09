# FireLink - Wildfire Evacuation Intelligence Platform

**24-Hour Hackathon MVP**

FireLink is a real-time wildfire evacuation intelligence platform that helps communities respond to emergencies by providing:

- **Incident Reporting**: Real-time reports of fires, blocked roads, smoke, and assistance needs
- **Risk Scoring**: Dynamic evacuation risk assessment based on hazard proximity
- **Smart Routing**: Safest evacuation routes to designated shelters
- **Interactive Visualization**: Real-time map with hazard layers and evacuation routes

# FireLink — Backend Only

This folder contains the backend for FireLink. The frontend has been removed and is maintained in a separate repository.

## Quick Start (Backend)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

## Project highlights

- FastAPI app located at `backend/app`
- Seed data in `backend/seed`
- Requirements in `backend/requirements.txt`

If you need the frontend, check your organization's frontend repository or ask the team for the new repo URL.
