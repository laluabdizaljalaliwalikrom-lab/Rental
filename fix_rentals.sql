-- Add missing columns to rentals table
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS customer_address TEXT;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS identity_type TEXT;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS identity_number TEXT;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS identity_image_url TEXT;
ALTER TABLE public.rentals ADD COLUMN IF NOT EXISTS processed_by_name TEXT;
