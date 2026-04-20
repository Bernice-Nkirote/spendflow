from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.company_repository import CompanyRepository
from app.schemas.company_schema import CompanyCreate, CompanyRead, CompanyUpdate
from app.services.company_service import CompanyService


router = APIRouter(prefix="/companies", tags=["Companies"])


def get_service(db: Session = Depends(get_db)) -> CompanyService:
    """
    Build CompanyService with repository.
    """
    return CompanyService(repo=CompanyRepository(db))


@router.post("/", response_model=CompanyRead)
def create_company(
    company: CompanyCreate,
    service: CompanyService = Depends(get_service),
):
    """
    Create a company.
    """
    return service.create_company(company)


@router.get("/", response_model=list[CompanyRead])
def get_all_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    service: CompanyService = Depends(get_service),
):
    """
    Get all companies.
    """
    return service.get_all_companies(skip=skip, limit=limit)


@router.get("/{company_id}", response_model=CompanyRead)
def get_company(
    company_id: UUID,
    service: CompanyService = Depends(get_service),
):
    """
    Get one company.
    """
    return service.get_company(company_id)


@router.put("/{company_id}", response_model=CompanyRead)
def update_company(
    company_id: UUID,
    data: CompanyUpdate,
    service: CompanyService = Depends(get_service),
):
    """
    Update a company.
    """
    return service.update_company(company_id, data)


@router.patch("/{company_id}/deactivate", response_model=CompanyRead)
def deactivate_company(
    company_id: UUID,
    service: CompanyService = Depends(get_service),
):
    """
    Deactivate a company.
    """
    return service.deactivate_company(company_id)


@router.patch("/{company_id}/activate", response_model=CompanyRead)
def activate_company(
    company_id: UUID,
    service: CompanyService = Depends(get_service),
):
    """
    Activate a company.
    """
    return service.activate_company(company_id)


@router.delete("/{company_id}")
def delete_company(
    company_id: UUID,
    service: CompanyService = Depends(get_service),
):
    """
    Delete a company.
    """
    return service.delete_company(company_id)