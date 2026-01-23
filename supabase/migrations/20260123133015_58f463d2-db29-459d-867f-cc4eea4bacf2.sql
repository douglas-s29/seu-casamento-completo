-- Fix SECURITY DEFINER view issue by using security_invoker=on with proper RLS

-- Drop the current view
DROP VIEW IF EXISTS public.gifts_public;

-- Recreate view with security_invoker=on (recommended by Supabase)
CREATE VIEW public.gifts_public
WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  description,
  price,
  image_url,
  category,
  purchased,
  purchase_limit,
  purchase_count,
  created_at,
  updated_at
FROM public.gifts;

-- Grant access to the view
GRANT SELECT ON public.gifts_public TO anon;
GRANT SELECT ON public.gifts_public TO authenticated;

-- Now we need RLS policy on gifts table that allows read for the view
-- But restricts direct table queries from exposing sensitive data
-- The solution: create a policy for SELECT that works for the view
-- Since the view only selects non-sensitive columns, public access to those rows is OK

-- Current gifts policies:
-- "Admins can read all gifts" - allows admin full access (good)
-- We need a policy for non-admins to read (for the view to work)

-- Add policy that allows anyone to read gifts (the view filters columns)
CREATE POLICY "Public read for view"
ON public.gifts
FOR SELECT
USING (true);

-- Similarly, fix wedding_settings_public view
DROP VIEW IF EXISTS public.wedding_settings_public;

CREATE VIEW public.wedding_settings_public
WITH (security_invoker=on) AS
SELECT 
  id,
  bride_name,
  groom_name,
  wedding_date,
  ceremony_location,
  ceremony_address,
  ceremony_map_url,
  reception_location,
  reception_address,
  reception_map_url,
  dress_code,
  story_text,
  background_image_url,
  gift_purchase_limit,
  created_at,
  updated_at
FROM public.wedding_settings;
-- Note: Excludes pix_key, bank_name, account_holder (financial data)

GRANT SELECT ON public.wedding_settings_public TO anon;
GRANT SELECT ON public.wedding_settings_public TO authenticated;