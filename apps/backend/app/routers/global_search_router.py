from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.global_search_repository import GlobalSearchRepository
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_permission_repository import RolePermissionRepository
from app.repositories.role_repository import RoleRepository
from app.schemas.global_search_schema import GlobalSearchResponse
from app.services.audit_log_service import AuditLogService
from app.services.global_search_service import GlobalSearchService
from app.services.permission_service import PermissionService


router = APIRouter(
    prefix="/global-search",
    tags=["Global Search"],
)


def get_global_search_service(
    db: Session = Depends(get_db),
) -> GlobalSearchService:
    audit_log_service = AuditLogService(
        repo=AuditLogRepository(db),
    )

    role_repo = RoleRepository(db)

    permission_service = PermissionService(
        permission_repo=PermissionRepository(db),
        role_permission_repo=RolePermissionRepository(db),
        role_repo=role_repo,
        audit_log_service=audit_log_service,
    )

    return GlobalSearchService(
        repo=GlobalSearchRepository(db),
        permission_service=permission_service,
        role_repo=role_repo,
    )


@router.get("/", response_model=GlobalSearchResponse)
def global_search(
    q: str = Query(..., min_length=2),
    limit: int = Query(5, ge=1, le=10),
    current_user=Depends(get_current_user),
    service: GlobalSearchService = Depends(get_global_search_service),
):
    return service.search(
        current_user=current_user,
        query=q,
        limit=limit,
    )