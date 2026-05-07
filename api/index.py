import os
import sys

# Jalur pencarian harus disetel sebelum impor modul lain
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import financial, fleet, rentals, profiles, cashbook, settings, investors

app = FastAPI(title="Rental Sepeda API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
app.include_router(financial.router, prefix="/api/financial", tags=["Financial"])
app.include_router(fleet.router, prefix="/api/fleet", tags=["Fleet"])
app.include_router(rentals.router, prefix="/api/rentals", tags=["Rentals"])
app.include_router(cashbook.router, prefix="/api/cashbook", tags=["Cashbook"])
app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
app.include_router(investors.router, prefix="/api/investors", tags=["Investors"])

@app.get("/api/health")
def health():
    return {"status": "ok", "python": sys.version}
