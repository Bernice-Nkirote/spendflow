import uuid
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.company import Company


class CompanyRepository:
    def __init__(self, db: Session):
        # Reuse one DB session per request
        self.db = db

    def get_by_id(self, company_id: uuid.UUID) -> Optional[Company]:
        # Fetch one company by ID
        return (
            self.db.query(Company)
            .filter(Company.id == company_id)
            .first()
        )

    def get_by_name(self, name: str) -> Optional[Company]:
        # Fetch one company by name
        return (
            self.db.query(Company)
            .filter(Company.name == name)
            .first()
        )

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> List[Company]:
        # Return companies ordered by newest first
        return (
            self.db.query(Company)
            .order_by(Company.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, obj: Company) -> Company:
        # Create a new company record
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def update(self, db_obj: Company, update_data: dict) -> Company:
        # Apply changes to an existing company
        # The service decides whether this is an edit, deactivation, or reactivation
        for key, value in update_data.items():
            setattr(db_obj, key, value)

        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: Company) -> None:
        # Hard delete a company record
        self.db.delete(db_obj)
        self.db.commit()