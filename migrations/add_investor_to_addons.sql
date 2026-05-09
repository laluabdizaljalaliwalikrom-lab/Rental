-- Migration: Add Investor Ownership to Addons
-- Date: 2026-05-09

-- 1. Add investor columns to addons table
ALTER TABLE public.addons ADD COLUMN IF NOT EXISTS investor_id UUID REFERENCES public.investors(id) ON DELETE SET NULL;
ALTER TABLE public.addons ADD COLUMN IF NOT EXISTS investor_name TEXT;

-- 2. Update existing addons to have "Pusat" as default if needed (optional)
-- UPDATE public.addons SET investor_name = 'Pusat' WHERE investor_id IS NULL;
