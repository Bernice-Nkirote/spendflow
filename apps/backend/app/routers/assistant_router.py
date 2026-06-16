from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.assistant_repository import AssistantRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_permission_repository import RolePermissionRepository
from app.repositories.role_repository import RoleRepository
from app.schemas.assistant_schema import (
    AssistantChatRequest,
    AssistantChatResponse,
    AssistantSupplierSuggestion,
    SupplierSuggestionRequest,
)
from app.services.assistant_service import AssistantService
from app.services.audit_log_service import AuditLogService
from app.services.permission_service import PermissionService

router = APIRouter(prefix="/assistant", tags=["Assistant"])


def get_assistant_service(db: Session = Depends(get_db)) -> AssistantService:
    audit_log_service = AuditLogService(repo=AuditLogRepository(db))
    permission_service = PermissionService(
        permission_repo=PermissionRepository(db),
        role_permission_repo=RolePermissionRepository(db),
        role_repo=RoleRepository(db),
        audit_log_service=audit_log_service,
    )

    return AssistantService(
        repo=AssistantRepository(db),
        permission_service=permission_service,
    )


@router.post("/chat", response_model=AssistantChatResponse)
def chat_with_assistant(
    request: AssistantChatRequest,
    current_user: User = Depends(get_current_user),
    service: AssistantService = Depends(get_assistant_service),
):
    return service.chat(
        request=request,
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
    )


@router.post(
    "/supplier-suggestions",
    response_model=list[AssistantSupplierSuggestion],
)
def suggest_suppliers(
    request: SupplierSuggestionRequest,
    current_user: User = Depends(get_current_user),
    service: AssistantService = Depends(get_assistant_service),
):
    return service.suggest_suppliers(
        request=request,
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
    )
