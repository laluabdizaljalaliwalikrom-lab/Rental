-- Migration: Create Addons Table and Update Rentals Table
-- Date: 2026-05-09

-- 1. Create Addons Table
CREATE TABLE IF NOT EXISTS public.addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Update Rentals Table to store selected addons
-- We use JSONB to store a snapshot of selected addons at the time of rental
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS selected_addons JSONB DEFAULT '[]'::jsonb;

-- 3. Enable RLS (Optional, adjust based on your security needs)
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Addons (Allow all for now to match current setup)
CREATE POLICY "Allow all for addons" ON public.addons FOR ALL USING (true);

-- 5. Grant permissions
GRANT ALL ON TABLE public.addons TO anon, authenticated, service_role;
