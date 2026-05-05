from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.core.auth_dependancy import get_current_user
from app.models.user import User

from app.repositories.company_repository import CompanyRepository
from app.repositories.user_repository import UserRepository

from app.schemas.user_schema import UserLogin
from app.schemas.auth_schema import AuthMeResponse


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login")
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db),
):
    company_repo = CompanyRepository(db)
    user_repo = UserRepository(db)

    company_name = login_data.company_name.strip()
    email = login_data.email.strip().lower()
    password = login_data.password.strip()

    if not company_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company name is required.",
        )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required.",
        )

    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required.",
        )

    company = company_repo.get_by_name(company_name)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    if not company.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company is inactive.",
        )

    db_user = user_repo.get_by_email(email, company.id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    if not verify_password(password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials.",
        )

    if not db_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    access_token = create_access_token(
        data={
            "sub": str(db_user.id),
            "company_id": str(db_user.company_id),
            "role_id": str(db_user.role_id),
            "type": "USER",
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }

@router.get("/me", response_model=AuthMeResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return AuthMeResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        role_name=current_user.role.name if current_user.role else None,
        company_name=current_user.company.name if current_user.company else None,
    )