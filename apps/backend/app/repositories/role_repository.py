from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.user import User
from app.models.workflow_level_roles import WorkflowLevelRole
from app.models.role_permission import RolePermission

class RoleRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, role: Role) -> Role:
        self.db.add(role)
        self.db.flush()
        self.db.refresh(role)
        return role

    def get_by_id(self, role_id: UUID, company_id: UUID) -> Optional[Role]:
        return (
            self.db.query(Role)
            .filter(
                Role.id == role_id,
                Role.company_id == company_id,
            )
            .first()
        )

    def get_all(self, company_id: UUID) -> list[Role]:
        return (
            self.db.query(Role)
            .filter(Role.company_id == company_id)
            .order_by(Role.created_at.desc())
            .all()
        )

    def get_by_name(self, name: str, company_id: UUID) -> Optional[Role]:
        return (
            self.db.query(Role)
            .filter(
                Role.name == name,
                Role.company_id == company_id,
            )
            .first()
        )
    
    def has_users(self, role_id: UUID, company_id: UUID) -> bool:
        return (
            self.db.query(User)
            .filter(
                User.role_id == role_id,
                User.company_id == company_id,
            )
            .first()
            is not None
        )

    def has_workflow_level_roles(self, role_id: UUID, company_id: UUID) -> bool:
        return (
            self.db.query(WorkflowLevelRole)
            .filter(
                WorkflowLevelRole.role_id == role_id,
                WorkflowLevelRole.company_id == company_id,
            )
            .first()
            is not None
        )

    def has_role_permissions(self, role_id: UUID, company_id: UUID) -> bool:
        return (
            self.db.query(RolePermission)
            .filter(
                RolePermission.role_id == role_id,
                RolePermission.company_id == company_id,
            )
            .first()
            is not None
        )

    def update(self, role: Role) -> Role:
        self.db.flush()
        self.db.refresh(role)
        return role

    def delete(self, role: Role) -> None:
        self.db.delete(role)
        self.db.flush()