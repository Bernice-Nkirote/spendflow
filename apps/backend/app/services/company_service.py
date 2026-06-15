import uuid

from fastapi import HTTPException, status

from app.models.company import Company
from app.repositories.company_repository import CompanyRepository
from app.schemas.company_schema import CompanyCreate, CompanyUpdate
VALID_BUSINESS_TYPES = {"sole_proprietorship", "partnership", "company"}

class CompanyService:
    def __init__(self, repo: CompanyRepository):
        self.repo = repo

    def create_company(self, data: CompanyCreate) -> Company:
        name = data.name.strip()
        currency=data.currency.strip().upper() if data.currency else "KES"
        business_type = data.business_type or "company"

        if business_type not in VALID_BUSINESS_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid business type",
            )
        if not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company name is required",
            )

        existing_company = self.repo.get_by_name(name)
        if existing_company:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Company with this name already exists",
            )

        company = Company(
            name=name,
            currency=currency,
            business_type=business_type,
            is_active=data.is_active if data.is_active is not None else True,
        )

        created_company = self.repo.create(company)
        self.repo.db.commit()
        self.repo.db.refresh(created_company)

        return created_company

    def get_company(self, company_id: uuid.UUID) -> Company:
        company = self.repo.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found",
            )

        return company

    def get_all_companies(
        self,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Company]:
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip cannot be negative",
            )

        if limit <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be greater than zero",
            )

        return self.repo.get_all(skip=skip, limit=limit)

    def update_company(
        self,
        company_id: uuid.UUID,
        data: CompanyUpdate,
    ) -> Company:
        company = self.get_company(company_id)

        update_data = data.model_dump(exclude_unset=True)

        if "name" in update_data:
            name = update_data["name"].strip()
            if not name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Company name cannot be empty",
                )

            existing_company = self.repo.get_by_name(name)
            if existing_company and existing_company.id != company.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Company with this name already exists",
                )

            update_data["name"] = name

        if "business_type" in update_data:
            business_type = update_data["business_type"]
            if business_type not in VALID_BUSINESS_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid business type",
                )

        for field, value in update_data.items():
            setattr(company, field, value)

        updated_company = self.repo.update(company)
        self.repo.db.commit()
        self.repo.db.refresh(updated_company)

        return updated_company

    def deactivate_company(self, company_id: uuid.UUID) -> Company:
        company = self.get_company(company_id)

        if not company.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company is already inactive",
            )

        company.is_active = False

        updated_company = self.repo.update(company)
        self.repo.db.commit()
        self.repo.db.refresh(updated_company)

        return updated_company

    def activate_company(self, company_id: uuid.UUID) -> Company:
        company = self.get_company(company_id)

        if company.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company is already active",
            )

        company.is_active = True

        updated_company = self.repo.update(company)
        self.repo.db.commit()
        self.repo.db.refresh(updated_company)

        return updated_company

    def delete_company(self, company_id: uuid.UUID) -> dict:
        company = self.get_company(company_id)

        self.repo.delete(company)
        self.repo.db.commit()

        return {"message": "Company deleted successfully"}
