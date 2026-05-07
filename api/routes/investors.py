from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dependencies import get_supabase, require_role
from supabase import Client
from datetime import datetime

router = APIRouter()

class InvestorBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class InvestorCreate(InvestorBase):
    pass

class Investor(InvestorBase):
    id: str
    created_at: datetime

@router.get("/", response_model=List[Investor])
def get_investors(
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff", "viewer"]))
):
    try:
        res = db.table("investors").select("*").order("name").execute()
        return res.data
    except Exception as e:
        print(f"DEBUG ERROR (GET /investors): {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Investor)
def create_investor(
    investor: InvestorCreate,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    try:
        res = db.table("investors").insert(investor.model_dump()).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Gagal membuat data investor")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=Investor)
def update_investor(
    id: str,
    investor: InvestorBase,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    try:
        res = db.table("investors").update(investor.model_dump()).eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Investor tidak ditemukan")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
def delete_investor(
    id: str,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    try:
        # Cek apakah investor memiliki armada
        fleet_res = db.table("fleet").select("id").eq("investor_id", id).execute()
        if fleet_res.data:
            raise HTTPException(status_code=400, detail="Tidak dapat menghapus investor yang masih memiliki armada sepeda.")
        
        res = db.table("investors").delete().eq("id", id).execute()
        return {"status": "success", "message": "Investor berhasil dihapus"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}/fleet/")
def get_investor_fleet(
    id: str,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff", "viewer"]))
):
    try:
        res = db.table("fleet").select("*").eq("investor_id", id).execute()
        return res.data
    except Exception as e:
        print(f"DEBUG ERROR (GET investor fleet): {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
