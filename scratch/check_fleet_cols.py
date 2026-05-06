import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

supabase = create_client(url, key)

print("Checking 'fleet' table columns...")
try:
    res = supabase.table("fleet").select("*").limit(1).execute()
    if res.data:
        print("Columns found in first row:")
        print(res.data[0].keys())
    else:
        print("No data in 'fleet' table to check columns.")
except Exception as e:
    print("Error:", e)
