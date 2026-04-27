from uuid import UUID

from sqlalchemy.orm import Session

from app.models.permission import Permission


class PermissionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, permission: Permission) -> Permission:
        self.db.add(permission)
        self.db.flush()
        self.db.refresh(permission)
        return permission

    def get_by_id(
        self,
        permission_id: UUID,
        company_id: UUID,
    ) -> Permission | None:
        return (
            self.db.query(Permission)
            .filter(
                Permission.id == permission_id,
                Permission.company_id == company_id,
            )
            .first()
        )

    def get_all(self, company_id: UUID) -> list[Permission]:
        return (
            self.db.query(Permission)
            .filter(Permission.company_id == company_id)
            .all()
        )

    def get_by_name(
        self,
        name: str,
        company_id: UUID,
    ) -> Permission | None:
        return (
            self.db.query(Permission)
            .filter(
                Permission.name == name,
                Permission.company_id == company_id,
            )
            .first()
        )

    def update(self, permission: Permission) -> Permission:
        self.db.flush()
        self.db.refresh(permission)
        return permission