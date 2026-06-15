import uuid
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.approval_workflows_table import ApprovalWorkflow
from app.models.enums import EntityTypeEnum
from app.models.workflow_level import WorkflowLevel
from app.models.workflow_level_roles import WorkflowLevelRole
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.repositories.department_repository import DepartmentRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.workflow_role_repository import WorkflowLevelRoleRepository


def _seed_single_workflow(
    company_id: UUID,
    workflow_name: str,
    entity_type: EntityTypeEnum,
    level_name: str,
    approver_role_id: UUID,
    department_id: UUID,
    workflow_repo: ApprovalWorkflowRepository,
    level_repo: WorkflowLevelRepository,
    workflow_role_repo: WorkflowLevelRoleRepository,
) -> None:
    workflow = workflow_repo.get_active_by_entity_type(
        entity_type,
        company_id,
    )

    if not workflow:
        workflow = workflow_repo.get_by_name(
            workflow_name,
            company_id,
        )

    if not workflow:
        workflow = ApprovalWorkflow(
            id=uuid.uuid4(),
            company_id=company_id,
            name=workflow_name,
            entity_type=entity_type,
            is_active=True,
        )
        workflow = workflow_repo.create(workflow)
    else:
        workflow.name = workflow_name
        workflow.entity_type = entity_type
        workflow.is_active = True
        workflow = workflow_repo.update(workflow)

    level = level_repo.get_by_workflow_and_level_order(
        workflow_id=workflow.id,
        level_order=1,
        company_id=company_id,
    )

    if not level:
        level = WorkflowLevel(
            id=uuid.uuid4(),
            workflow_id=workflow.id,
            company_id=company_id,
            name=level_name,
            level_order=1,
            min_amount=None,
            max_amount=None,
            department_id=department_id,
            condition_expression=None,
        )
        level = level_repo.create(level)
    else:
        level.name = level_name
        level.department_id = department_id
        level.min_amount = None
        level.max_amount = None
        level.condition_expression = None
        level = level_repo.update(level)

    existing_level_role = workflow_role_repo.get_by_level_and_role(
        level_id=level.id,
        role_id=approver_role_id,
        company_id=company_id,
    )

    if not existing_level_role:
        workflow_level_role = WorkflowLevelRole(
            id=uuid.uuid4(),
            company_id=company_id,
            level_id=level.id,
            role_id=approver_role_id,
        )
        workflow_role_repo.create(workflow_level_role)


def seed_default_approval_workflows_for_company(
    company_id: UUID,
    db: Session,
    business_type: str = "company",
) -> None:
    """
    Seeds default approval workflows for a newly created company.

    This function is safe to run multiple times:
    - it does not duplicate workflows
    - it does not duplicate workflow levels
    - it does not duplicate workflow level role assignments
    """

    workflow_repo = ApprovalWorkflowRepository(db)
    level_repo = WorkflowLevelRepository(db)
    workflow_role_repo = WorkflowLevelRoleRepository(db)
    role_repo = RoleRepository(db)
    department_repo = DepartmentRepository(db)

    if business_type == "sole_proprietorship":
        approver_role_name = "Admin"
        approval_department_name = "Administration"
    else:
        approver_role_name = "Approver"
        approval_department_name = "Procurement"

    approver_role = role_repo.get_by_name(approver_role_name, company_id)
    if not approver_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{approver_role_name} role was not found during approval workflow seeding.",
        )

    approval_department = department_repo.get_by_name(approval_department_name, company_id)
    if not approval_department:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{approval_department_name} department was not found during approval workflow seeding.",
        )

    _seed_single_workflow(
        company_id=company_id,
        workflow_name="Purchase Requisition Approval",
        entity_type=EntityTypeEnum.PR,
        level_name="Procurement Review",
        approver_role_id=approver_role.id,
        department_id=approval_department.id,
        workflow_repo=workflow_repo,
        level_repo=level_repo,
        workflow_role_repo=workflow_role_repo,
    )

    _seed_single_workflow(
        company_id=company_id,
        workflow_name="Purchase Order Approval",
        entity_type=EntityTypeEnum.PO,
        level_name="Purchase Order Review",
        approver_role_id=approver_role.id,
        department_id=approval_department.id,
        workflow_repo=workflow_repo,
        level_repo=level_repo,
        workflow_role_repo=workflow_role_repo,
    )

    if business_type == "sole_proprietorship":
        _seed_single_workflow(
            company_id=company_id,
            workflow_name="Invoice Approval",
            entity_type=EntityTypeEnum.INVOICE,
            level_name="Owner Invoice Review",
            approver_role_id=approver_role.id,
            department_id=approval_department.id,
            workflow_repo=workflow_repo,
            level_repo=level_repo,
            workflow_role_repo=workflow_role_repo,
        )

        _seed_single_workflow(
            company_id=company_id,
            workflow_name="Payment Approval",
            entity_type=EntityTypeEnum.PAYMENT,
            level_name="Owner Payment Review",
            approver_role_id=approver_role.id,
            department_id=approval_department.id,
            workflow_repo=workflow_repo,
            level_repo=level_repo,
            workflow_role_repo=workflow_role_repo,
        )
