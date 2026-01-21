-- Add map URLs to wedding_settings
ALTER TABLE public.wedding_settings
ADD COLUMN ceremony_map_url TEXT,
ADD COLUMN reception_map_url TEXT;

-- Add purchase limit for gifts (default 8)
ALTER TABLE public.wedding_settings
ADD COLUMN gift_purchase_limit INTEGER NOT NULL DEFAULT 8;

-- Modify gifts table to allow multiple purchases
ALTER TABLE public.gifts
ADD COLUMN purchase_limit INTEGER NOT NULL DEFAULT 1,
ADD COLUMN purchase_count INTEGER NOT NULL DEFAULT 0;

-- Create table to track individual gift purchases
CREATE TABLE public.gift_purchases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gift_id UUID NOT NULL REFERENCES public.gifts(id) ON DELETE CASCADE,
    purchaser_name TEXT NOT NULL,
    purchaser_email TEXT,
    amount NUMERIC NOT NULL,
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on gift_purchases
ALTER TABLE public.gift_purchases ENABLE ROW LEVEL SECURITY;

-- Anyone can view purchases (for stats)
CREATE POLICY "Anyone can view gift purchases"
ON public.gift_purchases
FOR SELECT
USING (true);

-- Anyone can insert purchases
CREATE POLICY "Anyone can insert gift purchases"
ON public.gift_purchases
FOR INSERT
WITH CHECK (true);

-- Admins can manage purchases
CREATE POLICY "Admins can manage gift purchases"
ON public.gift_purchases
FOR ALL
USING (is_admin(auth.uid()));

-- Update gifts table - make purchased column computed based on purchase_count >= purchase_limit
-- We'll handle this in the application logic instead