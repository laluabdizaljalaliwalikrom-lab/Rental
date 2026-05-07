from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dependencies import get_supabase, require_role
from supabase import Client
from datetime import datetime

router = APIRouter()

class FleetBase(BaseModel):
    name: str
    brand: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = "Available"
    price_per_hour: float = 0.0
    price_per_day: float = 0.0
    image_url: Optional[str] = None
    investor_name: Optional[str] = "Pusat"
    investor_id: Optional[str] = None

class FleetCreate(FleetBase):
    pass

class FleetUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    price_per_hour: Optional[float] = None
    price_per_day: Optional[float] = None
    image_url: Optional[str] = None
    investor_name: Optional[str] = None
    investor_id: Optional[str] = None

class Fleet(FleetBase):
    id: str
    created_at: datetime

@router.get("/", response_model=List[Fleet])
def get_fleet(
    db: Client = Depends(get_supabase)
):
    try:
        # Sekarang publik bisa melihat daftar armada (untuk landing page)
        res = db.table("fleet").select("*").order("name").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Fleet)
def create_bike(
    bike: FleetCreate,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff"]))
):
    try:
        res = db.table("fleet").insert(bike.model_dump()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create bike")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=Fleet)
def update_bike(
    id: str,
    bike: FleetUpdate,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff"]))
):
    try:
        # Ambil data dari model, sertakan investor_id dan investor_name meskipun None
        full_data = bike.model_dump()
        update_data = {k: v for k, v in full_data.items() if v is not None}
        
        # Secara eksplisit masukkan investor_id dan investor_name jika ada dalam request (bisa None)
        if 'investor_id' in full_data:
            update_data['investor_id'] = full_data['investor_id']
        if 'investor_name' in full_data:
            update_data['investor_name'] = full_data['investor_name']

        res = db.table("fleet").update(update_data).eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Bike not found")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
def delete_bike(
    id: str,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    try:
        res = db.table("fleet").delete().eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Bike not found")
        return {"status": "success", "message": "Bike deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
