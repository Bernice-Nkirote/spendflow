import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserCreate, UserUpdate
from app.core.security import hash_password


class UserService:

    def __init__(self):
        self.repo = UserRepository()

    # Create user
    def create_user(self, db: Session, user_data: UserCreate):

        existing = self.repo.get_by_email(db, user_data.email)

        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")

        hashed_password = hash_password(user_data.password)

        user = User(
            id=uuid.uuid4(),
            name=user_data.name,
            email=user_data.email,
            phone_number=user_data.phone_number,
            department_id=user_data.department_id,
            role_id=user_data.role_id,
            company_id=user_data.company_id,
            hashed_password=hashed_password
        )

        return self.repo.create(db, user)

    # Get user
    def get_user(self, db: Session, user_id):

        user = self.repo.get_by_id(db, user_id)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user

    # Get users by company
    def list_company_users(self, db: Session, company_id):

        return self.repo.get_by_company(db, company_id)

    # Update user
    def update_user(self, db: Session, user_id, user_data: UserUpdate):

        user = self.repo.get_by_id(db, user_id)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user_data.name is not None:
            user.name = user_data.name

        if user_data.email is not None:
            user.email = user_data.email

        if user_data.phone_number is not None:
            user.phone_number = user_data.phone_number

        if user_data.department_id is not None:
            user.department_id = user_data.department_id

        if user_data.role_id is not None:
            user.role_id = user_data.role_id

        if user_data.is_active is not None:
            user.is_active = user_data.is_active

        return self.repo.update(db, user)

    # Deactivate user
    def deactivate_user(self, db: Session, user_id):

        user = self.repo.get_by_id(db, user_id)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.is_active = False

        return self.repo.update(db, user)