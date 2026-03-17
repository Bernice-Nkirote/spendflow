from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.company_schema import CompanyCreate, CompanyResponse
from app.services.company_service import CompanyService
from pydantic import BaseModel, ConfigDict
from uuid import UUID

router = APIRouter(prefix="/companies", tags=["Companies"])
service = CompanyService()


# create company
@router.post("/", response_model=CompanyResponse)
def create_company(company: CompanyCreate, db:Session = Depends(get_db)):
    existing = db.query(service.repo.model).filter_by(name=company.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company already exists")
    return service.create_company(db, name=company.name, is_active=company.is_active)

# List the companies
@router.get("/", response_model=list[CompanyResponse])
def list_companies(db:Session = Depends(get_db)):
    return service.list_companies(db)

# Get single company
@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(company_id: UUID, db: Session = Depends(get_db)):
    company = service.get_company(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company