from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from dependencies import get_supabase, require_role
from supabase import Client
from typing import List, Optional
from datetime import datetime, timedelta, timezone

router = APIRouter()

class FinancialSummary(BaseModel):
    total_income: float
    total_expense: float
    net_profit: float
    cash_on_hand: float
    total_staff_salary: float
    total_maintenance_fee: float
    total_investor_dividend: float
    total_addon_revenue: float

class InvestorSplit(BaseModel):
    name: str
    revenue: float
    maintenance: float
    net_bike_profit: float
    staff_salary: float
    dividend: float
    addon_revenue: float

class DailyTrend(BaseModel):
    date: str
    income: float
    expense: float

class FinancialReport(BaseModel):
    summary: FinancialSummary
    trends: List[DailyTrend]
    investor_splits: List[InvestorSplit]
    top_revenue_sources: List[dict]

@router.get("/report", response_model=FinancialReport)
def get_financial_report(
    period: str = Query("monthly", regex="^(daily|weekly|monthly|yearly)$"),
    db: Client = Depends(get_supabase),
    user: dict = Depends(require_role(["admin"]))
):
    try:
        # 0. Ambil Pengaturan Global
        set_res = db.table("settings").select("*").eq("id", "global").execute()
        settings = set_res.data[0] if set_res.data else {"staff_salary_percentage": 10, "maintenance_fee_percentage": 5, "maintenance_fee_nominal": 0}
        
        staff_pct = settings.get("staff_salary_percentage", 10) / 100
        maint_pct = settings.get("maintenance_fee_percentage", 5) / 100
        maint_nom = settings.get("maintenance_fee_nominal", 0)

        # Tentukan rentang waktu berdasarkan periode
        now = datetime.now(timezone.utc)
        if period == "daily":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == "weekly":
            start_date = now - timedelta(days=7)
        elif period == "monthly":
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else: # yearly
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

        # 1. Hitung Saldo Kas Riil
        all_res = db.table("cashbook").select("type, amount").execute()
        total_debit = sum(e['amount'] for e in all_res.data if e['type'] == 'debit')
        total_credit = sum(e['amount'] for e in all_res.data if e['type'] == 'credit')
        cash_on_hand = total_debit - total_credit

        # 2. Ambil data kas periode ini
        period_res = db.table("cashbook").select("*").gte("created_at", start_date.isoformat()).execute()
        period_entries = period_res.data

        p_income = sum(e['amount'] for e in period_entries if e['type'] == 'debit')
        p_expense = sum(e['amount'] for e in period_entries if e['type'] == 'credit')
        
        # 3. Ambil data penyewaan untuk hitung bagi hasil per sepeda
        # Kita butuh join dengan fleet untuk tahu investornya
        rental_res = db.table("rentals").select("*, fleet(name, investor_name)").gte("start_time", start_date.isoformat()).execute()
        rentals_data = rental_res.data

        investor_map = {}
        total_staff_salary = 0
        total_maintenance = 0
        total_dividends = 0
        total_addon_revenue = 0

        for r in rentals_data:
            bike_info = r.get("fleet") or {}
            investor = bike_info.get("investor_name") or "Pusat"
            amount = r.get("total_price") or 0

            # Hitung Potongan
            m_fee = (amount * maint_pct) + maint_nom
            net_bike = amount - m_fee
            s_salary = net_bike * staff_pct
            div = net_bike - s_salary

            # Hitung Pendapatan Add-on
            addons = r.get("selected_addons") or []
            duration = r.get("duration") or 1
            addon_amount = sum(a.get("price", 0) for a in addons) * duration
            
            total_maintenance += m_fee
            total_staff_salary += s_salary
            total_dividends += div
            total_addon_revenue += addon_amount

            if investor not in investor_map:
                investor_map[investor] = {"revenue": 0, "maintenance": 0, "net_bike_profit": 0, "staff_salary": 0, "dividend": 0, "addon_revenue": 0}
            
            investor_map[investor]["revenue"] += amount
            investor_map[investor]["maintenance"] += m_fee
            investor_map[investor]["net_bike_profit"] += net_bike
            investor_map[investor]["staff_salary"] += s_salary
            investor_map[investor]["dividend"] += div
            investor_map[investor]["addon_revenue"] += addon_amount

        investor_splits = [
            InvestorSplit(name=k, **v) for k, v in investor_map.items()
        ]

        # 4. Agregasi Tren
        trends_map = {}
        for e in period_entries:
            date_str = e['created_at'][:10]
            if date_str not in trends_map: trends_map[date_str] = {"income": 0, "expense": 0}
            if e['type'] == 'debit': trends_map[date_str]["income"] += e['amount']
            else: trends_map[date_str]["expense"] += e['amount']
        
        trends = [DailyTrend(date=d, income=v["income"], expense=v["expense"]) for d, v in sorted(trends_map.items())]

        return FinancialReport(
            summary=FinancialSummary(
                total_income=p_income,
                total_expense=p_expense,
                net_profit=p_income - p_expense,
                cash_on_hand=cash_on_hand,
                total_staff_salary=total_staff_salary,
                total_maintenance_fee=total_maintenance,
                total_investor_dividend=total_dividends,
                total_addon_revenue=total_addon_revenue
            ),
            trends=trends,
            investor_splits=investor_splits,
            top_revenue_sources=sorted([e for e in period_entries if e['type'] == 'debit'], key=lambda x: x['amount'], reverse=True)[:5]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
