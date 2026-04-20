import uuid
from uuid import UUID

from fastapi import HTTPException, status

from app.models.department import Department
from app.repositories.department_repository import DepartmentRepository
from app.schemas.department_schema import DepartmentCreate, DepartmentUpdate


class DepartmentService:
    def __init__(self, repo: DepartmentRepository):
        self.repo = repo

    def create_department(self, department_data: DepartmentCreate, company_id: UUID) -> Department:
        name = department_data.name.strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department name is required.",
            )

        existing_department = self.repo.get_by_name(name, company_id)
        if existing_department:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Department with this name already exists.",
            )

        department = Department(
            id=uuid.uuid4(),
            company_id=company_id,
            name=name,
            is_active=department_data.is_active,
        )

        return self.repo.create(department)

    def get_department(self, department_id: UUID, company_id: UUID) -> Department:
        department = self.repo.get_by_id(department_id, company_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found.",
            )
        return department

    def get_all_departments(self, company_id: UUID) -> list[Department]:
        return self.repo.get_all(company_id)

    def update_department(
        self,
        department_id: UUID,
        department_data: DepartmentUpdate,
        company_id: UUID,
    ) -> Department:
        department = self.repo.get_by_id(department_id, company_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found.",
            )

        update_data = department_data.model_dump(exclude_unset=True)

        if "name" in update_data:
            normalized_name = update_data["name"].strip()
            if not normalized_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Department name cannot be empty.",
                )

            existing_department = self.repo.get_by_name(normalized_name, company_id)
            if existing_department and existing_department.id != department.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Department with this name already exists.",
                )

            update_data["name"] = normalized_name

        return self.repo.update(department, update_data)

    def activate_department(self, department_id: UUID, company_id: UUID) -> Department:
        department = self.repo.get_by_id(department_id, company_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found.",
            )

        if department.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department is already active.",
            )

        return self.repo.update(department, {"is_active": True})

    def deactivate_department(self, department_id: UUID, company_id: UUID) -> Department:
        department = self.repo.get_by_id(department_id, company_id)
        if not department:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Department not found.",
            )

        if not department.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department is already inactive.",
            )

        return self.repo.update(department, {"is_active": False})
    
    def delete_department(self, department_id: UUID, company_id: UUID) -> None:
        department = self.repo.get_by_id(department_id, company_id)
        if not department:
            raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found.",
        )

        if self.repo.has_users(department_id, company_id):
            raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department cannot be deleted because it has users. Deactivate instead.",
        )

        if self.repo.has_requisitions(department_id, company_id):
            raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department cannot be deleted because it has purchase requisitions. Deactivate instead.",
        )

        if self.repo.has_purchase_orders(department_id, company_id):
            raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department cannot be deleted because it has purchase orders. Deactivate instead.",
        )

        self.repo.delete(department)