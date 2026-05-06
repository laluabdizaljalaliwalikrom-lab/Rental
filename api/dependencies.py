import os
from supabase import create_client, Client
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

# Gunakan dependency injection atau inisialisasi lazy untuk serverless
# Supabase client instantiation
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    # Jangan raise error di root level agar build vercel tidak gagal jika env belum diset,
    # Namun pastikan setiap request akan gagal dengan 500
    supabase: Client = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase() -> Client:
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured in environment.")
    return supabase
