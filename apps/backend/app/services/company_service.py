import uuid
from fastapi import HTTPException, status

from app.models.company import Company
from app.repositories.company_repository import CompanyRepository
from app.schemas.company_schema import CompanyCreate, CompanyUpdate


class CompanyService:
    def __init__(self, repo: CompanyRepository):
        self.repo = repo

    def create_company(self, data: CompanyCreate) -> Company:
        # Company name must be present
        if not data.name or not data.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company name is required"
            )

        # Prevent duplicate company names
        existing = self.repo.get_by_name(data.name.strip())
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company with this name already exists"
            )

        company = Company(
            name=data.name.strip(),
            is_active=data.is_active if data.is_active is not None else True
        )

        return self.repo.create(company)

    def get_company(self, company_id: uuid.UUID) -> Company:
        company = self.repo.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        return company

    def get_all_companies(
        self,
        skip: int = 0,
        limit: int = 100
    ):
        # Validate pagination
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="skip cannot be negative"
            )

        if limit <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="limit must be greater than zero"
            )

        return self.repo.get_all(skip=skip, limit=limit)

    def update_company(
        self,
        company_id: uuid.UUID,
        data: CompanyUpdate
    ) -> Company:
        company = self.repo.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )

        update_data = data.model_dump(exclude_unset=True)

        new_name = update_data.get("name")
        if new_name is not None:
            if not new_name.strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Company name cannot be empty"
                )

            if new_name.strip() != company.name:
                existing = self.repo.get_by_name(new_name.strip())
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Company with this name already exists"
                    )

                update_data["name"] = new_name.strip()

        return self.repo.update(company, update_data)

    def deactivate_company(self, company_id: uuid.UUID) -> Company:
        company = self.repo.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )

        if not company.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company is already inactive"
            )

        return self.repo.update(company, {"is_active": False})

    def activate_company(self, company_id: uuid.UUID) -> Company:
        company = self.repo.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )

        if company.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company is already active"
            )

        return self.repo.update(company, {"is_active": True})

    def delete_company(self, company_id: uuid.UUID) -> dict:
        company = self.repo.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )

        self.repo.delete(company)
        return {"message": "Company deleted successfully"}