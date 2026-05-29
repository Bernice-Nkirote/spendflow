from fastapi import HTTPException, status
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class PasswordService:
    def _validate_password(self, password: str) -> str:
        normalized_password = password.strip()

        if len(normalized_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long.",
            )

        if len(normalized_password.encode("utf-8")) > 72:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password cannot be longer than 72 bytes.",
            )

        return normalized_password

    def hash_password(self, password: str) -> str:
        normalized_password = self._validate_password(password)
        return pwd_context.hash(normalized_password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        normalized_password = plain_password.strip()

        if len(normalized_password.encode("utf-8")) > 72:
            return False

        return pwd_context.verify(normalized_password, hashed_password)