import uuid
from sqlalchemy.orm import Session
from app.models.company import Company
from app.repositories.company_repository import CompanyRepository

class CompanyService:
    def __init__(self):
        self.repo = CompanyRepository()

    def create_company(self, db: Session, name: str, is_active: bool = True):
        company = Company(
            id=uuid.uuid4(),
            name=name,
            is_active=is_active
        )
        return self.repo.create(db, company)

    def get_company(self, db: Session, company_id: uuid.UUID):
        return self.repo.get_by_id(db, company_id)

    def list_companies(self, db: Session):
        return self.repo.list_all(db)