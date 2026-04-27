from uuid import UUID

from fastapi import HTTPException, status

from app.models.suplier_user import SupplierUser
from app.repositories.supplier_user_repository import SupplierUserRepository
from app.schemas.supplier_user_schema import (
    SupplierUserCreate,
    SupplierUserUpdate,
)


class SupplierUserService:
    def __init__(
        self,
        supplier_user_repo: SupplierUserRepository,
        supplier_repo,
        password_service,
    ):
        self.supplier_user_repo = supplier_user_repo
        self.supplier_repo = supplier_repo
        self.password_service = password_service

    def create_supplier_user(
        self,
        user_data: SupplierUserCreate,
        company_id: UUID,
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
        password = user_data.password.strip()

        existing_user = self.supplier_user_repo.get_by_email(
            email=email,
            supplier_id=user_data.supplier_id,
        )
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier user with this email already exists",
            )

        supplier_user = SupplierUser(
            supplier_id=user_data.supplier_id,
            email=email,
            hashed_password=self.password_service.hash_password(password),
            is_active=True,
        )

        created_user = self.supplier_user_repo.create(supplier_user)
        self.supplier_user_repo.db.commit()
        self.supplier_user_repo.db.refresh(created_user)

        return created_user

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
    ) -> SupplierUser:
        supplier_user = self.get_supplier_user(
            supplier_user_id=supplier_user_id,
            supplier_id=supplier_id,
            company_id=company_id,
        )

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

        self.supplier_user_repo.db.commit()
        self.supplier_user_repo.db.refresh(updated_user)

        return updated_user

    def deactivate_supplier_user(
        self,
        supplier_user_id: UUID,
        supplier_id: UUID,
        company_id: UUID,
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

        self.supplier_user_repo.db.commit()
        self.supplier_user_repo.db.refresh(updated_user)

        return updated_user

    def activate_supplier_user(
        self,
        supplier_user_id: UUID,
        supplier_id: UUID,
        company_id: UUID,
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

        self.supplier_user_repo.db.commit()
        self.supplier_user_repo.db.refresh(updated_user)

        return updated_user

    def delete_supplier_user(
        self,
        supplier_user_id: UUID,
        supplier_id: UUID,
        company_id: UUID,
    ) -> None:
        supplier_user = self.get_supplier_user(
            supplier_user_id=supplier_user_id,
            supplier_id=supplier_id,
            company_id=company_id,
        )

        self.supplier_user_repo.delete(supplier_user)
        self.supplier_user_repo.db.commit()