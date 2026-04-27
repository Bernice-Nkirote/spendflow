import uuid
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.company import Company


class CompanyRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, company: Company) -> Company:
        self.db.add(company)
        self.db.flush()
        self.db.refresh(company)
        return company

    def get_by_id(self, company_id: uuid.UUID) -> Optional[Company]:
        return (
            self.db.query(Company)
            .filter(Company.id == company_id)
            .first()
        )

    def get_by_name(self, name: str) -> Optional[Company]:
        return (
            self.db.query(Company)
            .filter(func.lower(Company.name) == name.lower())
            .first()
        )

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Company]:
        return (
            self.db.query(Company)
            .order_by(Company.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update(self, company: Company) -> Company:
        self.db.flush()
        self.db.refresh(company)
        return company

    def delete(self, company: Company) -> None:
        self.db.delete(company)
        self.db.flush()