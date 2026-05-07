import os
import sys
import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Tambahkan folder 'api' ke sys.path secara paksa
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Rental Sepeda API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {
        "status": "online",
        "python": sys.version,
        "modules_status": modules_status
    }

modules_status = {}

def safe_import_router(module_name, router_obj_name, prefix, tags):
    try:
        # Import dynamic
        mod = __import__(f"routes.{module_name}", fromlist=[router_obj_name])
        router = getattr(mod, router_obj_name)
        app.include_router(router, prefix=prefix, tags=tags)
        modules_status[module_name] = "OK"
    except Exception as e:
        modules_status[module_name] = f"ERROR: {str(e)}"
        print(f"FAILED TO LOAD {module_name}: {traceback.format_exc()}")

# Coba muat semua router satu per satu
safe_import_router("profiles", "router", "/api/profiles", ["Profiles"])
safe_import_router("financial", "router", "/api/financial", ["Financial"])
safe_import_router("fleet", "router", "/api/fleet", ["Fleet"])
safe_import_router("rentals", "router", "/api/rentals", ["Rentals"])
safe_import_router("cashbook", "router", "/api/cashbook", ["Cashbook"])
safe_import_router("settings", "router", "/api/settings", ["Settings"])
safe_import_router("investors", "router", "/api/investors", ["Investors"])

@app.get("/api/error-details")
def get_error_details():
    return modules_status
