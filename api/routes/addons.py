from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dependencies import get_supabase, require_role
from supabase import Client
from datetime import datetime

router = APIRouter()

class AddonBase(BaseModel):
    name: str
    price: float
    description: Optional[str] = None
    is_active: bool = True

class AddonCreate(AddonBase):
    pass

class Addon(AddonBase):
    id: str
    created_at: datetime

@router.get("/", response_model=List[Addon])
def get_addons(
    db: Client = Depends(get_supabase)
):
    try:
        res = db.table("addons").select("*").order("name").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Addon)
def create_addon(
    addon: AddonCreate,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    try:
        res = db.table("addons").insert(addon.model_dump()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create addon")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=Addon)
def update_addon(
    id: str,
    addon: AddonBase,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    try:
        res = db.table("addons").update(addon.model_dump()).eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Addon not found")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
def delete_addon(
    id: str,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    try:
        res = db.table("addons").delete().eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Addon not found")
        return {"status": "success", "message": "Addon deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
