from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password


class PasswordService:
    def _validate_password(self, password: str) -> str:
        normalized_password = password.strip()

        if len(normalized_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long.",
            )

        return normalized_password

    def hash_password(self, password: str) -> str:
        normalized_password = self._validate_password(password)
        return hash_password(normalized_password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        normalized_password = plain_password.strip()

        if not normalized_password:
            return False

        return verify_password(normalized_password, hashed_password)