class UserRoleRepository:

    def get_roles_by_user(self, db: Session, user_id):
        return db.query(UserRole).filter(
            UserRole.user_id == user_id
        ).all()