-- Create the rentals table
CREATE TABLE IF NOT EXISTS public.rentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bike_id UUID REFERENCES public.fleet(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    rental_type TEXT NOT NULL CHECK (rental_type IN ('Short', 'Long')),
    duration INTEGER NOT NULL,
    total_price NUMERIC(15, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed')),
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time TIMESTAMPTZ
);

-- Enable RLS (Optional, but recommended)
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all actions for now (Adjust as needed)
-- Note: In production, you should restrict this to authenticated users
CREATE POLICY "Allow all actions for rentals" ON public.rentals
    FOR ALL USING (true) WITH CHECK (true);
