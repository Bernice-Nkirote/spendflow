from app.core.database import get_db
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.suplier_user import SupplierUser


from app.core.security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# GET CURRENT USER 
def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_db)):


    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(status_code=401, detail="invalid token")

        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="invalid authentication")


    # GET CURRENT SUPPLIER TO UPLOAD INVOICE
def get_current_supplier(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        actor_id = payload.get("sub")
        actor_type = payload.get("type")

        if actor_type != "SUPPLIER":
            raise HTTPException(status_code=403, detail="Not a supplier")

        supplier_user = db.query(SupplierUser).filter(
            SupplierUser.id == actor_id
        ).first()

        if not supplier_user:
            raise HTTPException(status_code=404, detail="Supplier user not found")

        return supplier_user

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")
