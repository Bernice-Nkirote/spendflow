from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.role import Role


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
    
    def update(self, role: Role) -> Role:
        self.db.flush()
        self.db.refresh(role)
        return role

    def delete(self, role: Role) -> None:
        self.db.delete(role)
        self.db.flush()