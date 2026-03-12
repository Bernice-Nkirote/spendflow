import os
import importlib

package_dir = os.path.dirname(__file__)

for file in os.listdir(package_dir):
    if file.endswith(".py") and file != "__init__.py":
        module_name = file[:-3]
        importlib.import_module(f"app.models.{module_name}")