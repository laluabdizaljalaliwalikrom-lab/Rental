import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    exit(1)

supabase = create_client(url, key)

print("Testing connection to 'rentals' table...")
try:
    res = supabase.table("rentals").select("*").execute()
    print("Success! Data count:", len(res.data))
except Exception as e:
    print("FAILED to select from 'rentals':")
    print(e)

print("\nTesting connection to 'fleet' table...")
try:
    res = supabase.table("fleet").select("*").execute()
    print("Success! Data count:", len(res.data))
except Exception as e:
    print("FAILED to select from 'fleet':")
    print(e)
