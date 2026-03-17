from sqlalchemy.orm import Session
from uuid import UUID
from app.repositories.pr_repository import PRRepository

class PRService:
    def __init__(self, repo: PRRepository):
        self.repo = repo
    
    def create_pr(self, db:Session, pr_data, user_id: UUID, company_id: UUID):
        return self.repo.create(db, pr_data, user_id, company_id)
    
    def list_prs(self, db:Session, company_id: UUID):
        return self.repo.list_by_company(db, company_id)
    
    def get_pr(self, db: Session, pr_id:UUID, company_id: UUID):
        return self.repo.get_by_id(db, pr_id, company_id)