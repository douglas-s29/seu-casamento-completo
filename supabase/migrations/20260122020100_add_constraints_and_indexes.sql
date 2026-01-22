-- Add constraints and validations to gift_purchases table
ALTER TABLE public.gift_purchases 
  ADD CONSTRAINT IF NOT EXISTS check_amount_positive CHECK (amount > 0);

-- Add check constraints for payment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_payment_status' 
    AND conrelid = 'public.gift_purchases'::regclass
  ) THEN
    ALTER TABLE public.gift_purchases 
      ADD CONSTRAINT check_payment_status CHECK (
        payment_status IN ('pending', 'confirmed', 'cancelled', 'refunded')
      );
  END IF;
END$$;

-- Add check constraints for payment_gateway
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_payment_gateway' 
    AND conrelid = 'public.gift_purchases'::regclass
  ) THEN
    ALTER TABLE public.gift_purchases 
      ADD CONSTRAINT check_payment_gateway CHECK (
        payment_gateway IN ('abacatepay', 'asaas', 'manual') OR payment_gateway IS NULL
      );
  END IF;
END$$;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gift_purchases_payment_status ON public.gift_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_gift_purchases_gateway ON public.gift_purchases(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_gift_purchases_gift_id ON public.gift_purchases(gift_id);

-- Add constraints to gifts table
ALTER TABLE public.gifts
  ADD CONSTRAINT IF NOT EXISTS check_price_positive CHECK (price >= 0),
  ADD CONSTRAINT IF NOT EXISTS check_purchase_limit_positive CHECK (purchase_limit > 0),
  ADD CONSTRAINT IF NOT EXISTS check_purchase_count_nonnegative CHECK (purchase_count >= 0);

-- Add constraint to ensure purchase_count doesn't exceed limit (soft constraint, can be violated temporarily)
COMMENT ON COLUMN public.gifts.purchase_count IS 'Current number of confirmed purchases (updated by webhooks)';
COMMENT ON COLUMN public.gifts.purchase_limit IS 'Maximum number of purchases allowed for this gift';
