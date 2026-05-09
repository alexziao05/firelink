# FireLink — Backend Only

This repository now contains the backend for FireLink (FastAPI). The frontend has been moved to a separate repository and is no longer part of this codebase.

Quick overview:

- Backend: Python + FastAPI + SQLite
- API Docs: http://localhost:8000/docs (when running locally)

If you need the frontend, check your organization's frontend repository or ask the team for the new repo URL.

## Quick Start (Backend)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000 and API docs at http://localhost:8000/docs

## Project Structure

```
backend/
├── README.md            # Backend setup & API docs
├── requirements.txt     # Python dependencies
└── app/                 # FastAPI application
    ├── main.py
    ├── models.py
    ├── schemas.py
    ├── database.py
    ├── routers/
    └── services/
```

## Support

For backend setup or API questions, see `backend/README.md`.

---
