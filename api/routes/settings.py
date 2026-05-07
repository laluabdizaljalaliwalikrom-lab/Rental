from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from api.dependencies import get_supabase, require_role
from supabase import Client

router = APIRouter()

class SystemSettings(BaseModel):
    id: Optional[str] = "global"
    staff_salary_percentage: float = 10.0 # Default 10%
    maintenance_fee_percentage: float = 5.0 # Default 5%
    maintenance_fee_nominal: float = 0.0 # Jika ingin nominal tetap per transaksi

class LandingSettings(BaseModel):
    id: Optional[str] = "landing"
    hero_title_id: str = "Mendefinisikan Ulang Pergerakan Urban."
    hero_title_en: str = "Redefining Urban Motion."
    hero_desc_id: str = "Desain minimalis, performa maksimal. Armada premium kami dirancang untuk kecepatan, kenyamanan, dan efisiensi di setiap jalanan kota."
    hero_desc_en: str = "Minimalist design, maximum performance. Our premium fleet is engineered for speed, comfort, and efficiency in every city street."
    hero_image_url: str = "/premium_hero_bike_1778159126854.png"
    promo_text_id: str = "Mobilitas Premium"
    promo_text_en: str = "Premium Mobility"
    stats_perf: str = "99.9%"
    stats_sec: str = "Military"
    stats_ready: str = "24/7"
    stats_rating: str = "4.9/5"

# --- Global System Settings ---

@router.get("/", response_model=SystemSettings)
def get_settings(
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff", "viewer"]))
):
    try:
        res = db.table("settings").select("*").eq("id", "global").execute()
        if not res.data:
            return SystemSettings()
        return res.data[0]
    except Exception as e:
        return SystemSettings()

@router.post("/", response_model=SystemSettings)
def update_settings(
    settings: SystemSettings,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    try:
        data = settings.model_dump()
        data["id"] = "global"
        res = db.table("settings").upsert(data).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Landing Page Settings ---

@router.get("/landing", response_model=LandingSettings)
def get_landing_settings(
    db: Client = Depends(get_supabase)
):
    try:
        res = db.table("settings").select("*").eq("id", "landing").execute()
        if not res.data:
            return LandingSettings()
        return res.data[0]
    except Exception as e:
        return LandingSettings()

@router.post("/landing", response_model=LandingSettings)
def update_landing_settings(
    settings: LandingSettings,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    try:
        data = settings.model_dump()
        data["id"] = "landing"
        res = db.table("settings").upsert(data).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
