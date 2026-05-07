import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY (service role) not found in .env")
    exit(1)

supabase = create_client(url, key)

email = input("Enter user email: ")
password = input("Enter user password: ")
full_name = input("Enter full name (optional): ")

print("\nSelect role:")
print("  1. admin   - Full access to all features")
print("  2. staff   - Can manage fleet and rentals")
print("  3. viewer  - Read-only access")
role_choice = input("Enter role number (1-3) [default: 3]: ").strip()

role_map = {"1": "admin", "2": "staff", "3": "viewer"}
role = role_map.get(role_choice, "viewer")

try:
    res = supabase.auth.admin.create_user({
        "email": email,
        "password": password,
        "email_confirm": True,
        "user_metadata": {
            "role": role,
            "full_name": full_name or "",
        }
    })
    print(f"\nUser created successfully!")
    print(f"  Email: {res.user.email}")
    print(f"  Role: {role}")
    print(f"\nNote: The profiles table trigger should have auto-created a profile entry.")
except Exception as e:
    print(f"Error creating user: {e}")
