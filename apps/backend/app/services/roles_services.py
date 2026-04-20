from uuid import UUID

from fastapi import HTTPException, status

from app.repositories.role_repository import RoleRepository
from app.schemas.role_schemas import RoleCreate, RoleUpdate


class RoleService:
    def __init__(self, repo: RoleRepository):
        self.repo = repo

    def create_role(self, role_data: RoleCreate, company_id: UUID):
        name = role_data.name.strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name is required.",
            )

        description = role_data.description.strip() if role_data.description else None

        existing_role = self.repo.get_by_name(name, company_id)
        if existing_role:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Role with this name already exists.",
            )

        return self.repo.create(
            company_id=company_id,
            name=name,
            description=description,
            is_active=role_data.is_active,
        )

    def get_role(self, role_id: UUID, company_id: UUID):
        role = self.repo.get_by_id(role_id, company_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )
        return role

    def get_all_roles(self, company_id: UUID):
        return self.repo.get_all(company_id)

    def update_role(self, role_id: UUID, role_data: RoleUpdate, company_id: UUID):
        role = self.repo.get_by_id(role_id, company_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )

        update_data = role_data.model_dump(exclude_unset=True)

        if "name" in update_data:
            normalized_name = update_data["name"].strip()
            if not normalized_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Role name cannot be empty.",
                )

            existing_role = self.repo.get_by_name(normalized_name, company_id)
            if existing_role and existing_role.id != role.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Role with this name already exists.",
                )

            update_data["name"] = normalized_name

        if "description" in update_data and update_data["description"] is not None:
            update_data["description"] = update_data["description"].strip()

        return self.repo.update(role, update_data)

    def activate_role(self, role_id: UUID, company_id: UUID):
        role = self.repo.get_by_id(role_id, company_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )

        if role.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role is already active.",
            )

        return self.repo.update(role, {"is_active": True})

    def deactivate_role(self, role_id: UUID, company_id: UUID):
        role = self.repo.get_by_id(role_id, company_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )

        if not role.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role is already inactive.",
            )

        return self.repo.update(role, {"is_active": False})
    
    # did not include delete_role() because hard delete is not production-safe for roles
    
    