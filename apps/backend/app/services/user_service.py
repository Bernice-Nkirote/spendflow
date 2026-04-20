import uuid
from uuid import UUID

from fastapi import HTTPException, status

from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserCreate, UserUpdate


class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    def create_user(self, user_data: UserCreate, company_id: UUID) -> User:
        name = user_data.name.strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User name is required.",
            )

        email = user_data.email.strip().lower()
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is required.",
            )

        password = user_data.password.strip()
        if not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required.",
            )

        phone_number = user_data.phone_number.strip() if user_data.phone_number else None

        existing_user = self.repo.get_by_email(email, company_id)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists in this company.",
            )

        if phone_number:
            existing_phone = self.repo.get_by_phone_number(phone_number, company_id)
            if existing_phone:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Phone number already exists in this company.",
                )

        user = User(
            id=uuid.uuid4(),
            company_id=company_id,
            department_id=user_data.department_id,
            role_id=user_data.role_id,
            name=name,
            email=email,
            phone_number=phone_number,
            hashed_password=hash_password(password),
            is_active=True,
        )

        return self.repo.create(user)

    def get_user(self, user_id: UUID, company_id: UUID) -> User:
        user = self.repo.get_by_id(user_id, company_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        return user

    def get_all_users(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[User]:
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

        return self.repo.get_all(company_id, skip=skip, limit=limit)

    def update_user(self, user_id: UUID, user_data: UserUpdate, company_id: UUID) -> User:
        user = self.repo.get_by_id(user_id, company_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        update_data = user_data.model_dump(exclude_unset=True)

        if "name" in update_data:
            normalized_name = update_data["name"].strip()
            if not normalized_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User name cannot be empty.",
                )
            update_data["name"] = normalized_name

        if "email" in update_data:
            normalized_email = update_data["email"].strip().lower()
            if not normalized_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email cannot be empty.",
                )

            existing_user = self.repo.get_by_email(normalized_email, company_id)
            if existing_user and existing_user.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already exists in this company.",
                )

            update_data["email"] = normalized_email

        if "phone_number" in update_data:
            phone_number = update_data["phone_number"]
            normalized_phone = phone_number.strip() if phone_number else None

            if normalized_phone:
                existing_phone = self.repo.get_by_phone_number(normalized_phone, company_id)
                if existing_phone and existing_phone.id != user.id:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Phone number already exists in this company.",
                    )

            update_data["phone_number"] = normalized_phone

        for field, value in update_data.items():
            setattr(user, field, value)

        return self.repo.update(user)

    def activate_user(self, user_id: UUID, company_id: UUID) -> User:
        user = self.repo.get_by_id(user_id, company_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already active.",
            )

        user.is_active = True
        return self.repo.update(user)

    def deactivate_user(self, user_id: UUID, company_id: UUID) -> User:
        user = self.repo.get_by_id(user_id, company_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already inactive.",
            )

        user.is_active = False
        return self.repo.update(user)

    def delete_user(self, user_id: UUID, company_id: UUID) -> None:
        user = self.repo.get_by_id(user_id, company_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if self.repo.has_requisitions(user_id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User cannot be deleted because they have purchase requisitions. Deactivate instead.",
            )

        if self.repo.has_approval_actions(user_id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User cannot be deleted because they have approval actions. Deactivate instead.",
            )

        if self.repo.has_submitted_invoices(user_id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User cannot be deleted because they have submitted invoices. Deactivate instead.",
            )

        self.repo.delete(user)