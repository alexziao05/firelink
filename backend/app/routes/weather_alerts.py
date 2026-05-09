from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repository.weather_alert import WeatherAlertRepository
from app.schemas.weather_alert import WeatherAlertCreate, WeatherAlertResponse, WeatherAlertUpdate

router = APIRouter(prefix="/weather-alerts", tags=["weather-alerts"])


def get_repo(db: Session = Depends(get_db)) -> WeatherAlertRepository:
    return WeatherAlertRepository(db)


@router.get("/", response_model=list[WeatherAlertResponse])
def list_weather_alerts(
    skip: int = 0,
    limit: int = 100,
    repo: WeatherAlertRepository = Depends(get_repo),
):
    return repo.get_all(skip=skip, limit=limit)


@router.get("/{id}", response_model=WeatherAlertResponse)
def get_weather_alert(id: str, repo: WeatherAlertRepository = Depends(get_repo)):
    row = repo.get_by_id(id)
    if row is None:
        raise HTTPException(status_code=404, detail="Weather alert not found")
    return row


@router.post("/", response_model=WeatherAlertResponse, status_code=201)
def create_weather_alert(
    data: WeatherAlertCreate,
    repo: WeatherAlertRepository = Depends(get_repo),
):
    return repo.create(data)


@router.patch("/{id}", response_model=WeatherAlertResponse)
def update_weather_alert(
    id: str,
    data: WeatherAlertUpdate,
    repo: WeatherAlertRepository = Depends(get_repo),
):
    row = repo.update(id, data)
    if row is None:
        raise HTTPException(status_code=404, detail="Weather alert not found")
    return row


@router.delete("/{id}", status_code=204)
def delete_weather_alert(id: str, repo: WeatherAlertRepository = Depends(get_repo)):
    if not repo.delete(id):
        raise HTTPException(status_code=404, detail="Weather alert not found")
