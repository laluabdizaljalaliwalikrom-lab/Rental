-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create settings table if not exists (handling edge case)
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add system config columns if missing
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS staff_salary_percentage FLOAT DEFAULT 10.0;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS maintenance_fee_percentage FLOAT DEFAULT 5.0;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS maintenance_fee_nominal FLOAT DEFAULT 0.0;

-- 3. Add Landing Page customization columns
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_title_id TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_title_en TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_desc_id TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_desc_en TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS promo_text_id TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS promo_text_en TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS stats_perf TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS stats_sec TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS stats_ready TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS stats_rating TEXT;

-- 4. Enable RLS and add policies
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
CREATE POLICY "Public can view settings" ON public.settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
CREATE POLICY "Admins can update settings" ON public.settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- 5. Insert default data if empty
INSERT INTO public.settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.settings (id) VALUES ('landing') ON CONFLICT (id) DO NOTHING;
