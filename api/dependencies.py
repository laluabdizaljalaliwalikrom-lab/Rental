import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv, find_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# Load .env from root
load_dotenv(find_dotenv())

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

security = HTTPBearer()

_supabase_client: Optional[Client] = None

def get_supabase() -> Client:
    global _supabase_client
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise HTTPException(
            status_code=500, 
            detail="Konfigurasi backend tidak lengkap (SUPABASE_URL/KEY hilang)."
        )
    
    if _supabase_client is None:
        try:
            _supabase_client = create_client(url, key)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gagal menghubungkan ke database: {str(e)}")
            
    return _supabase_client



import time

# Simple in-memory cache to avoid hitting Supabase Auth API on every request
# Token -> (UserDict, Timestamp)
TOKEN_CACHE = {}
CACHE_TTL = 300  # Cache tokens for 5 minutes

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_supabase)
) -> dict:
    token = credentials.credentials
    now = time.time()

    # Check cache first
    if token in TOKEN_CACHE:
        cached_user, timestamp = TOKEN_CACHE[token]
        if now - timestamp < CACHE_TTL:
            return cached_user

    try:
        user_res = db.auth.get_user(token)
        user_id = user_res.user.id
        user_email = user_res.user.email
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    profile_res = db.table("profiles").select("*").eq("id", user_id).execute()

    if not profile_res.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User profile not found. Please contact administrator."
        )

    profile = profile_res.data[0]
    user_data = {
        "id": user_id,
        "email": profile.get("email", user_email),
        "role": profile.get("role", "viewer"),
        "full_name": profile.get("full_name"),
    }

    # Save to cache
    TOKEN_CACHE[token] = (user_data, now)
    return user_data

def require_role(allowed_roles: list[str]):
    async def checker(user: dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Anda tidak memiliki izin untuk mengakses fitur ini."
            )
        return user
    return checker

def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Client = Depends(get_supabase)
) -> Optional[dict]:
    if not credentials:
        return None
    try:
        token = credentials.credentials
        now = time.time()

        if token in TOKEN_CACHE:
            cached_user, timestamp = TOKEN_CACHE[token]
            if now - timestamp < CACHE_TTL:
                return cached_user
        user_res = db.auth.get_user(token)
        user_id = user_res.user.id
        user_email = user_res.user.email

        profile_res = db.table("profiles").select("*").eq("id", user_id).execute()
        if not profile_res.data:
            return None

        profile = profile_res.data[0]
        user_data = {
            "id": user_id,
            "email": profile.get("email", user_email),
            "role": profile.get("role", "viewer"),
            "full_name": profile.get("full_name"),
        }
        
        TOKEN_CACHE[token] = (user_data, now)
        return user_data
    except Exception:
        return None


