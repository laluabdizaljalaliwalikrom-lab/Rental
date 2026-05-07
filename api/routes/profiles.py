from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from dependencies import get_supabase, require_role
from supabase import Client
from datetime import datetime

router = APIRouter()

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    email: Optional[str] = None

class ProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff", "viewer"]))
):
    res = db.table("profiles").select("*").eq("id", user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data[0]

@router.put("/me", response_model=ProfileResponse)
def update_my_profile(
    profile: ProfileUpdate,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff", "viewer"]))
):
    update_data = profile.model_dump(exclude_unset=True)
    if "role" in update_data:
        raise HTTPException(status_code=403, detail="Cannot change your own role. Contact admin.")
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    res = db.table("profiles").update(update_data).eq("id", user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data[0]

@router.get("/", response_model=List[ProfileResponse])
def get_all_profiles(
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    res = db.table("profiles").select("*").order("created_at", desc=True).execute()
    return res.data

@router.put("/{user_id}", response_model=ProfileResponse)
def update_user_profile(
    user_id: str,
    profile: ProfileUpdate,
    db: Client = Depends(get_supabase),
    admin: dict = Depends(require_role(["admin"]))
):
    update_data = profile.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    if "role" in update_data and update_data["role"] not in ("admin", "staff", "viewer"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be admin, staff, or viewer.")

    res = db.table("profiles").update(update_data).eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return res.data[0]

class ProfileCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str

@router.post("/", response_model=ProfileResponse)
def create_user_profile(
    profile: ProfileCreate,
    db: Client = Depends(get_supabase),
    admin: dict = Depends(require_role(["admin"]))
):
    if profile.role not in ("admin", "staff", "viewer"):
        raise HTTPException(status_code=400, detail="Invalid role. Must be admin, staff, or viewer.")
    
    try:
        user_response = db.auth.admin.create_user({
            "email": profile.email,
            "password": profile.password,
            "email_confirm": True
        })
        new_user_id = user_response.user.id
        
        # Insert or update profile (Supabase trigger might have already created it if present, so we use upsert)
        profile_data = {
            "id": new_user_id,
            "email": profile.email,
            "full_name": profile.full_name,
            "role": profile.role,
            "created_at": datetime.now().isoformat()
        }
        res = db.table("profiles").upsert(profile_data).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membuat user: {str(e)}")

@router.delete("/{user_id}")
def delete_user_profile(
    user_id: str,
    db: Client = Depends(get_supabase),
    admin: dict = Depends(require_role(["admin"]))
):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Anda tidak dapat menghapus akun Anda sendiri!")
    try:
        # Hapus auth user, table profiles akan terhapus jika ada cascade. Kita hapus manual juga untuk aman.
        db.auth.admin.delete_user(user_id)
        db.table("profiles").delete().eq("id", user_id).execute()
        return {"status": "success", "message": "User deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal menghapus user: {str(e)}")
