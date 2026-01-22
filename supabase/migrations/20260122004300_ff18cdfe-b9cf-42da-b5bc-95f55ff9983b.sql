-- Add payment status and external reference to gift_purchases
ALTER TABLE public.gift_purchases 
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS external_payment_id TEXT,
ADD COLUMN IF NOT EXISTS payment_gateway TEXT;

-- Create index for faster lookups by external payment id
CREATE INDEX IF NOT EXISTS idx_gift_purchases_external_payment_id 
ON public.gift_purchases(external_payment_id);

-- Add comment to explain status values
COMMENT ON COLUMN public.gift_purchases.payment_status IS 'pending, confirmed, refunded, cancelled';