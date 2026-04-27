from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_admin_user
from app.core.database import get_db
from app.repositories.company_repository import CompanyRepository
from app.schemas.company_schema import CompanyRead, CompanyUpdate
from app.services.company_service import CompanyService


router = APIRouter(
    prefix="/companies",
    tags=["Companies"],
    dependencies=[Depends(get_current_admin_user)],
)


def get_service(db: Session = Depends(get_db)) -> CompanyService:
    return CompanyService(repo=CompanyRepository(db))


@router.get("/me", response_model=CompanyRead)
def get_my_company(
    service: CompanyService = Depends(get_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_company(current_user.company_id)


@router.put("/me", response_model=CompanyRead)
def update_my_company(
    data: CompanyUpdate,
    service: CompanyService = Depends(get_service),
    current_user=Depends(get_current_admin_user),
):
    return service.update_company(
        company_id=current_user.company_id,
        data=data,
    )


@router.patch("/me/deactivate", response_model=CompanyRead)
def deactivate_my_company(
    service: CompanyService = Depends(get_service),
    current_user=Depends(get_current_admin_user),
):
    return service.deactivate_company(current_user.company_id)

#  only admin users of a certain company with company id == company id should access their company