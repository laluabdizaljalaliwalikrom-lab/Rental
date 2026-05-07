from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import financial, fleet, rentals, profiles, cashbook, settings, investors

app = FastAPI(title="Rental Sepeda API", description="Backend API untuk Rental Sepeda", version="1.0.0")

# Setup CORS (Sesuaikan dengan domain frontend di production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Harap diperketat di production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Router
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
app.include_router(financial.router, prefix="/api/financial", tags=["Financial"])
app.include_router(fleet.router, prefix="/api/fleet", tags=["Fleet"])
app.include_router(rentals.router, prefix="/api/rentals", tags=["Rentals"])
app.include_router(cashbook.router, prefix="/api/cashbook", tags=["Cashbook"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(investors.router, prefix="/api/investors", tags=["Investors"])

@app.get("/api/debug")
def debug_env():
    import os
    return {
        "supabase_url_exists": os.getenv("SUPABASE_URL") is not None,
        "supabase_key_exists": os.getenv("SUPABASE_KEY") is not None,
        "python_version": os.sys.version
    }

# Entrypoint for Vercel (optional, vercel will automatically find `app` in index.py)
