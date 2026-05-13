from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_admin_user, get_current_user
from app.core.database import get_db
from app.repositories.department_repository import DepartmentRepository
from app.schemas.department_schema import DepartmentCreate, DepartmentRead, DepartmentUpdate
from app.services.department_service import DepartmentService


router = APIRouter(
    prefix="/departments",
    tags=["Departments"],
    
)


def get_department_service(db: Session = Depends(get_db)) -> DepartmentService:
    repo = DepartmentRepository(db)
    return DepartmentService(repo)


@router.post("/", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
def create_department(
    department_data: DepartmentCreate,
    service: DepartmentService = Depends(get_department_service),
    current_user=Depends(get_current_admin_user),
):
    return service.create_department(department_data, current_user.company_id)


@router.get("/", response_model=list[DepartmentRead])
def get_all_departments(
    service: DepartmentService = Depends(get_department_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_all_departments(current_user.company_id)


@router.get("/options", response_model=list[DepartmentRead])
def get_department_options(
    service: DepartmentService = Depends(get_department_service),
    current_user=Depends(get_current_user),
):
    departments = service.get_all_departments(current_user.company_id)
    return [department for department in departments if department.is_active]


@router.get("/{department_id}", response_model=DepartmentRead)
def get_department(
    department_id: UUID,
    service: DepartmentService = Depends(get_department_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_department(department_id, current_user.company_id)


@router.put("/{department_id}", response_model=DepartmentRead)
def update_department(
    department_id: UUID,
    department_data: DepartmentUpdate,
    service: DepartmentService = Depends(get_department_service),
    current_user=Depends(get_current_admin_user),
):
    return service.update_department(department_id, department_data, current_user.company_id)


@router.patch("/{department_id}/activate", response_model=DepartmentRead)
def activate_department(
    department_id: UUID,
    service: DepartmentService = Depends(get_department_service),
    current_user=Depends(get_current_admin_user),
):
    return service.activate_department(department_id, current_user.company_id)


@router.patch("/{department_id}/deactivate", response_model=DepartmentRead)
def deactivate_department(
    department_id: UUID,
    service: DepartmentService = Depends(get_department_service),
    current_user=Depends(get_current_admin_user),
):
    return service.deactivate_department(department_id, current_user.company_id)


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    department_id: UUID,
    service: DepartmentService = Depends(get_department_service),
    current_user=Depends(get_current_admin_user),
):
    service.delete_department(department_id, current_user.company_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)