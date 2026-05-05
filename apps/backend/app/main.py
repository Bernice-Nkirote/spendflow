from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import Base, engine
from app.routers import router as main_router

Base.metadata.create_all(bind=engine)

# Creates FASTAPI app for you
app = FastAPI(
    title=settings.PROJECT_NAME
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(main_router)

# You use app.get to enter the building
@app.get("/")
def read_root():
    return ("Created models for backend!")

