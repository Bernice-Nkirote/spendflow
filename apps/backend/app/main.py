from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import Base, engine
from app.routers import router as main_router
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.core.scheduler import start_scheduler


Base.metadata.create_all(bind=engine)

# Create scheduler instance
scheduler = AsyncIOScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    scheduler.start()
    app.state.scheduler = scheduler
    print("Scheduler started")
    yield
    # SHUTDOWN
    scheduler.shutdown(wait=False)
    print("Scheduler stopped")

# Creates FASTAPI app for you
app = FastAPI(
    title=settings.PROJECT_NAME, lifespan=lifespan
)

app.include_router(main_router)

# You use app.get to enter the building
@app.get("/")
def read_root():
    return ("Created models for backend!")

