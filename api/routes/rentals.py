from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from api.dependencies import get_supabase
from supabase import Client
from datetime import datetime
import traceback

router = APIRouter()

class RentalCreate(BaseModel):
    bike_id: str
    customer_name: str
    rental_type: str # 'Short' or 'Long'
    duration: int # hours for short, days for long
    total_price: float

class Rental(BaseModel):
    id: str
    bike_id: str
    customer_name: str
    rental_type: str
    duration: int
    total_price: float
    status: str # 'Active', 'Completed'
    start_time: datetime
    end_time: Optional[datetime] = None

@router.get("/", response_model=List[Rental])
def get_rentals(db: Client = Depends(get_supabase)):
    try:
        res = db.table("rentals").select("*").order("start_time", desc=True).execute()
        return res.data
    except Exception as e:
        print("Error in get_rentals:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Rental)
def create_rental(rental: RentalCreate, db: Client = Depends(get_supabase)):
    try:
        # 1. Start transaction (implicitly by doing multiple operations)
        # Check if bike is available
        bike_res = db.table("fleet").select("status").eq("id", rental.bike_id).execute()
        if not bike_res.data or bike_res.data[0]['status'] != 'Available':
            raise HTTPException(status_code=400, detail="Sepeda tidak tersedia")

        # 2. Create rental record
        rental_data = rental.model_dump()
        rental_data['status'] = 'Active'
        rental_data['start_time'] = datetime.now().isoformat()
        
        res = db.table("rentals").insert(rental_data).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Gagal membuat data rental")

        # 3. Update bike status
        db.table("fleet").update({"status": "Rented"}).eq("id", rental.bike_id).execute()

        return res.data[0]
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_rental_stats(db: Client = Depends(get_supabase)):
    try:
        # Get all rentals for revenue calculation
        res = db.table("rentals").select("total_price, status").execute()
        rentals = res.data
        
        total_revenue = sum(r.get('total_price') or 0 for r in rentals)
        active_rentals = sum(1 for r in rentals if r.get('status') == 'Active')
        total_count = len(rentals)
        
        # Get fleet stats for availability
        fleet_res = db.table("fleet").select("status").execute()
        fleet = fleet_res.data
        available_bikes = sum(1 for b in fleet if b['status'] == 'Available')
        total_bikes = len(fleet)
        
        return {
            "total_revenue": total_revenue,
            "active_rentals": active_rentals,
            "total_rentals": total_count,
            "available_bikes": available_bikes,
            "total_bikes": total_bikes
        }
    except Exception as e:
        print("Error in get_rental_stats:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/complete")
def complete_rental(id: str, db: Client = Depends(get_supabase)):
    try:
        # 1. Get rental info
        rental_res = db.table("rentals").select("bike_id, status").eq("id", id).execute()
        if not rental_res.data or rental_res.data[0]['status'] != 'Active':
            raise HTTPException(status_code=400, detail="Rental tidak aktif atau tidak ditemukan")
        
        bike_id = rental_res.data[0]['bike_id']

        # 2. Mark rental as completed
        db.table("rentals").update({
            "status": "Completed",
            "end_time": datetime.now().isoformat()
        }).eq("id", id).execute()

        # 3. Mark bike as available
        db.table("fleet").update({"status": "Available"}).eq("id", bike_id).execute()

        return {"status": "success", "message": "Rental selesai"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
