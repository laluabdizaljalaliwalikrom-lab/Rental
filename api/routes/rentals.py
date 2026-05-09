from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from pydantic import BaseModel
from typing import List, Optional
from dependencies import get_supabase, require_role
from supabase import Client
from datetime import datetime, timezone
import traceback
import uuid

router = APIRouter()

class RentalCreate(BaseModel):
    bike_id: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    identity_type: Optional[str] = None
    identity_number: Optional[str] = None
    identity_image_url: Optional[str] = None
    rental_type: str
    duration: int
    total_price: Optional[float] = None

class Rental(BaseModel):
    id: str
    bike_id: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    identity_type: Optional[str] = None
    identity_number: Optional[str] = None
    identity_image_url: Optional[str] = None
    rental_type: str
    duration: int
    total_price: float
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    processed_by_name: Optional[str] = None

@router.get("/", response_model=List[Rental])
def get_rentals(
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff", "viewer"]))
):
    try:
        res = db.table("rentals").select("*").order("start_time", desc=True).execute()
        return res.data
    except Exception as e:
        print("Error in get_rentals:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-identity")
async def upload_identity(
    file: UploadFile = File(...),
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff"]))
):
    try:
        file_ext = file.filename.split('.')[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        content = await file.read()
        res = db.storage.from_("identities").upload(file_name, content, {"content-type": file.content_type})
        url = db.storage.from_("identities").get_public_url(file_name)
        return {"url": url}
    except Exception as e:
        print("Upload Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Rental)
async def create_rental(
    request: Request,
    rental: RentalCreate,
    db: Client = Depends(get_supabase)
):
    # Diizinkan publik untuk mendukung online booking dari landing page
    try:
        # Coba ambil user dari token jika ada (opsional)
        current_user = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                user_res = db.auth.get_user(token)
                if user_res.user:
                    # Ambil profile untuk mendapatkan nama
                    profile = db.table("profiles").select("*").eq("id", user_res.user.id).execute()
                    current_user = profile.data[0] if profile.data else {"id": user_res.user.id, "full_name": user_res.user.email}
            except:
                pass

        bike_res = db.table("fleet").select("status, price_per_hour, price_per_day, name").eq("id", rental.bike_id).execute()
        if not bike_res.data or bike_res.data[0]['status'] != 'Available':
            raise HTTPException(status_code=400, detail="Sepeda tidak tersedia")
        
        bike_info = bike_res.data[0]
        
        # Aturan: Short-term maksimal 3 jam, lebih dari itu otomatis Daily
        effective_rental_type = rental.rental_type
        effective_duration = rental.duration
        
        if effective_rental_type == 'Short' and effective_duration > 3:
            effective_rental_type = 'Long'
            # Jika lebih dari 3 jam, dianggap 1 hari (atau sesuai logika bisnis Anda)
            # Untuk simplifikasi, kita jadikan 1 hari
            effective_duration = 1 
            print(f"Rental switched to Long due to duration {rental.duration}h")

        # Hitung total_price
        if effective_rental_type == 'Short':
            total_price = bike_info['price_per_hour'] * effective_duration
        else:
            total_price = bike_info['price_per_day'] * effective_duration

        rental_data = rental.model_dump()
        rental_data['rental_type'] = effective_rental_type
        rental_data['duration'] = effective_duration
        rental_data['total_price'] = total_price
        rental_data['status'] = 'Active'
        rental_data['start_time'] = datetime.now(timezone.utc).isoformat()
        rental_data['processed_by_name'] = current_user['full_name'] if current_user else 'Online Booking'
        
        res = db.table("rentals").insert(rental_data).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Gagal membuat data rental")

        rental_record = res.data[0]
        
        # Ambil detail armada untuk deskripsi kas
        bike_name = bike_info.get('name', 'Sepeda')

        db.table("fleet").update({"status": "Rented"}).eq("id", rental.bike_id).execute()

        # Otomatis catat ke kas masuk (debit)
        try:
            cashbook_entry = {
                "type": "debit",
                "amount": rental.total_price,
                "description": f"Sewa: {bike_name} - {rental.customer_name} ({'Admin' if current_user else 'Online'})",
                "reference_id": rental_record['id'],
                "created_by": current_user['id'] if current_user else None,
                "created_by_name": current_user.get('full_name') if current_user else 'Online Booking',
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            db.table("cashbook").insert(cashbook_entry).execute()
        except Exception as e:
            print("Gagal mencatat kas:", e)
            traceback.print_exc()

        return rental_record
    except HTTPException as he:
        raise he
    except Exception as e:
        print("Rental Create Error:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_rental_stats(
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff", "viewer"]))
):
    try:
        res = db.table("rentals").select("total_price, status").execute()
        rentals = res.data
        
        total_revenue = sum(r.get('total_price') or 0 for r in rentals)
        active_rentals = sum(1 for r in rentals if r.get('status') == 'Active')
        total_count = len(rentals)
        
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
def complete_rental(
    id: str,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff"]))
):
    try:
        rental_res = db.table("rentals").select("bike_id, status").eq("id", id).execute()
        if not rental_res.data or rental_res.data[0]['status'] != 'Active':
            raise HTTPException(status_code=400, detail="Rental tidak aktif atau tidak ditemukan")
        
        bike_id = rental_res.data[0]['bike_id']

        db.table("rentals").update({
            "status": "Completed",
            "end_time": datetime.now(timezone.utc).isoformat()
        }).eq("id", id).execute()

        db.table("fleet").update({"status": "Available"}).eq("id", bike_id).execute()

        return {"status": "success", "message": "Rental selesai"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
def delete_rental(
    id: str,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    try:
        rental_res = db.table("rentals").select("bike_id, status").eq("id", id).execute()
        if not rental_res.data:
            raise HTTPException(status_code=404, detail="Rental tidak ditemukan")
        
        rental_data = rental_res.data[0]
        
        res = db.table("rentals").delete().eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Gagal menghapus data rental")
            
        if rental_data['status'] == 'Active':
            db.table("fleet").update({"status": "Available"}).eq("id", rental_data['bike_id']).execute()
            
        # Clean up linked cashbook entry
        db.table("cashbook").delete().eq("reference_id", id).execute()
        
        return {"status": "success", "message": "Rental berhasil dihapus"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
