from sqlalchemy.orm import Session
from uuid import UUID

from app.models.user import User


class UserRepository:

    def create(self, db: Session, user: User):
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


    def get_by_id(self, db: Session, user_id: UUID):
        return db.query(User).filter(User.id == user_id).first()


    def get_by_email(self, db: Session, email: str):
        return db.query(User).filter(User.email == email).first()


    def get_by_company(self, db: Session, company_id: UUID):
        return db.query(User).filter(User.company_id == company_id).all()


    def update(self, db: Session, user: User):
        db.commit()
        db.refresh(user)
        return user


    def delete(self, db: Session, user: User):
        db.delete(user)
        db.commit()