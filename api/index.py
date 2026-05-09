import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env file for local development
load_dotenv()

# Ensure the 'api' directory is in the system path for module discovery
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from routes import financial, fleet, rentals, profiles, cashbook, settings, investors, addons

app = FastAPI(title="Rental Sepeda API", version="1.0.0")

# CORS setup for production flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routers
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
app.include_router(financial.router, prefix="/api/financial", tags=["Financial"])
app.include_router(fleet.router, prefix="/api/fleet", tags=["Fleet"])
app.include_router(rentals.router, prefix="/api/rentals", tags=["Rentals"])
app.include_router(cashbook.router, prefix="/api/cashbook", tags=["Cashbook"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(investors.router, prefix="/api/investors", tags=["Investors"])
app.include_router(addons.router, prefix="/api/addons", tags=["Addons"])

@app.get("/api/health")
def health_check():
    """Health check endpoint to verify backend status."""
    return {"status": "online", "message": "Backend is fully functional"}
