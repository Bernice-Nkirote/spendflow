import uuid
import traceback

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.company import Company
from app.models.department import Department
from app.models.role import Role
from app.models.user import User
from app.seeds.seed_permission import seed_permissions_for_company
from app.seeds.seed_approval_workflows import seed_default_approval_workflows_for_company
from app.repositories.company_repository import CompanyRepository
from app.repositories.department_repository import DepartmentRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.company_signup_schema import CompanySignupRequest


DEFAULT_ROLE_NAMES = [
    "Admin",
    "Procurement",
    "Finance",
    "Approver",
]

DEFAULT_DEPARTMENT_NAMES = [
    "Administration",
    "Procurement",
    "Finance",
    "HR",
    "Marketing",
]

VALID_BUSINESS_TYPES = {"sole_proprietorship", "partnership", "company"}

class CompanySignupService:
    def __init__(
        self,
        db: Session,
        company_repo: CompanyRepository,
        role_repo: RoleRepository,
        department_repo: DepartmentRepository,
        user_repo: UserRepository,
    ):
        self.db = db
        self.company_repo = company_repo
        self.role_repo = role_repo
        self.department_repo = department_repo
        self.user_repo = user_repo

    def signup_company(self, data: CompanySignupRequest):
        company_name = data.company_name.strip()
        admin_name = data.admin_name.strip()
        admin_email = data.admin_email.strip().lower()
        password = data.password.strip()
        phone_number = data.phone_number.strip() if data.phone_number else None
        business_type = data.business_type or "company"

        if business_type not in VALID_BUSINESS_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid business type.",
            )

        if not company_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company name is required.",
            )

        if not admin_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin name is required.",
            )

        if not admin_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admin email is required.",
            )

        if not password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is required.",
            )

        existing_company = self.company_repo.get_by_name(company_name)
        if existing_company:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Company with this name already exists.",
            )

        seeded_roles = []
        seeded_departments = []

        try:
            company = Company(
                id=uuid.uuid4(),
                name=company_name,
                business_type=business_type,
                is_active=True,
            )
            self.company_repo.create(company)

            for role_name in DEFAULT_ROLE_NAMES:
                existing_role = self.role_repo.get_by_name(role_name, company.id)
                if existing_role:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Role '{role_name}' already exists for this company.",
                    )

                role = Role(
                    id=uuid.uuid4(),
                    company_id=company.id,
                    name=role_name,
                    description=None,
                    is_active=True,
                    is_system_role=role_name == "Admin",
                )
                seeded_roles.append(self.role_repo.create(role))

            seed_permissions_for_company(company.id, self.db)

            for department_name in DEFAULT_DEPARTMENT_NAMES:
                existing_department = self.department_repo.get_by_name(
                    department_name,
                    company.id,
                )
                if existing_department:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Department '{department_name}' already exists for this company.",
                    )

                department = Department(
                    id=uuid.uuid4(),
                    company_id=company.id,
                    name=department_name,
                    is_active=True,
                )
                seeded_departments.append(self.department_repo.create(department))
            seed_default_approval_workflows_for_company(
                company.id,
                self.db,
                business_type=business_type,
                )
            
            admin_role = self.role_repo.get_by_name("Admin", company.id)
            if not admin_role:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Admin role was not created during company signup.",
                )

            existing_admin_user = self.user_repo.get_by_email(admin_email, company.id)
            if existing_admin_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Admin email already exists in this company.",
                )

            admin_department = None
            if business_type == "sole_proprietorship":
                admin_department = self.department_repo.get_by_name(
                    "Administration",
                    company.id,
                )
                if not admin_department:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Administration department was not created during company signup.",
                    )

            admin_user = User(
                id=uuid.uuid4(),
                company_id=company.id,
                department_id=admin_department.id if admin_department else None,
                role_id=admin_role.id,
                name=admin_name,
                email=admin_email,
                phone_number=phone_number,
                hashed_password=hash_password(password),
                is_active=True,
                is_company_owner=True,
                has_completed_onboarding=True,
            )
            self.user_repo.create(admin_user)

            self.db.commit()
            self.db.refresh(company)
            self.db.refresh(admin_user)

            return {
                "company": company,
                "admin_user": admin_user,
                "seeded_roles": seeded_roles,
                "seeded_departments": seeded_departments,
            }

        except HTTPException:
            self.db.rollback()
            raise
        except IntegrityError as e:
            self.db.rollback()
            print("SIGNUP INTEGRITY ERROR:", e)

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Signup failed because a unique field already exists. Check backend terminal logs.",
            )
        except Exception as e:
            self.db.rollback()
            print("SIGNUP UNEXPECTED ERROR:", repr(e))
            traceback.print_exc()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Company signup failed.",
            )
