from uuid import UUID

from fastapi import Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import ALGORITHM, SECRET_KEY
from app.models.company import Company
from app.models.role import Role
from app.models.supplier_user import SupplierUser
from app.models.user import User
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials



bearer_scheme = HTTPBearer()

# =========================
# USER AUTH
# =========================
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        actor_id = payload.get("sub")
        actor_type = payload.get("type")
        company_id = payload.get("company_id")

        if actor_id is None or actor_type != "USER" or company_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials.",
            )

        user = db.query(User).filter(User.id == UUID(actor_id)).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials.",
            )

        if user.company_id != UUID(company_id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials.",
            )

        company = db.query(Company).filter(Company.id == user.company_id).first()

        if not company or not company.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Company is inactive.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

        return user

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
        )


# =========================
# ADMIN AUTH
# =========================
def get_current_admin_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    role = db.query(Role).filter(
        Role.id == current_user.role_id,
        Role.company_id == current_user.company_id,
    ).first()

    if not role or not role.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User role invalid or inactive.",
        )

    if role.name.strip().lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    return current_user


# =========================
# SUPPLIER AUTH
# =========================
def get_current_supplier(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> SupplierUser:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        actor_id = payload.get("sub")
        actor_type = payload.get("type")
        supplier_id = payload.get("supplier_id")

        if actor_id is None or actor_type != "SUPPLIER" or supplier_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials.",
            )

        supplier_user = db.query(SupplierUser).filter(
            SupplierUser.id == UUID(actor_id)
        ).first()

        if not supplier_user or supplier_user.supplier_id != UUID(supplier_id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials.",
            )

        if not supplier_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supplier account is inactive.",
            )

        return supplier_user

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials.",
        )