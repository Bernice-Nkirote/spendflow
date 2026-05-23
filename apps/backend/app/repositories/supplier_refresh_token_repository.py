from app.models.supplier_refresh_token import SupplierRefreshToken


class SupplierRefreshTokenRepository:
    def __init__(self, db):
        self.db = db

    def create(self, refresh_token: SupplierRefreshToken) -> SupplierRefreshToken:
        self.db.add(refresh_token)
        self.db.flush()
        self.db.refresh(refresh_token)
        return refresh_token

    def get_by_token_hash(self, token_hash: str) -> SupplierRefreshToken | None:
        return (
            self.db.query(SupplierRefreshToken)
            .filter(SupplierRefreshToken.token_hash == token_hash)
            .first()
        )

    def revoke(self, refresh_token: SupplierRefreshToken) -> SupplierRefreshToken:
        refresh_token.is_revoked = True
        self.db.flush()
        self.db.refresh(refresh_token)
        return refresh_token