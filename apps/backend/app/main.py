from fastapi import FastAPI
from app.core.config import settings
from app.core.database import Base, engine
from app.routers import pr

from app.models import company
from app.models import department
from app.models import user
from app.models import purchase_requisition
from app.models import purchase_requisition_item

# Creates FASTAPI app for you
app = FastAPI(
    title=settings.PROJECT_NAME
)
app.include_router(pr.router)

# You use app.get to enter the building
@app.get("/")
def read_root():
    return ("Created models for backend!")

