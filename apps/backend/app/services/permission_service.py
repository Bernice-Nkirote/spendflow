from uuid import UUID

from fastapi import HTTPException, status

from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_permission_repository import RolePermissionRepository
from app.repositories.role_repository import RoleRepository
from app.schemas.permission_schema import PermissionCreate, PermissionUpdate
from app.schemas.role_permission_schema import RolePermissionCreate
from app.services.audit_log_service import AuditLogService

class PermissionService:
    def __init__(
        self,
        permission_repo: PermissionRepository,
        role_permission_repo: RolePermissionRepository,
        role_repo: RoleRepository,
        audit_log_service: AuditLogService,
    ):
        self.permission_repo = permission_repo
        self.role_permission_repo = role_permission_repo
        self.role_repo = role_repo
        self.audit_log_service = audit_log_service

    # PERMISSION CRUD
    def create_permission(
        self,
        data: PermissionCreate,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> Permission:
        existing = self.permission_repo.get_by_name(
            data.name,
            company_id,
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Permission already exists",
            )

        permission = Permission(
            company_id=company_id,
            name=data.name,
            description=data.description,
            is_active=data.is_active,
        )

        permission = self.permission_repo.create(permission)

        # AUDIT LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PERMISSION",
            entity_id=permission.id,
            action="PERMISSION_CREATED",
            actor_user_id=actor_user_id,
            description=f"Permission {permission.name} created",
            new_values_json={
                "name": permission.name,
                "description": permission.description,
                "is_active": permission.is_active,
            },
        )

        self.permission_repo.db.commit()
        return permission

    def get_permissions(self, company_id: UUID):
        return self.permission_repo.get_all(company_id)

    def get_permission(
        self,
        permission_id: UUID,
        company_id: UUID,
    ) -> Permission:
        permission = self.permission_repo.get_by_id(
            permission_id,
            company_id,
        )
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Permission not found",
            )
        return permission

    def update_permission(
        self,
        permission_id: UUID,
        data: PermissionUpdate,
        company_id: UUID,
        actor_user_id: UUID, 
    ) -> Permission:
        permission = self.get_permission(permission_id, company_id)
        
        old_values = {
            "name": permission.name,
            "description": permission.description,
            "is_active": permission.is_active,
        }

        if data.name is not None:
            permission.name = data.name

        if data.description is not None:
            permission.description = data.description

        if data.is_active is not None:
            permission.is_active = data.is_active

        permission = self.permission_repo.update(permission)

        # AUDIT LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PERMISSION",
            entity_id=permission.id,
            action="PERMISSION_UPDATED",
            actor_user_id=actor_user_id,
            description=f"Permission {permission.name} updated",
            old_values_json=old_values,
            new_values_json=data.model_dump(exclude_unset=True),
        )

        self.permission_repo.db.commit()
        return permission

    def activate_permission(
        self,
        permission_id: UUID,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> Permission:
        permission = self.get_permission(permission_id, company_id)
        old_status = permission.is_active

        permission.is_active = True
    
        permission = self.permission_repo.update(permission)

        # AUDIT LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PERMISSION",
            entity_id=permission.id,
            action="PERMISSION_ACTIVATED",
            actor_user_id=actor_user_id,
            description=f"Permission {permission.name} activated",
            old_values_json={"is_active": old_status},
            new_values_json={"is_active": True},
        )

        self.permission_repo.db.commit()
        return permission


    def deactivate_permission(
        self,
        permission_id: UUID,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> Permission:
        permission = self.get_permission(permission_id, company_id)

        old_status = permission.is_active

        permission.is_active = False
    
        permission = self.permission_repo.update(permission)

        # AUDIT LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PERMISSION",
            entity_id=permission.id,
            action="PERMISSION_DEACTIVATED",
            actor_user_id=actor_user_id,
            description=f"Permission {permission.name} deactivated",
            old_values_json={"is_active": old_status},
            new_values_json={"is_active": False},
        )

        self.permission_repo.db.commit()
        return permission


    def get_role_permission(
        self,
        role_permission_id: UUID,
    company_id: UUID,
    ) -> RolePermission:
        role_permission = self.role_permission_repo.get_by_id(
            role_permission_id,
            company_id,
        )

        if not role_permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role permission not found",
            )

        return role_permission


    def remove_permission_from_role(
        self,
        role_permission_id: UUID,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> None:
        role_permission = self.get_role_permission(
            role_permission_id,
            company_id,
        )
        role = self.role_repo.get_by_id(
            role_permission.role_id,
            company_id,
        )

        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found.",
            )

        if role.is_system_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Permissions cannot be removed from system roles because they protect company governance.",
            )

        role_name = (
            role_permission.role.name 
            if role_permission.role 
            else "Unknown Role"
        )
        permission_name = (
            role_permission.permission.name
            if role_permission.permission
            else "Unknown Permission"
        )
        self.role_permission_repo.delete(role_permission)

        # AUDIT LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="ROLE_PERMISSION",
            entity_id=role_permission.id,
            action="PERMISSION_REMOVED",
            actor_user_id=actor_user_id,
            description="Permission removed from role",
            details_json={
                "entity_reference": f"{role_name} - {permission_name}",
                "role_name": role_name,
                "permission_name": permission_name,
            },
        )

        self.role_permission_repo.db.commit()

    # ROLE PERMISSION
    def assign_permission_to_role(
        self,
        data: RolePermissionCreate,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> RolePermission:
        role = self.role_repo.get_by_id(data.role_id, company_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found",
            )

        permission = self.permission_repo.get_by_id(
            data.permission_id,
            company_id,
        )
        if not permission:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Permission not found",
            )

        existing = self.role_permission_repo.get_by_role_and_permission(
            data.role_id,
            data.permission_id,
            company_id,
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Permission already assigned to role",
            )

        role_permission = RolePermission(
            company_id=company_id,
            role_id=data.role_id,
            permission_id=data.permission_id,
        )

        role_permission = self.role_permission_repo.create(role_permission)

        # AUDIT LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="ROLE_PERMISSION",
            entity_id=role_permission.id,
            action="PERMISSION_ASSIGNED",
            actor_user_id=actor_user_id,
            description=f"Permission {permission.name} assigned to role {role.name}",
            details_json={
                "entity_reference": f"{role.name} - {permission.name}",
                "role_name": role.name,
                "permission_name": permission.name,
            },
        )

        self.role_permission_repo.db.commit()
        return role_permission

    def get_permissions_for_role(
        self,
        role_id: UUID,
        company_id: UUID,
    ) -> list[dict]:
        role = self.role_repo.get_by_id(role_id, company_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found",
            )

        role_permissions = self.role_permission_repo.get_by_role(
            role_id=role_id,
            company_id=company_id,
        )

        return [
            {
                "id": role_permission.id,
                "company_id": role_permission.company_id,
                "role_id": role.id,
                "role_name": role.name,
                "permission_id": role_permission.permission.id,
                "permission_name": role_permission.permission.name,
                "permission_description": role_permission.permission.description,
                "permission_is_active": role_permission.permission.is_active,
            }
            for role_permission in role_permissions
        ]

    # -------------------------
    # PERMISSION CHECK
    # -------------------------

    def role_has_permission(
        self,
        role_id: UUID,
        permission_name: str,
        company_id: UUID,
    ) -> bool:
        permission = self.permission_repo.get_by_name(
            permission_name,
            company_id,
        )
        if not permission or not permission.is_active:
            return False

        role_permission = self.role_permission_repo.get_by_role_and_permission(
            role_id,
            permission.id,
            company_id,
        )

        return role_permission is not None