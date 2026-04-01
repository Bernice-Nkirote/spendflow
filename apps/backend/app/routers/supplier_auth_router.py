from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.suplier_user import SupplierUser
from app.core.security import verify_password, create_access_token
from app.schemas.supplier_auth_schema import SupplierLogin
router = APIRouter(prefix="/supplier-auth", tags=["Supplier Auth"])


@router.post("/login")
def supplier_login(
    data: SupplierLogin,
    db: Session = Depends(get_db)):

    supplier_user = db.query(SupplierUser).filter(
        SupplierUser.email == data.email
    ).first()

    if not supplier_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, supplier_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(
        data={
            "sub": str(supplier_user.id),
            "type": "SUPPLIER"  
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }