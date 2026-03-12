import uuid
from sqlalchemy.orm import Session
from app.models.company import Company

class CompanyRepository:
    model = Company
    
    def get_by_id(self, db: Session, company_id: uuid.UUID):
        return db.query(Company).filter(Company.id == company_id).first()
    
    def create(self, db:Session, company: Company):
        db.add(company)
        db.commit()
        db.refresh(company)
        return company
    
    def list_all(self, db:Session):
        return db.query(Company).all()