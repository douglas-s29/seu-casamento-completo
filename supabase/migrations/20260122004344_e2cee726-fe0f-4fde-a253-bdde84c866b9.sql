-- Create function to increment gift purchase count
CREATE OR REPLACE FUNCTION public.increment_gift_purchase_count(gift_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE gifts 
  SET purchase_count = purchase_count + 1,
      updated_at = now()
  WHERE id = gift_id_param;
END;
$$;

-- Create function to decrement gift purchase count
CREATE OR REPLACE FUNCTION public.decrement_gift_purchase_count(gift_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE gifts 
  SET purchase_count = GREATEST(0, purchase_count - 1),
      updated_at = now()
  WHERE id = gift_id_param;
END;
$$;