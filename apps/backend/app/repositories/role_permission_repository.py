from uuid import UUID

from sqlalchemy.orm import Session

from app.models.role_permission import RolePermission


class RolePermissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, role_permission: RolePermission) -> RolePermission:
        self.db.add(role_permission)
        self.db.flush()
        self.db.refresh(role_permission)
        return role_permission

    def get_by_id(
        self,
        role_permission_id: UUID,
        company_id: UUID,
    ) -> RolePermission | None:
        return (
            self.db.query(RolePermission)
            .filter(
                RolePermission.id == role_permission_id,
                RolePermission.company_id == company_id,
            )
            .first()
        )

    def get_by_role(
        self,
        role_id: UUID,
        company_id: UUID,
    ) -> list[RolePermission]:
        return (
            self.db.query(RolePermission)
            .filter(
                RolePermission.role_id == role_id,
                RolePermission.company_id == company_id,
            )
            .all()
        )

    def get_by_permission(
        self,
        permission_id: UUID,
        company_id: UUID,
    ) -> list[RolePermission]:
        return (
            self.db.query(RolePermission)
            .filter(
                RolePermission.permission_id == permission_id,
                RolePermission.company_id == company_id,
            )
            .all()
        )

    def get_by_role_and_permission(
        self,
        role_id: UUID,
        permission_id: UUID,
        company_id: UUID,
    ) -> RolePermission | None:
        return (
            self.db.query(RolePermission)
            .filter(
                RolePermission.role_id == role_id,
                RolePermission.permission_id == permission_id,
                RolePermission.company_id == company_id,
            )
            .first()
        )

    def delete(self, role_permission: RolePermission) -> None:
        self.db.delete(role_permission)
        self.db.flush()