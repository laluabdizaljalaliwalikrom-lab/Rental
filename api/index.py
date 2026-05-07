import os
import sys

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
        "status": "minimalist_ok",
        "python": sys.version,
        "path": sys.path
    }

# Kita matikan sementara semua router untuk mencari penyebab crash
# try:
#     import financial, fleet, rentals, profiles, cashbook, settings, investors
#     app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
#     app.include_router(financial.router, prefix="/api/financial", tags=["Financial"])
#     app.include_router(fleet.router, prefix="/api/fleet", tags=["Fleet"])
#     app.include_router(rentals.router, prefix="/api/rentals", tags=["Rentals"])
#     app.include_router(cashbook.router, prefix="/api/cashbook", tags=["Cashbook"])
#     app.include_router(settings.router, prefix="/api/settings", tags=["Settings"])
#     app.include_router(investors.router, prefix="/api/investors", tags=["Investors"])
# except Exception as e:
#     @app.get("/api/error")
#     def error():
#         return {"error": str(e)}
