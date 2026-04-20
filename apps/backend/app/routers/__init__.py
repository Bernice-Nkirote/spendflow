import os
import importlib
from fastapi import APIRouter

router = APIRouter()

current_dir = os.path.dirname(__file__)

for file in os.listdir(current_dir):
    print("FOUND FILE:", file)

    if file.endswith("_router.py"):
        module_name = f"app.routers.{file[:-3]}"
        
        module = importlib.import_module(module_name)

        if hasattr(module, "router"):
            router.include_router(module.router)
          