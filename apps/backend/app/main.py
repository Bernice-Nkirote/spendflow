from fastapi import FastAPI
from app.core.config import settings
from app.core.database import Base, engine
from app.routers import pr_router
from app.routers import supplier_router
from app.routers import company_router
from app.routers import auth_router
from app.routers import user_router
from app.routers import department_router
from app.routers import approval_workflow_router
from app.routers import workflow_level_router
from app.routers import workflow_role_router
from app.routers import approval_instance_router
from app.routers import approval_action_router

from app import models
Base.metadata.create_all(bind=engine)

# Creates FASTAPI app for you
app = FastAPI(
    title=settings.PROJECT_NAME
)

app.include_router(auth_router.router)
app.include_router(company_router.router)
app.include_router(user_router.router)
app.include_router(supplier_router.router)
app.include_router(pr_router.router)
app.include_router(department_router.router)
app.include_router(approval_workflow_router.router)
app.include_router(workflow_level_router.router)
app.include_router(workflow_role_router.router)
app.include_router(approval_instance_router.router)
app.include_router(approval_action_router.router)

# You use app.get to enter the building
@app.get("/")
def read_root():
    return ("Created models for backend!")

