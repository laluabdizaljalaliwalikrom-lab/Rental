from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from api.dependencies import get_supabase, require_role
from supabase import Client
from datetime import datetime, timezone

router = APIRouter()

class CashbookEntryCreate(BaseModel):
    type: str
    amount: float
    description: str

class CashbookEntry(BaseModel):
    id: str
    type: str
    amount: float
    description: str
    reference_id: Optional[str] = None
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime

@router.get("/", response_model=List[CashbookEntry])
def get_cashbook(
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff", "viewer"]))
):
    try:
        res = db.table("cashbook").select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=CashbookEntry)
def create_entry(
    entry: CashbookEntryCreate,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff"]))
):
    if entry.type not in ('debit', 'credit'):
        raise HTTPException(status_code=400, detail="Tipe hanya boleh debit atau credit")
    
    data = entry.model_dump()
    data['created_by'] = user['id']
    data['created_by_name'] = user.get('full_name') or user.get('email') or 'Admin'
    data['created_at'] = datetime.now(timezone.utc).isoformat()
    
    try:
        res = db.table("cashbook").insert(data).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
def delete_entry(
    id: str,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    try:
        # 1. Ambil data kas dulu untuk mendapatkan reference_id (ID Rental)
        entry_res = db.table("cashbook").select("*").eq("id", id).execute()
        if not entry_res.data:
            raise HTTPException(status_code=404, detail="Data kas tidak ditemukan")
        
        entry = entry_res.data[0]
        reference_id = entry.get("reference_id")

        # 2. Jika ada reference_id, hapus data rental terkait
        if reference_id:
            # Cek data rental untuk update status sepeda
            rental_res = db.table("rentals").select("bike_id, status").eq("id", reference_id).execute()
            if rental_res.data:
                rental = rental_res.data[0]
                # Jika rental masih 'Active', kembalikan status sepeda ke 'Available'
                if rental.get("status") == "Active":
                    db.table("fleet").update({"status": "Available"}).eq("id", rental["bike_id"]).execute()
                
                # Hapus data rental
                db.table("rentals").delete().eq("id", reference_id).execute()

        # 3. Hapus entri kas itu sendiri
        db.table("cashbook").delete().eq("id", id).execute()
        
        return {"status": "success", "message": "Transaksi kas dan riwayat penyewaan terkait berhasil dihapus"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", response_model=CashbookEntry)
def update_entry(
    id: str,
    entry: CashbookEntryCreate,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    if entry.type not in ('debit', 'credit'):
        raise HTTPException(status_code=400, detail="Tipe hanya boleh debit atau credit")
        
    try:
        check_res = db.table("cashbook").select("id").eq("id", id).execute()
        if not check_res.data:
            raise HTTPException(status_code=404, detail="Data kas tidak ditemukan")
            
        update_data = entry.model_dump()
        res = db.table("cashbook").update(update_data).eq("id", id).execute()
        return res.data[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
