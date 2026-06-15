import uuid
from uuid import UUID

from fastapi import HTTPException, status

from app.models.supplier import Supplier
from app.repositories.supplier_repository import SupplierRepository
from app.schemas.supplier_schema import (
    SupplierCreate,
    SupplierSummaryRead,
    SupplierUpdate,
)


class SupplierService:
    def __init__(
        self,
        repo: SupplierRepository,
        permission_service=None,
    ):
        self.repo = repo
        self.permission_service = permission_service

    def _require_permission(
        self,
        role_id: UUID,
        company_id: UUID,
        permission_name: str,
        error_message: str,
    ) -> None:
        if self.permission_service is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Permission service is required.",
            )

        if not self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name=permission_name,
            company_id=company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_message,
            )

    def create_supplier(
        self,
        supplier_data: SupplierCreate,
        company_id: UUID,
        actor_role_id: UUID,
    ) -> Supplier:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="suppliers.create",
            error_message="You do not have permission to create suppliers.",
        )

        name = supplier_data.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Supplier name is required.")

        email = supplier_data.email.strip().lower() if supplier_data.email else None
        phone = supplier_data.phone.strip() if supplier_data.phone else None
        address = supplier_data.address.strip() if supplier_data.address else None
        contact_person = (
            supplier_data.contact_person.strip()
            if supplier_data.contact_person
            else None
        )

        if self.repo.get_by_name(name, company_id):
            raise HTTPException(
                status_code=409,
                detail="Supplier with this name already exists.",
            )

        if email and self.repo.get_by_email(email, company_id):
            raise HTTPException(
                status_code=409,
                detail="Supplier with this email already exists.",
            )

        if phone and self.repo.get_by_phone(phone, company_id):
            raise HTTPException(
                status_code=409,
                detail="Supplier with this phone number already exists.",
            )

        supplier = Supplier(
            id=uuid.uuid4(),
            company_id=company_id,
            name=name,
            email=email,
            phone=phone,
            address=address,
            contact_person=contact_person,
            is_active=True,
        )

        created_supplier = self.repo.create(supplier)
        self.repo.db.commit()
        self.repo.db.refresh(created_supplier)

        return created_supplier

    def get_supplier(
        self,
        supplier_id: UUID,
        company_id: UUID,
        actor_role_id: UUID,
    ) -> Supplier:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="suppliers.view",
            error_message="You do not have permission to view suppliers.",
        )

        supplier = self.repo.get_by_id(supplier_id, company_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found.")
        return supplier

    def get_all_suppliers(
        self,
        company_id: UUID,
        actor_role_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Supplier]:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="suppliers.view",
            error_message="You do not have permission to view suppliers.",
        )

        if skip < 0:
            raise HTTPException(status_code=400, detail="Skip must be zero or greater.")
        if limit < 1:
            raise HTTPException(status_code=400, detail="Limit must be greater than zero.")

        return self.repo.get_all(company_id, skip=skip, limit=limit)

    def get_paginated_suppliers(
        self,
        company_id: UUID,
        actor_role_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> dict:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="suppliers.view",
            error_message="You do not have permission to view suppliers.",
        )

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

        suppliers = self.repo.get_all(
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

        total_count = self.repo.count_all(company_id=company_id)

        return {
            "rows": suppliers,
            "total_count": total_count,
        }

    def get_supplier_summary(
        self,
        supplier_id: UUID,
        company_id: UUID,
        actor_role_id: UUID,
    ) -> SupplierSummaryRead:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="suppliers.view",
            error_message="You do not have permission to view suppliers.",
        )

        supplier = self.repo.get_by_id(supplier_id, company_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found.")

        recent_items = self.repo.get_recent_supplied_item_names(
            supplier_id=supplier_id,
            company_id=company_id,
            limit=5,
        )

        return SupplierSummaryRead(
            supplier_id=supplier.id,
            supplies=recent_items,
            location=supplier.address,
            recent_supplied_items=recent_items,
        )

    def update_supplier(
        self,
        supplier_id: UUID,
        supplier_data: SupplierUpdate,
        company_id: UUID,
        actor_role_id: UUID,
    ) -> Supplier:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="suppliers.update",
            error_message="You do not have permission to update suppliers.",
        )

        supplier = self.repo.get_by_id(supplier_id, company_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found.")

        update_data = supplier_data.model_dump(exclude_unset=True)

        if "name" in update_data:
            name = update_data["name"].strip()
            if not name:
                raise HTTPException(status_code=400, detail="Supplier name cannot be empty.")

            if name != supplier.name and self.repo.has_procurement_records(
                supplier_id,
                company_id,
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Supplier name cannot be changed because this supplier is already linked "
                        "to procurement records. Update contact details instead."
                    ),
                )

            existing_supplier = self.repo.get_by_name(name, company_id)  
            if existing_supplier and existing_supplier.id != supplier.id:
                raise HTTPException(
                    status_code=409,
                    detail="Supplier with this name already exists.",
                )

            update_data["name"] = name

        if "email" in update_data:
            email = update_data["email"]
            normalized_email = email.strip().lower() if email else None

            if normalized_email:
                existing_email = self.repo.get_by_email(normalized_email, company_id)
                if existing_email and existing_email.id != supplier.id:
                    raise HTTPException(
                        status_code=409,
                        detail="Supplier with this email already exists.",
                    )

            update_data["email"] = normalized_email

        if "phone" in update_data:
            phone = update_data["phone"]
            normalized_phone = phone.strip() if phone else None

            if normalized_phone:
                existing_phone = self.repo.get_by_phone(normalized_phone, company_id)
                if existing_phone and existing_phone.id != supplier.id:
                    raise HTTPException(
                        status_code=409,
                        detail="Supplier with this phone number already exists.",
                    )

            update_data["phone"] = normalized_phone

        if "address" in update_data:
            address = update_data["address"]
            update_data["address"] = address.strip() if address else None

        if "contact_person" in update_data:
            contact_person = update_data["contact_person"]
            update_data["contact_person"] = (
                contact_person.strip() if contact_person else None
            )

        for field, value in update_data.items():
            setattr(supplier, field, value)

        updated_supplier = self.repo.update(supplier)
        self.repo.db.commit()
        self.repo.db.refresh(updated_supplier)

        return updated_supplier

    def activate_supplier(
        self,
        supplier_id: UUID,
        company_id: UUID,
        actor_role_id: UUID,
    ) -> Supplier:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="suppliers.update",
            error_message="You do not have permission to update suppliers.",
        )

        supplier = self.repo.get_by_id(supplier_id, company_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found.")

        if supplier.is_active:
            raise HTTPException(status_code=400, detail="Supplier is already active.")

        supplier.is_active = True

        updated_supplier = self.repo.update(supplier)
        self.repo.db.commit()
        self.repo.db.refresh(updated_supplier)

        return updated_supplier

    def deactivate_supplier(
        self,
        supplier_id: UUID,
        company_id: UUID,
        actor_role_id: UUID,
    ) -> Supplier:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="suppliers.update",
            error_message="You do not have permission to update suppliers.",
        )

        supplier = self.repo.get_by_id(supplier_id, company_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found.")

        if not supplier.is_active:
            raise HTTPException(status_code=400, detail="Supplier is already inactive.")

        supplier.is_active = False

        updated_supplier = self.repo.update(supplier)
        self.repo.db.commit()
        self.repo.db.refresh(updated_supplier)

        return updated_supplier

    def delete_supplier(
        self,
        supplier_id: UUID,
        company_id: UUID,
        actor_role_id: UUID,
    ) -> None:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="suppliers.delete",
            error_message="You do not have permission to delete suppliers.",
        )

        supplier = self.repo.get_by_id(supplier_id, company_id)
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found.")

        if self.repo.has_procurement_records(supplier_id, company_id):
            raise HTTPException(
                status_code=400,
                detail=(
                    "Supplier cannot be deleted because it is linked to procurement records. "
                    "Deactivate instead."
                ),
            )

        self.repo.delete(supplier)
        self.repo.db.commit()
