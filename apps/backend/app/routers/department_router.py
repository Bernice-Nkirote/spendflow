from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.schemas.department_schema import DepartmentCreate, DepartmentRead
from app.repositories.department_repository import DepartmentRepository
from app.services.department_service import DepartmentService
from app.core.auth_dependancy import get_current_user

router = APIRouter(prefix="/departments", tags=["Departments"])

repo = DepartmentRepository()
service = DepartmentService(repo=repo)

@router.post("/", response_model = DepartmentRead)
def create_department(
    department: DepartmentCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    return service.create_department(
        db,
        department,
        user["company_id"]
    )
# List departments in a particular compnay with user
router.get("/", response_model=List[DepartmentRead])
def list_departments(
        db: Session = Depends(get_db),
        user: dict = Depends(get_current_user)
):
    return service.list_departments(db, user["company_id"])

# For searching for one department
@router.get("/{department_id}", response_model=DepartmentRead)
def get_department(
    department_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    dept = service.get_department(db, department_id, user["company_id"])

    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )
    return dept
