from uuid import UUID

from fastapi import HTTPException, status

from app.models.role import Role
from app.repositories.role_repository import RoleRepository
from app.schemas.role_schemas import RoleCreate, RoleUpdate


class RoleService:
    def __init__(self, repo: RoleRepository):
        self.repo = repo

    def create_role(self, role_data: RoleCreate, company_id: UUID) -> Role:
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

        role = Role(
            company_id=company_id,
            name=name,
            description=description,
            is_active=role_data.is_active,
        )

        created_role = self.repo.create(role)
        self.repo.db.commit()
        self.repo.db.refresh(created_role)

        return created_role

    def get_role(self, role_id: UUID, company_id: UUID) -> Role:
        role = self.repo.get_by_id(role_id, company_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )

        return role

    def get_all_roles(self, company_id: UUID) -> list[Role]:
        return self.repo.get_all(company_id)

    def update_role(
        self,
        role_id: UUID,
        role_data: RoleUpdate,
        company_id: UUID,
    ) -> Role:
        role = self.get_role(role_id, company_id)
        is_admin_role = role.name.strip().lower() == "admin"

        if is_admin_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin role cannot be modified.",
            )

        if self.repo.has_users(role.id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role cannot be modified because it is assigned to users.",
            )

        if self.repo.has_workflow_levels(role.id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role cannot be modified because it is used in approval workflows.",
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

        if "description" in update_data:
            description = update_data["description"]
            update_data["description"] = description.strip() if description else None

        for field, value in update_data.items():
            setattr(role, field, value)

        updated_role = self.repo.update(role)
        self.repo.db.commit()
        self.repo.db.refresh(updated_role)

        return updated_role

    def activate_role(self, role_id: UUID, company_id: UUID) -> Role:
        role = self.get_role(role_id, company_id)

        if role.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role is already active.",
            )

        role.is_active = True

        updated_role = self.repo.update(role)
        self.repo.db.commit()
        self.repo.db.refresh(updated_role)

        return updated_role

    def deactivate_role(
        self,
        role_id: UUID,
        company_id: UUID,
        current_user_role_id: UUID,
    ) -> Role:
        role = self.get_role(role_id, company_id)

        if role.name.strip().lower() == "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin role cannot be deactivated.",
            )

        if role.id == current_user_role_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate the role assigned to your own account.",
            )

        if role.name.strip().lower() == "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The Admin role cannot be deactivated.",
            )

        if not role.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role is already inactive.",
            )

        if self.repo.has_users(role_id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role cannot be deactivated because users are assigned to it. Reassign users first.",
            )

        if self.repo.has_workflow_level_roles(role_id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role cannot be deactivated because it is used in approval workflow levels.",
            )

        role.is_active = False

        updated_role = self.repo.update(role)
        self.repo.db.commit()
        self.repo.db.refresh(updated_role)

        return updated_role

    def delete_role(self, role_id: UUID, company_id: UUID) -> None:
        role = self.get_role(role_id, company_id)

        if role.name.strip().lower() == "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin role cannot be deleted.",
            )

        if self.repo.has_users(role.id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role cannot be deleted because it is assigned to users.",
            )

        if self.repo.has_workflow_levels(role.id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role cannot be deleted because it is used in approval workflows.",
            )

        self.repo.delete(role)
        self.repo.db.commit()