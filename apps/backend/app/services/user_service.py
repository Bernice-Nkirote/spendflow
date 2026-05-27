import uuid
import traceback
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import generate_secure_token, hash_password, hash_token
from app.models.user import User
from app.models.user_onboarding_token import UserOnboardingToken
from app.models.user_password_reset_token import UserPasswordResetToken
from app.repositories.user_onboarding_token_repository import UserOnboardingTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserCreate, UserUpdate
from app.services.audit_log_service import AuditLogService
from app.services.notifications.email_service import EmailService
from app.repositories.company_repository import CompanyRepository
from app.repositories.user_password_reset_token_repository import UserPasswordResetTokenRepository

class UserService:
    def __init__(
        self,
        repo: UserRepository,
        onboarding_token_repo: UserOnboardingTokenRepository,
        password_reset_token_repo: UserPasswordResetTokenRepository,
        company_repo: CompanyRepository,
        audit_log_service: AuditLogService,
        email_service: EmailService,
    ):
        self.repo = repo
        self.onboarding_token_repo = onboarding_token_repo
        self.password_reset_token_repo = password_reset_token_repo
        self.company_repo = company_repo
        self.audit_log_service = audit_log_service
        self.email_service = email_service

    def create_user(
        self,
        user_data: UserCreate,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> User:
        try:
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

            if not user_data.department_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Department is required when creating a user.",
                )

            raw_setup_token = generate_secure_token()
            token_hash_value = hash_token(raw_setup_token)

            user = User(
                id=uuid.uuid4(),
                company_id=company_id,
                department_id=user_data.department_id,
                role_id=user_data.role_id,
                name=name,
                email=email,
                phone_number=phone_number,
                hashed_password=hash_password(generate_secure_token()),
                is_active=False,
                is_company_owner=False,
                has_completed_onboarding=False,
                onboarded_at=None,
            )

            created_user = self.repo.create(user)

            onboarding_token = UserOnboardingToken(
                id=uuid.uuid4(),
                company_id=company_id,
                user_id=created_user.id,
                token_hash=token_hash_value,
                expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
                is_used=False,
            )

            self.onboarding_token_repo.create(onboarding_token)

            setup_link = f"{settings.FRONTEND_BASE_URL}/setup-password?token={raw_setup_token}"

            try:
                self.email_service.send_user_onboarding_email(
                    to_email=created_user.email,
                    user_name=created_user.name,
                    setup_link=setup_link,
                )
            except Exception as e:
                print("USER ONBOARDING EMAIL ERROR:", repr(e))
                raise

            self.audit_log_service.log_action(
                company_id=company_id,
                entity_type="USER",
                entity_id=created_user.id,
                action="USER_CREATED",
                actor_user_id=actor_user_id,
                description=f"User profile created for {created_user.email}",
                details_json={
                    "email": created_user.email,
                    "name": created_user.name,
                    "department_id": str(created_user.department_id) if created_user.department_id else None,
                    "role_id": str(created_user.role_id),
                    "onboarding_email_sent": True,
                },
            )

            self.repo.db.commit()
            self.repo.db.refresh(created_user)

            return created_user

        except HTTPException:
            self.repo.db.rollback()
            raise
        except Exception as e:
            self.repo.db.rollback()
            print("CREATE USER ERROR:", repr(e))
            traceback.print_exc()
            raise
    
    def resend_setup_link(
        self,
        user_id: UUID,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> User:
        user = self.repo.get_by_id(user_id, company_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if user.has_completed_onboarding:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This user has already completed password setup.",
            )

        raw_setup_token = generate_secure_token()
        token_hash_value = hash_token(raw_setup_token)

        onboarding_token = UserOnboardingToken(
            id=uuid.uuid4(),
            company_id=company_id,
            user_id=user.id,
            token_hash=token_hash_value,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
            is_used=False,
        )

        self.onboarding_token_repo.create(onboarding_token)

        setup_link = f"{settings.FRONTEND_BASE_URL}/setup-password?token={raw_setup_token}"

        self.email_service.send_user_onboarding_email(
            to_email=user.email,
            user_name=user.name,
            setup_link=setup_link,
        )

        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="USER",
            entity_id=user.id,
            action="USER_SETUP_LINK_RESENT",
            actor_user_id=actor_user_id,
            description=f"Setup link resent to {user.email}",
            details_json={
                "entity_reference": user.email,
                "email": user.email,
                "name": user.name,
                "setup_link_resent": True,
            },
        )

        self.repo.db.commit()
        self.repo.db.refresh(user)

        return user

    def setup_password(self, token: str, password: str) -> User:
        raw_token = token.strip()
        if not raw_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Setup token is required.",
            )

        new_password = password.strip()
        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long.",
            )

        token_hash_value = hash_token(raw_token)
        onboarding_token = self.onboarding_token_repo.get_by_token_hash(token_hash_value)

        if not onboarding_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired setup token.",
            )

        if onboarding_token.is_used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Setup token has already been used.",
            )

        if onboarding_token.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Setup token has expired.",
            )

        user = self.repo.get_by_id(
            user_id=onboarding_token.user_id,
            company_id=onboarding_token.company_id,
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        now = datetime.now(timezone.utc)

        user.hashed_password = hash_password(new_password)
        user.is_active = True
        user.has_completed_onboarding = True
        user.onboarded_at = now

        onboarding_token.is_used = True
        onboarding_token.used_at = now

        updated_user = self.repo.update(user)
        self.onboarding_token_repo.update(onboarding_token)

        self.audit_log_service.log_action(
            company_id=user.company_id,
            entity_type="USER",
            entity_id=user.id,
            action="USER_PASSWORD_SET",
            actor_user_id=user.id,
            description=f"User completed password setup for {user.email}",
            details_json={
                "email": user.email,
                "name": user.name,
            },
        )

        self.repo.db.commit()
        self.repo.db.refresh(updated_user)

        return updated_user
    

    def request_password_reset(
        self,
        company_name: str,
        email: str,
    ) -> None:
        normalized_company_name = company_name.strip()
        normalized_email = email.strip().lower()

        generic_success_message = None

        if not normalized_company_name or not normalized_email:
            return generic_success_message

        company = self.company_repo.get_by_name(normalized_company_name)
        if not company or not company.is_active:
            return generic_success_message

        user = self.repo.get_by_email(normalized_email, company.id)
        if not user:
            return generic_success_message

        if not user.is_active:
            return generic_success_message
        
        existing_active_token = self.password_reset_token_repo.get_latest_active_by_user(
            user_id=user.id,
            company_id=company.id,
        )

        if existing_active_token and existing_active_token.expires_at > datetime.now(timezone.utc):
            return generic_success_message

        raw_reset_token = generate_secure_token()
        token_hash_value = hash_token(raw_reset_token)

        reset_token = UserPasswordResetToken(
            id=uuid.uuid4(),
            company_id=company.id,
            user_id=user.id,
            token_hash=token_hash_value,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            is_used=False,
        )

        self.password_reset_token_repo.create(reset_token)

        reset_link = f"{settings.FRONTEND_BASE_URL}/reset-password?token={raw_reset_token}"

        self.email_service.send_password_reset_email(
            to_email=user.email,
            user_name=user.name,
            reset_link=reset_link,
        )

        self.audit_log_service.log_action(
            company_id=company.id,
            entity_type="USER",
            entity_id=user.id,
            action="PASSWORD_RESET_REQUESTED",
            actor_user_id=user.id,
            description=f"Password reset requested for {user.email}",
            details_json={
                "entity_reference": user.email,
                "email": user.email,
            },
        )

        self.repo.db.commit()

        return generic_success_message

    def reset_password(
        self,
        token: str,
        password: str,
    ) -> User:
        raw_token = token.strip()
        if not raw_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token is required.",
            )

        new_password = password.strip()
        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long.",
            )

        token_hash_value = hash_token(raw_token)
        reset_token = self.password_reset_token_repo.get_by_token_hash(token_hash_value)

        if not reset_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token.",
            )

        if reset_token.is_used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has already been used.",
            )

        if reset_token.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired.",
            )

        user = self.repo.get_by_id(
            user_id=reset_token.user_id,
            company_id=reset_token.company_id,
        )

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is inactive.",
            )

        now = datetime.now(timezone.utc)

        user.hashed_password = hash_password(new_password)
        reset_token.is_used = True
        reset_token.used_at = now

        updated_user = self.repo.update(user)
        self.password_reset_token_repo.update(reset_token)

        self.audit_log_service.log_action(
            company_id=user.company_id,
            entity_type="USER",
            entity_id=user.id,
            action="PASSWORD_RESET_COMPLETED",
            actor_user_id=user.id,
            description=f"Password reset completed for {user.email}",
            details_json={
                "entity_reference": user.email,
                "email": user.email,
            },
        )

        self.repo.db.commit()
        self.repo.db.refresh(updated_user)

        return updated_user

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

    def get_paginated_users(
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

        users = self.repo.get_all(company_id, skip=skip, limit=limit)
        total_count = self.repo.count_all(company_id)

        return {
            "rows": users,
            "total_count": total_count,
        }

    def update_user(
        self,
        user_id: UUID,
        user_data: UserUpdate,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> User:
        user = self.repo.get_by_id(user_id, company_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        update_data = user_data.model_dump(exclude_unset=True)

        if (
            "department_id" in update_data
            and update_data["department_id"] is None
            and not user.is_company_owner
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department is required for users. Only the company owner may remain without a department.",
            )

        if user.is_company_owner:
            if "role_id" in update_data and update_data["role_id"] != user.role_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The company owner's role cannot be changed because it protects company governance.",
                )

            if "is_active" in update_data and update_data["is_active"] is False:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The company owner cannot be deactivated.",
                )

            if "email" in update_data and update_data["email"] != user.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The company owner's email cannot be changed without a verified ownership flow.",
                )

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

        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="USER",
            entity_id=user.id,
            action="USER_UPDATED",
            actor_user_id=actor_user_id,
            description=f"User profile updated for {user.email}",
            details_json={
                "entity_reference": user.email,
                "updated_fields": list(update_data.keys()),
            },
        )
        updated_user = self.repo.update(user)
        self.repo.db.commit()
        self.repo.db.refresh(updated_user)

        return updated_user
    
    def activate_user(self, user_id: UUID, company_id: UUID) -> User:
        user = self.repo.get_by_id(user_id, company_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if not user.has_completed_onboarding:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User cannot be activated before completing password setup.",
            )

        if user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already active.",
            )

        user.is_active = True

        updated_user = self.repo.update(user)
        self.repo.db.commit()
        self.repo.db.refresh(updated_user)

        return updated_user

    def deactivate_user(
        self,
        user_id: UUID,
        company_id: UUID,
        current_user_id: UUID,
    ) -> User:
        user = self.repo.get_by_id(user_id, company_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if user.id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own account.",
            )

        is_admin_user = (
            user.role.name.strip().lower() == "admin"
            if user.role and user.role.name
            else False
        )

        if user.is_company_owner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The company owner cannot be deactivated because they protect company governance.",
            )


        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already inactive.",
            )

        user.is_active = False

        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="USER",
            entity_id=user.id,
            action="USER_DEACTIVATED",
            actor_user_id=current_user_id,
            description=f"User deactivated: {user.email}",
            details_json={
                "entity_reference": user.email,
                "email": user.email,
                "name": user.name,
            },
        )

        updated_user = self.repo.update(user)
        self.repo.db.commit()
        self.repo.db.refresh(updated_user)

        return updated_user
    
    def delete_user(
        self,
        user_id: UUID,
        company_id: UUID,
        current_user_id: UUID,
    ) -> None:
        user = self.repo.get_by_id(user_id, company_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        if user.id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot delete your own account.",
            )

        if user.is_company_owner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The company owner cannot be deleted because they protect company governance.",
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

        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="USER",
            entity_id=user.id,
            action="USER_DELETED",
            actor_user_id=current_user_id,
            description=f"User deleted: {user.email}",
            details_json={
                "entity_reference": user.email,
                "email": user.email,
                "name": user.name,
            },
        )
        self.repo.delete(user)
        self.repo.db.commit()