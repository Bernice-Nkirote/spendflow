from uuid import UUID

from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone
import secrets

from app.core.config import settings
from app.models.supplier_user import SupplierUser
from app.repositories.supplier_user_repository import SupplierUserRepository
from app.schemas.supplier_user_schema import (
    SupplierUserCreate,
    SupplierUserUpdate,
    SupplierSetPassword,
)


class SupplierUserService:
    def __init__(
        self,
        supplier_user_repo: SupplierUserRepository,
        supplier_repo,
        password_service,
        email_service=None,
        audit_log_service=None,
    ):
        self.supplier_user_repo = supplier_user_repo
        self.supplier_repo = supplier_repo
        self.password_service = password_service
        self.email_service = email_service
        self.audit_log_service = audit_log_service

    def create_supplier_user(
        self,
        user_data: SupplierUserCreate,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> SupplierUser:
        supplier = self.supplier_repo.get_by_id(
            supplier_id=user_data.supplier_id,
            company_id=company_id,
        )
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found",
            )

        email = user_data.email.strip().lower()
        setup_token = secrets.token_urlsafe(32)
        setup_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

        existing_user = self.supplier_user_repo.get_by_email(
            email=email,
            supplier_id=user_data.supplier_id,
        )

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A supplier portal user with this email already exists for this supplier",
            )
        supplier_user = SupplierUser(
            supplier_id=user_data.supplier_id,
            email=email,
            hashed_password=None,
            password_setup_token=setup_token,
            password_setup_expires_at=setup_expires_at,
            has_completed_onboarding=False,
            is_active=True,
        )

        created_user = self.supplier_user_repo.create(supplier_user)
        # AUDIT LOGS
        if self.audit_log_service:
            self.audit_log_service.log_action(
                company_id=company_id,
                entity_type="SUPPLIER_USER",
                entity_id=created_user.id,
                action="SUPPLIER_USER_CREATED",
                actor_user_id=actor_user_id,
                description=f"Supplier user {created_user.email} created",
                details_json={
                    "entity_reference": created_user.email,
                    "supplier_name": supplier.name,
                    "user_email": created_user.email,
                },
                new_values_json={
                    "email": created_user.email,
                    "is_active": created_user.is_active,
                    "has_completed_onboarding": created_user.has_completed_onboarding,
                },
            )
        
        self.supplier_user_repo.db.commit()
        self.supplier_user_repo.db.refresh(created_user)
        setup_link = f"{settings.FRONTEND_BASE_URL}/supplier-setup-password?token={setup_token}"

        created_user.setup_link = setup_link

        if self.email_service:
            self.email_service.send_supplier_onboarding_email(
                to_email=email,
                supplier_name=supplier.name,
                setup_link=setup_link,
            )

        return created_user

    def resend_supplier_setup_link(
        self,
        supplier_user_id: UUID,
        supplier_id: UUID,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> SupplierUser:
        supplier = self.supplier_repo.get_by_id(
            supplier_id=supplier_id,
            company_id=company_id,
        )

        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found",
            )

        supplier_user = self.supplier_user_repo.get_by_id(
            supplier_user_id=supplier_user_id,
            supplier_id=supplier_id,
        )

        if not supplier_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier user not found",
            )

        if not supplier_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supplier user account is inactive",
            )

        if supplier_user.has_completed_onboarding:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier user has already completed setup",
            )

        setup_token = secrets.token_urlsafe(32)
        setup_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

        updated_user = self.supplier_user_repo.update(
            supplier_user=supplier_user,
            update_data={
                "password_setup_token": setup_token,
                "password_setup_expires_at": setup_expires_at,
            },
        )

        if self.audit_log_service:
            self.audit_log_service.log_action(
                company_id=company_id,
                entity_type="SUPPLIER_USER",
                entity_id=updated_user.id,
                action="SUPPLIER_USER_SETUP_LINK_RESENT",
                actor_user_id=actor_user_id,
                description=f"Supplier setup link resent to {updated_user.email}",
                details_json={
                    "entity_reference": updated_user.email,
                    "supplier_name": supplier.name,
                    "user_email": updated_user.email,
                },
                new_values_json={
                    "password_setup_expires_at": updated_user.password_setup_expires_at.isoformat()
                    if updated_user.password_setup_expires_at
                    else None,
                },
            )

        self.supplier_user_repo.db.commit()
        self.supplier_user_repo.db.refresh(updated_user)

        setup_link = f"{settings.FRONTEND_BASE_URL}/supplier-setup-password?token={setup_token}"

        if self.email_service:
            self.email_service.send_supplier_onboarding_email(
                to_email=updated_user.email,
                supplier_name=supplier.name,
                setup_link=setup_link,
            )

        return updated_user

    def set_supplier_password(
        self,
        data: SupplierSetPassword,
    ) -> SupplierUser:
        supplier_user = self.supplier_user_repo.get_by_setup_token(data.token)

        if not supplier_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired setup link",
            )

        if not supplier_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supplier user account is inactive",
            )

        if not supplier_user.password_setup_expires_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired setup link",
            )

        expires_at = supplier_user.password_setup_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Setup link has expired",
            )

        updated_user = self.supplier_user_repo.update(
            supplier_user=supplier_user,
            update_data={
                "hashed_password": self.password_service.hash_password(data.password),
                "password_setup_token": None,
                "password_setup_expires_at": None,
                "has_completed_onboarding": True,
            },
        )

        self.supplier_user_repo.db.commit()
        self.supplier_user_repo.db.refresh(updated_user)

        return updated_user

    def get_supplier_user(
        self,
        supplier_user_id: UUID,
        supplier_id: UUID,
        company_id: UUID,
    ) -> SupplierUser:
        supplier = self.supplier_repo.get_by_id(
            supplier_id=supplier_id,
            company_id=company_id,
        )
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found",
            )

        supplier_user = self.supplier_user_repo.get_by_id(
            supplier_user_id=supplier_user_id,
            supplier_id=supplier_id,
        )
        if not supplier_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier user not found",
            )

        return supplier_user

    def get_supplier_user_by_email(
        self,
        email: str,
        supplier_id: UUID,
        company_id: UUID,
    ) -> SupplierUser:
        supplier = self.supplier_repo.get_by_id(
            supplier_id=supplier_id,
            company_id=company_id,
        )
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found",
            )

        supplier_user = self.supplier_user_repo.get_by_email(
            email=email.strip().lower(),
            supplier_id=supplier_id,
        )
        if not supplier_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier user not found",
            )

        return supplier_user

    def get_all_supplier_users(
        self,
        supplier_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[SupplierUser]:
        supplier = self.supplier_repo.get_by_id(
            supplier_id=supplier_id,
            company_id=company_id,
        )
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found",
            )

        return self.supplier_user_repo.get_all(
            supplier_id=supplier_id,
            skip=skip,
            limit=limit,
        )

    def update_supplier_user(
        self,
        supplier_user_id: UUID,
        supplier_id: UUID,
        company_id: UUID,
        user_data: SupplierUserUpdate,
        actor_user_id: UUID,
    ) -> SupplierUser:
        supplier_user = self.get_supplier_user(
            supplier_user_id=supplier_user_id,
            supplier_id=supplier_id,
            company_id=company_id,
        )

        old_values = {
            "email": supplier_user.email,
            "is_active": supplier_user.is_active,
            "has_completed_onboarding": supplier_user.has_completed_onboarding,
        }

        update_data = user_data.model_dump(exclude_unset=True)

        if "email" in update_data:
            email = update_data["email"].strip().lower()

            existing_user = self.supplier_user_repo.get_by_email(
                email=email,
                supplier_id=supplier_id,
            )
            if existing_user and existing_user.id != supplier_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Supplier user with this email already exists",
                )

            update_data["email"] = email

        if "password" in update_data:
            password = update_data["password"].strip()
            update_data["hashed_password"] = self.password_service.hash_password(password)
            del update_data["password"]

        updated_user = self.supplier_user_repo.update(
            supplier_user=supplier_user,
            update_data=update_data,
        )

        if self.audit_log_service:
            self.audit_log_service.log_action(
                company_id=company_id,
                entity_type="SUPPLIER_USER",
                entity_id=updated_user.id,
                action="SUPPLIER_USER_UPDATED",
                actor_user_id=actor_user_id,
                description=f"Supplier user {updated_user.email} updated",
                details_json={
                    "entity_reference": updated_user.email,
                    "user_email": updated_user.email,
                },
                old_values_json=old_values,
                new_values_json={
                    "email": updated_user.email,
                    "is_active": updated_user.is_active,
                    "has_completed_onboarding": updated_user.has_completed_onboarding,
                    "password_changed": "hashed_password" in update_data,
                },
            )

        self.supplier_user_repo.db.commit()
        self.supplier_user_repo.db.refresh(updated_user)

        return updated_user

    def deactivate_supplier_user(
        self,
        supplier_user_id: UUID,
        supplier_id: UUID,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> SupplierUser:
        supplier_user = self.get_supplier_user(
            supplier_user_id=supplier_user_id,
            supplier_id=supplier_id,
            company_id=company_id,
        )

        if not supplier_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier user is already inactive",
            )

        updated_user = self.supplier_user_repo.update(
            supplier_user=supplier_user,
            update_data={"is_active": False},
        )

        if self.audit_log_service:
            self.audit_log_service.log_action(
                company_id=company_id,
                entity_type="SUPPLIER_USER",
                entity_id=updated_user.id,
                action="SUPPLIER_USER_DEACTIVATED",
                actor_user_id=actor_user_id,
                description=f"Supplier user {updated_user.email} deactivated",
                details_json={
                    "entity_reference": updated_user.email,
                    "user_email": updated_user.email,
                },
                old_values_json={"is_active": True},
                new_values_json={"is_active": False},
            )

        self.supplier_user_repo.db.commit()
        self.supplier_user_repo.db.refresh(updated_user)

        return updated_user

    def activate_supplier_user(
        self,
        supplier_user_id: UUID,
        supplier_id: UUID,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> SupplierUser:
        supplier_user = self.get_supplier_user(
            supplier_user_id=supplier_user_id,
            supplier_id=supplier_id,
            company_id=company_id,
        )

        if supplier_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier user is already active",
            )

        updated_user = self.supplier_user_repo.update(
            supplier_user=supplier_user,
            update_data={"is_active": True},
        )

        if self.audit_log_service:
            self.audit_log_service.log_action(
                company_id=company_id,
                entity_type="SUPPLIER_USER",
                entity_id=updated_user.id,
                action="SUPPLIER_USER_ACTIVATED",
                actor_user_id=actor_user_id,
                description=f"Supplier user {updated_user.email} activated",
                details_json={
                    "entity_reference": updated_user.email,
                    "user_email": updated_user.email,
                },
                old_values_json={"is_active": False},
                new_values_json={"is_active": True},
            )

        self.supplier_user_repo.db.commit()
        self.supplier_user_repo.db.refresh(updated_user)

        return updated_user

    def delete_supplier_user(
        self,
        supplier_user_id: UUID,
        supplier_id: UUID,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> None:
        supplier_user = self.get_supplier_user(
            supplier_user_id=supplier_user_id,
            supplier_id=supplier_id,
            company_id=company_id,
        )

        if self.audit_log_service:
            self.audit_log_service.log_action(
                company_id=company_id,
                entity_type="SUPPLIER_USER",
                entity_id=supplier_user.id,
                action="SUPPLIER_USER_DELETED",
                actor_user_id=actor_user_id,
                description=f"Supplier user {supplier_user.email} deleted",
                details_json={
                    "entity_reference": supplier_user.email,
                    "user_email": supplier_user.email,
                },
                old_values_json={
                    "email": supplier_user.email,
                    "is_active": supplier_user.is_active,
                    "has_completed_onboarding": supplier_user.has_completed_onboarding,
                },
            )

        self.supplier_user_repo.delete(supplier_user)
        self.supplier_user_repo.db.commit()