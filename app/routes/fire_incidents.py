from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repository.fire_incident import FireIncidentRepository
from app.schemas.fire_incident import FireIncidentCreate, FireIncidentResponse, FireIncidentUpdate

router = APIRouter(prefix="/fire-incidents", tags=["fire-incidents"])


def get_repo(db: Session = Depends(get_db)) -> FireIncidentRepository:
    return FireIncidentRepository(db)


@router.get("/", response_model=list[FireIncidentResponse])
def list_fire_incidents(
    skip: int = 0,
    limit: int = 100,
    repo: FireIncidentRepository = Depends(get_repo),
):
    return repo.get_all(skip=skip, limit=limit)


@router.get("/{id}", response_model=FireIncidentResponse)
def get_fire_incident(id: str, repo: FireIncidentRepository = Depends(get_repo)):
    row = repo.get_by_id(id)
    if row is None:
        raise HTTPException(status_code=404, detail="Fire incident not found")
    return row


@router.post("/", response_model=FireIncidentResponse, status_code=201)
def create_fire_incident(
    data: FireIncidentCreate,
    repo: FireIncidentRepository = Depends(get_repo),
):
    return repo.create(data)


@router.patch("/{id}", response_model=FireIncidentResponse)
def update_fire_incident(
    id: str,
    data: FireIncidentUpdate,
    repo: FireIncidentRepository = Depends(get_repo),
):
    row = repo.update(id, data)
    if row is None:
        raise HTTPException(status_code=404, detail="Fire incident not found")
    return row


@router.delete("/{id}", status_code=204)
def delete_fire_incident(id: str, repo: FireIncidentRepository = Depends(get_repo)):
    if not repo.delete(id):
        raise HTTPException(status_code=404, detail="Fire incident not found")
