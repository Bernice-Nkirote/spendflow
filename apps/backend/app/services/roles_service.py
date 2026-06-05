from uuid import UUID

from fastapi import HTTPException, status

from app.models.role import Role
from app.repositories.role_repository import RoleRepository
from app.schemas.role_schemas import RoleCreate, RoleUpdate
from app.services.audit_log_service import AuditLogService

class RoleService:
    def __init__(
        self,
        repo: RoleRepository,
        audit_log_service: AuditLogService,
    ):
        self.repo = repo
        self.audit_log_service = audit_log_service

    def create_role(
        self,
        role_data: RoleCreate,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> Role:
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
            is_system_role=False,
        )

        created_role = self.repo.create(role)

        # AUDIT LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="ROLE",
            entity_id=created_role.id,
            action="ROLE_CREATED",
            actor_user_id=actor_user_id,
            description=f"Role {created_role.name} created",
            details_json={
                "entity_reference": created_role.name,
                "role_name": created_role.name,
            },
            new_values_json={
                "name": created_role.name,
                "description": created_role.description,
                "is_active": created_role.is_active,
                "is_system_role": created_role.is_system_role,
            },
        )

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

    def get_paginated_roles(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> dict:
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip must be zero or greater.",
            )

        if limit < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be greater than zero.",
            )

        roles = self.repo.get_all(
            company_id=company_id,
            skip=skip,
            limit=limit,
        )
        total_count = self.repo.count_all(company_id)

        return {
            "rows": roles,
            "total_count": total_count,
        }

    def update_role(
        self,
        role_id: UUID,
        role_data: RoleUpdate,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> Role:
        role = self.get_role(role_id, company_id)

        if role.is_system_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="System roles cannot be modified because they protect company governance.",
            )

        if self.repo.has_users(role.id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role cannot be modified because it is assigned to users.",
            )

        if self.repo.has_workflow_level_roles(role.id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role cannot be modified because it is used in approval workflows.",
            )
        update_data = role_data.model_dump(exclude_unset=True)

        old_values = {
            "name": role.name,
            "description": role.description,
            "is_active": role.is_active,
        }

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
        # AUDIT LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="ROLE",
            entity_id=updated_role.id,
            action="ROLE_UPDATED",
            actor_user_id=actor_user_id,
            description=f"Role {updated_role.name} updated",
            details_json={
                "entity_reference": updated_role.name,
                "role_name": updated_role.name,
            },
            old_values_json=old_values,
            new_values_json={
                "name": updated_role.name,
                "description": updated_role.description,
                "is_active": updated_role.is_active,
            },
        )


        self.repo.db.commit()
        self.repo.db.refresh(updated_role)

        return updated_role

    def activate_role(
        self,
        role_id: UUID,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> Role:
        role = self.get_role(role_id, company_id)

        if role.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role is already active.",
            )

        role.is_active = True

        updated_role = self.repo.update(role)
        # AUDIT LOGS
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="ROLE",
            entity_id=updated_role.id,
            action="ROLE_ACTIVATED",
            actor_user_id=actor_user_id,
            description=f"Role {updated_role.name} activated",
            details_json={
                "entity_reference": updated_role.name,
                "role_name": updated_role.name,
            },
            old_values_json={"is_active": False},
            new_values_json={"is_active": True},
        )

        self.repo.db.commit()
        self.repo.db.refresh(updated_role)

        return updated_role

    def deactivate_role(
        self,
        role_id: UUID,
        company_id: UUID,
        current_user_role_id: UUID,
        actor_user_id: UUID,
    ) -> Role:
        role = self.get_role(role_id, company_id)
        if role.is_system_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="System roles cannot be deactivated because they protect company governance.",
            )
        
        if role.id == current_user_role_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate the role assigned to your own account.",
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
        # AUDIT LOGS
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="ROLE",
            entity_id=updated_role.id,
            action="ROLE_DEACTIVATED",
            actor_user_id=actor_user_id,
            description=f"Role {updated_role.name} deactivated",
            details_json={
                "entity_reference": updated_role.name,
                "role_name": updated_role.name,
            },
            old_values_json={"is_active": True},
            new_values_json={"is_active": False},
        )

        self.repo.db.commit()
        self.repo.db.refresh(updated_role)

        return updated_role

    def delete_role(
        self,
        role_id: UUID,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> None:
        role = self.get_role(role_id, company_id)

        if role.is_system_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="System roles cannot be deleted because they protect company governance.",
            )

        if self.repo.has_users(role.id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role cannot be deleted because it is assigned to users.",
            )

        if self.repo.has_workflow_level_roles(role.id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role cannot be deleted because it is used in approval workflows.",
            )

        # AUDIT LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="ROLE",
            entity_id=role.id,
            action="ROLE_DELETED",
            actor_user_id=actor_user_id,
            description=f"Role {role.name} deleted",
            details_json={
                "entity_reference": role.name,
                "role_name": role.name,
            },
            old_values_json={
                "name": role.name,
                "description": role.description,
                "is_active": role.is_active,
                "is_system_role": role.is_system_role,
            },
        )

        self.repo.delete(role)
        self.repo.db.commit()