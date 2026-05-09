from sqlalchemy.orm import Session

from app.models.weather_alert import WeatherAlert
from app.schemas.weather_alert import WeatherAlertCreate, WeatherAlertUpdate


class WeatherAlertRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100) -> list[WeatherAlert]:
        return (
            self.db.query(WeatherAlert)
            .order_by(WeatherAlert.timestamp.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_id(self, id: str) -> WeatherAlert | None:
        return self.db.query(WeatherAlert).filter(WeatherAlert.id == id).first()

    def create(self, data: WeatherAlertCreate) -> WeatherAlert:
        row = WeatherAlert(**data.model_dump())
        self.db.merge(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def update(self, id: str, data: WeatherAlertUpdate) -> WeatherAlert | None:
        row = self.get_by_id(id)
        if row is None:
            return None
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(row, field, value)
        self.db.commit()
        self.db.refresh(row)
        return row

    def delete(self, id: str) -> bool:
        row = self.get_by_id(id)
        if row is None:
            return False
        self.db.delete(row)
        self.db.commit()
        return True
