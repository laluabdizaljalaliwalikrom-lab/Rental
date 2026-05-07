from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from api.dependencies import get_supabase, require_role
from supabase import Client

router = APIRouter()

class DividendRequest(BaseModel):
    net_profit: float
    asset_ratio: float

class DividendResponse(BaseModel):
    dividend: float
    status: str

@router.post("/calculate-dividend", response_model=DividendResponse)
def calculate_dividend(
    request: DividendRequest,
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin", "staff"]))
):
    if request.net_profit < 0:
        raise HTTPException(status_code=400, detail="Net profit cannot be negative for dividend calculation.")
    if not (0 <= request.asset_ratio <= 1):
        raise HTTPException(status_code=400, detail="Asset ratio must be between 0 and 1.")

    try:
        dividend = request.net_profit * request.asset_ratio
        return DividendResponse(dividend=dividend, status="success")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
