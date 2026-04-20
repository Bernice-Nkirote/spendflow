import uuid
from uuid import UUID

from fastapi import HTTPException, status

from app.models.supplier import Supplier
from app.repositories.supplier_repository import SupplierRepository
from app.schemas.supplier_schema import SupplierCreate, SupplierUpdate


class SupplierService:
    def __init__(self, repo: SupplierRepository):
        self.repo = repo

    def create_supplier(self, supplier_data: SupplierCreate, company_id: UUID) -> Supplier:
        name = supplier_data.name.strip()
        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier name is required.",
            )

        email = supplier_data.email.strip().lower() if supplier_data.email else None
        phone = supplier_data.phone.strip() if supplier_data.phone else None
        address = supplier_data.address.strip() if supplier_data.address else None
        contact_person = (
            supplier_data.contact_person.strip()
            if supplier_data.contact_person
            else None
        )

        existing_supplier = self.repo.get_by_name(name, company_id)
        if existing_supplier:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Supplier with this name already exists.",
            )

        if email:
            existing_email = self.repo.get_by_email(email, company_id)
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Supplier with this email already exists.",
                )

        if phone:
            existing_phone = self.repo.get_by_phone(phone, company_id)
            if existing_phone:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
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

        return self.repo.create(supplier)

    def get_supplier(self, supplier_id: UUID, company_id: UUID) -> Supplier:
        supplier = self.repo.get_by_id(supplier_id, company_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found.",
            )
        return supplier

    def get_all_suppliers(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Supplier]:
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

    def update_supplier(
        self,
        supplier_id: UUID,
        supplier_data: SupplierUpdate,
        company_id: UUID,
    ) -> Supplier:
        supplier = self.repo.get_by_id(supplier_id, company_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found.",
            )

        update_data = supplier_data.model_dump(exclude_unset=True)

        if "name" in update_data:
            normalized_name = update_data["name"].strip()
            if not normalized_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Supplier name cannot be empty.",
                )

            existing_supplier = self.repo.get_by_name(normalized_name, company_id)
            if existing_supplier and existing_supplier.id != supplier.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Supplier with this name already exists.",
                )

            update_data["name"] = normalized_name

        if "email" in update_data:
            email = update_data["email"]
            normalized_email = email.strip().lower() if email else None

            if normalized_email:
                existing_email = self.repo.get_by_email(normalized_email, company_id)
                if existing_email and existing_email.id != supplier.id:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
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
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Supplier with this phone number already exists.",
                    )

            update_data["phone"] = normalized_phone

        if "address" in update_data and update_data["address"] is not None:
            update_data["address"] = update_data["address"].strip()

        if "contact_person" in update_data and update_data["contact_person"] is not None:
            update_data["contact_person"] = update_data["contact_person"].strip()

        return self.repo.update(supplier, update_data)

    def activate_supplier(self, supplier_id: UUID, company_id: UUID) -> Supplier:
        supplier = self.repo.get_by_id(supplier_id, company_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found.",
            )

        if supplier.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier is already active.",
            )

        return self.repo.update(supplier, {"is_active": True})

    def deactivate_supplier(self, supplier_id: UUID, company_id: UUID) -> Supplier:
        supplier = self.repo.get_by_id(supplier_id, company_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found.",
            )

        if not supplier.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier is already inactive.",
            )

        return self.repo.update(supplier, {"is_active": False})

    def delete_supplier(self, supplier_id: UUID, company_id: UUID) -> None:
        supplier = self.repo.get_by_id(supplier_id, company_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found.",
            )

        if self.repo.has_invoices(supplier_id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier cannot be deleted because it has invoices. Deactivate instead.",
            )

        if self.repo.has_purchase_orders(supplier_id, company_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier cannot be deleted because it has purchase orders. Deactivate instead.",
            )

        self.repo.delete(supplier)