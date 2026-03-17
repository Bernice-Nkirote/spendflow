from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.schemas.user_schema import UserCreate, UserRead, UserUpdate
from app.services.user_service import UserService
from app.core.database import get_db
from app.core.auth_dependancy import get_current_user


router = APIRouter(prefix="/users", tags=["Users"])

service = UserService()


# Create user
@router.post("/", response_model=UserRead)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    return service.create_user(db, user)


# Get single user
@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db)
):

    return service.get_user(db, user_id)


# List users in company
@router.get("/", response_model=list[UserRead])
def list_company_users(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):

    company_id = current_user["company_id"]

    return service.list_company_users(db, company_id)


# Update user
@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: Session = Depends(get_db)
):

    return service.update_user(db, user_id, user_data)


# Deactivate user
@router.delete("/{user_id}")
def deactivate_user(
    user_id: UUID,
    db: Session = Depends(get_db)
):

    service.deactivate_user(db, user_id)

    return {"message": "User deactivated"}