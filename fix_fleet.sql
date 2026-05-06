-- Add missing column price_per_day to fleet table
ALTER TABLE public.fleet ADD COLUMN IF NOT EXISTS price_per_day NUMERIC(15, 2) DEFAULT 0;
