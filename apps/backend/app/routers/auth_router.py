from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserLogin


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login")
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)

    email = login_data.email.strip().lower()
    password = login_data.password.strip()

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

    db_user = repo.get_by_email(email, login_data.company_id)

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
            "role": str(db_user.role_id),
            "type": "USER",
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }