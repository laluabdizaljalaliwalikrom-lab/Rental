import os
from supabase._async.client import AsyncClient, create_client as create_async_client
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Async Supabase client (created per-request to avoid Windows WinError 10035)
async def get_supabase() -> AsyncClient:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured in environment.")
    client = await create_async_client(SUPABASE_URL, SUPABASE_KEY)
    return client
