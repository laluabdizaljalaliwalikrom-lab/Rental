-- Migration 002: Add cashbook table
CREATE TABLE public.cashbook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
    amount NUMERIC NOT NULL,
    description TEXT NOT NULL,
    reference_id UUID,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cashbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view cashbook"
    ON public.cashbook FOR SELECT
    USING (true);

CREATE POLICY "Staff and admin can modify cashbook"
    ON public.cashbook FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.role IN ('admin', 'staff')
        )
    );
