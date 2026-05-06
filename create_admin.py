import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY") # service_role key

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY (service role) not found in .env")
    exit(1)

supabase = create_client(url, key)

email = input("Enter admin email: ")
password = input("Enter admin password: ")

try:
    # Use admin API to create user without confirmation
    res = supabase.auth.admin.create_user({
        "email": email,
        "password": password,
        "email_confirm": True
    })
    print(f"User created successfully: {res.user.email}")
except Exception as e:
    print(f"Error creating user: {e}")
