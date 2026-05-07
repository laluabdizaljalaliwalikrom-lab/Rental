import os
import sys
import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize app first so it's always available to Vercel
app = FastAPI(title="Rental Sepeda API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

@app.get("/api/debug")
def debug_env():
    return {
        "supabase_url_exists": os.getenv("SUPABASE_URL") is not None,
        "supabase_key_exists": os.getenv("SUPABASE_KEY") is not None,
        "python_version": sys.version,
        "current_dir": current_dir,
        "sys_path": sys.path
    }

try:
    from routes import financial, fleet, rentals, profiles, cashbook, settings, investors
    
    app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
    app.include_router(financial.router, prefix="/api/financial", tags=["Financial"])
    app.include_router(fleet.router, prefix="/api/fleet", tags=["Fleet"])
    app.include_router(rentals.router, prefix="/api/rentals", tags=["Rentals"])
    app.include_router(cashbook.router, prefix="/api/cashbook", tags=["Cashbook"])
    app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
    app.include_router(investors.router, prefix="/api/investors", tags=["Investors"])
    
except Exception as e:
    @app.get("/api/error")
    def get_error():
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }
