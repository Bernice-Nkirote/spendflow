import uuid
from sqlalchemy.orm import Session
from app.models.department import Department
from app.schemas.department_schema import DepartmentCreate
from app.repositories.department_repository import DepartmentRepository

class DepartmentService:
    def __init__(self, repo : DepartmentRepository):
        self.repo = repo

    def create_department(self, db: Session, department_data: DepartmentCreate, company_id):

        department = Department(
            id=uuid.uuid4(),
            company_id=company_id, 
            name=department_data.name,
            is_active=department_data.is_active
        )

        return self.repo.create(db, department)
    
    def list_departments(self, db: Session, company_id):
        return self.repo.get_all(db, company_id)
    
    def get_department(self, db: Session, department_id, company_id):
        return self.repo.get_by_id(db, department_id, company_id)