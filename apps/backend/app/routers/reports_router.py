from fastapi import APIRouter
from app.routers.reports.report_router import router as report_router

router = APIRouter()
router.include_router(report_router)

# Bridge file to allow report router to automatically be included in main.py