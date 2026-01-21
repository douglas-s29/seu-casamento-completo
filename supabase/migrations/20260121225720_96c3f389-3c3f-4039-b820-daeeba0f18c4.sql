-- Add age column to guests table
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS age integer;

-- Create table for companions/dependents with individual details
CREATE TABLE public.guest_companions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id uuid REFERENCES public.guests(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    age integer,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guest_companions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert companions (for RSVP)
CREATE POLICY "Anyone can insert companions"
ON public.guest_companions FOR INSERT
WITH CHECK (true);

-- Allow admins to view all companions
CREATE POLICY "Admins can view all companions"
ON public.guest_companions FOR SELECT
USING (public.is_admin(auth.uid()));

-- Allow admins to manage companions
CREATE POLICY "Admins can manage companions"
ON public.guest_companions FOR ALL
USING (public.is_admin(auth.uid()));