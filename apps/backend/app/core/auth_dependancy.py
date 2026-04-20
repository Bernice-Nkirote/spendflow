from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import ALGORITHM, SECRET_KEY
from app.models.suplier_user import SupplierUser
from app.models.user import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("sub")
        actor_type = payload.get("type")
        company_id = payload.get("company_id")

        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token.",
            )

        if actor_type != "USER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a user token.",
            )

        user = db.query(User).filter(User.id == UUID(user_id)).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )
        # check whether the company id in token and company id for user's company match or not.
        if company_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing company context.",
            )
        
        try:
            token_company_id = UUID(company_id)
        except ValueError:
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token company format.",
            )

        if user.company_id != token_company_id:
            raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token company context.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

        return user

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication.",
        )


def get_current_supplier(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        actor_id = payload.get("sub")
        actor_type = payload.get("type")

        if actor_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token.",
            )

        if actor_type != "SUPPLIER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a supplier token.",
            )

        supplier_user = db.query(SupplierUser).filter(
            SupplierUser.id == UUID(actor_id)
        ).first()

        if not supplier_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier user not found.",
            )

        if not supplier_user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Supplier account is inactive.",
            )

        return supplier_user

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication.",
        )