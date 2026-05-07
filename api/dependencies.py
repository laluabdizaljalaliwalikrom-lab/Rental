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

import queue

# Enterprise-grade Connection Pool
POOL_SIZE = 10
_client_pool = queue.Queue()

# Lazy initialization of pool
_pool_initialized = False

def _init_pool():
    global _pool_initialized
    if _pool_initialized:
        return
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print(f"CRITICAL: SUPABASE_URL or SUPABASE_KEY missing!")
        return

    print(f"Initializing Supabase connection pool (Size: {POOL_SIZE})...")
    for _ in range(POOL_SIZE):
        try:
            _client_pool.put(create_client(url, key))
        except Exception as e:
            print(f"Error creating Supabase client: {e}")
    
    _pool_initialized = True

def get_supabase() -> Client:
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_KEY"):
        raise HTTPException(
            status_code=500, 
            detail="Konfigurasi backend tidak lengkap (SUPABASE_URL/KEY hilang)."
        )
    
    _init_pool()
    try:
        # Pinjam koneksi dari pool
        client = _client_pool.get(timeout=5)
        # print(f"DEBUG: Connection taken from pool. Remaining: {_client_pool.qsize()}")
        try:
            yield client
        finally:
            # Wajib kembalikan koneksi ke pool!
            _client_pool.put(client)
            # print(f"DEBUG: Connection returned to pool. Available: {_client_pool.qsize()}")
    except queue.Empty:
        print("ALERT: Connection pool exhausted!")
        raise HTTPException(status_code=503, detail="Database busy. Please try again in a few seconds.")
    except Exception as e:
        print(f"Error in get_supabase: {e}")
        raise HTTPException(status_code=500, detail=str(e))



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


