from sqlalchemy.orm import Session
from app.models.department import Department
from uuid import UUID

class DepartmentRepository:

    def create(self, db: Session, department: Department):
        db.add(department)
        db.commit()
        db.refresh(department)
        return department
    
    def get_all(self, db: Session, company_id: UUID):
        return db.query(Department).filter_by(company_id=company_id).all()
    
    def get_by_id(self, db: Session, department_id: UUID, company_id: UUID):
        return db.query(Department).filter_by(
            id = department_id,
            company_id=company_id
        ).first()