from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user_schema import UserLogin
from app.repositories.user_repository import UserRepository
from app.core.security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

repo = UserRepository()


from fastapi.security import OAuth2PasswordRequestForm

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    db_user = repo.get_by_email(db, form_data.username)

    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={
            "sub": str(db_user.id),
            "company_id": str(db_user.company_id),
            "role": str(db_user.role_id),
            "type":"USER"
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }