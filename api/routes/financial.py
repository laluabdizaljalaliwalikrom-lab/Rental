from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from api.dependencies import get_supabase
from supabase import Client

router = APIRouter()

class DividendRequest(BaseModel):
    net_profit: float
    asset_ratio: float

class DividendResponse(BaseModel):
    dividend: float
    status: str

@router.post("/calculate-dividend", response_model=DividendResponse)
def calculate_dividend(request: DividendRequest, db: Client = Depends(get_supabase)):
    """
    Menghitung dividen berdasarkan laba bersih dan rasio aset.
    Logika ini disimpan di backend untuk menjaga keamanan rumus dan validasi finansial.
    """
    if request.net_profit < 0:
        raise HTTPException(status_code=400, detail="Net profit cannot be negative for dividend calculation.")
    if not (0 <= request.asset_ratio <= 1):
        raise HTTPException(status_code=400, detail="Asset ratio must be between 0 and 1.")

    try:
        # Kalkulasi dividen
        dividend = request.net_profit * request.asset_ratio
        
        # Di sini kita bisa menambahkan logika untuk mencatat transaksi ke Supabase jika perlu
        # contoh: db.table("dividends").insert({"amount": dividend}).execute()

        return DividendResponse(dividend=dividend, status="success")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
