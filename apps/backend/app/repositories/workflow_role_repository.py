# app/repositories/workflow_level_role_repository.py

import uuid
from sqlalchemy.orm import Session
from typing import List, Optional

from app.models.workflow_level_roles import WorkflowLevelRole


class WorkflowLevelRoleRepository:

    def create(self, db: Session, obj: WorkflowLevelRole) -> WorkflowLevelRole:
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    def get_by_id(self, db: Session, obj_id: uuid.UUID) -> Optional[WorkflowLevelRole]:
        return db.query(WorkflowLevelRole).filter(WorkflowLevelRole.id == obj_id).fist()

    def get_all(self, db: Session) -> List[WorkflowLevelRole]:
        return db.query(WorkflowLevelRole).all()

    def get_by_level(self, db: Session, level_id: uuid.UUID) -> List[WorkflowLevelRole]:
        return db.query(WorkflowLevelRole).filter(
            WorkflowLevelRole.level_id == level_id
        ).all()

    def update(self, db: Session, db_obj: WorkflowLevelRole, update_data: dict) -> WorkflowLevelRole:
        for key, value in update_data.items():
            setattr(db_obj, key, value)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, db_obj: WorkflowLevelRole) -> None:
        db.delete(db_obj)
        db.commit()