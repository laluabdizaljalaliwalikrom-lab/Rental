import requests
import json

url = "http://127.0.0.1:8000/api/fleet/879ad462-5089-48b2-94a1-25c6ceb997af"
data = {
    "name": "Polygon Xtrada 5",
    "brand": "Polygon",
    "type": "MTB",
    "price_per_hour": 5000.0,
    "price_per_day": 0.0,
    "status": "Available",
    "image_url": ""
}

print("Sending request to update bike...")
try:
    response = requests.put(url, json=data)
    print("Status Code:", response.status_code)
    print("Response JSON:", response.json())
except Exception as e:
    print("Request failed:", e)
