from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import financial

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
app.include_router(financial.router, prefix="/api/financial", tags=["Financial"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "API is running"}

# Entrypoint for Vercel (optional, vercel will automatically find `app` in index.py)
