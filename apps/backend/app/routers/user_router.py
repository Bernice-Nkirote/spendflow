from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.repositories.user_repository import UserRepository
from app.schemas.user_schema import UserCreate, UserRead, UserUpdate
from app.services.user_service import UserService


router = APIRouter(prefix="/users", tags=["Users"])


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    repo = UserRepository(db)
    return UserService(repo)


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    current_user=Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.create_user(user_data, current_user.company_id)


@router.get("/", response_model=list[UserRead])
def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.get_all_users(
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: UUID,
    current_user=Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.get_user(user_id, current_user.company_id)


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    current_user=Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.update_user(user_id, user_data, current_user.company_id)


@router.patch("/{user_id}/activate", response_model=UserRead)
def activate_user(
    user_id: UUID,
    current_user=Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.activate_user(user_id, current_user.company_id)


@router.patch("/{user_id}/deactivate", response_model=UserRead)
def deactivate_user(
    user_id: UUID,
    current_user=Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.deactivate_user(user_id, current_user.company_id)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    current_user=Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    service.delete_user(user_id, current_user.company_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)