from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.company_repository import CompanyRepository
from app.repositories.department_repository import DepartmentRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.company_signup_schema import (
    CompanySignupRequest,
    CompanySignupResponse,
)
from app.services.company_signup_service import CompanySignupService


router = APIRouter(prefix="/company-signup", tags=["Company Signup"])


def get_signup_service(db: Session = Depends(get_db)) -> CompanySignupService:
    return CompanySignupService(
        db=db,
        company_repo=CompanyRepository(db),
        role_repo=RoleRepository(db),
        department_repo=DepartmentRepository(db),
        user_repo=UserRepository(db),
    )


@router.post(
    "/",
    response_model=CompanySignupResponse,
    status_code=status.HTTP_201_CREATED,
)
def signup_company(
    data: CompanySignupRequest,
    service: CompanySignupService = Depends(get_signup_service),
):
    return service.signup_company(data)