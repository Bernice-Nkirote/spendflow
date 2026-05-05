from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth_dependancy import get_current_user
from app.models.user import User
from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard_schema import DashboardResponse
from app.services.dashboard_service import DashboardService


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dashboard_repo = DashboardRepository(db)
    dashboard_service = DashboardService(dashboard_repo)

    return dashboard_service.get_dashboard(
        company_id=current_user.company_id,
    )