import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

supabase = create_client(url, key)

print("Checking 'fleet' table structure...")
try:
    res = supabase.table("fleet").select("*").limit(1).execute()
    if res.data:
        print(f"Sample row: {res.data[0]}")
    else:
        print("Fleet table is empty")
except Exception as e:
    print(f"Error accessing fleet: {e}")
