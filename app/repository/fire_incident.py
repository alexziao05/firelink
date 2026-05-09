from sqlalchemy.orm import Session

from app.models.fire_incident import FireIncident
from app.schemas.fire_incident import FireIncidentCreate, FireIncidentUpdate


class FireIncidentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100) -> list[FireIncident]:
        return (
            self.db.query(FireIncident)
            .order_by(FireIncident.timestamp.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_id(self, id: str) -> FireIncident | None:
        return self.db.query(FireIncident).filter(FireIncident.id == id).first()

    def create(self, data: FireIncidentCreate) -> FireIncident:
        row = FireIncident(**data.model_dump())
        self.db.merge(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def update(self, id: str, data: FireIncidentUpdate) -> FireIncident | None:
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
