-- Fix Security Definer View warnings by using security_invoker=on
-- This ensures the view respects the calling user's permissions

-- Recreate wedding_settings_public with security_invoker
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

-- Grant SELECT access
GRANT SELECT ON public.wedding_settings_public TO anon;
GRANT SELECT ON public.wedding_settings_public TO authenticated;

-- Recreate gifts_public with security_invoker
DROP VIEW IF EXISTS public.gifts_public;

CREATE VIEW public.gifts_public
WITH (security_invoker=on) AS
SELECT 
  id,
  name,
  description,
  price,
  image_url,
  category,
  purchase_count,
  purchase_limit,
  purchased,
  created_at,
  updated_at
FROM public.gifts;

-- Grant SELECT access
GRANT SELECT ON public.gifts_public TO anon;
GRANT SELECT ON public.gifts_public TO authenticated;

-- Now add a SELECT policy on wedding_settings for public access through the view
-- Since the view uses security_invoker, we need a policy that allows reading
CREATE POLICY "Anyone can read wedding settings through view"
ON public.wedding_settings
FOR SELECT
USING (true);

-- Add a SELECT policy on gifts for public access through the view
CREATE POLICY "Anyone can read gifts through view"
ON public.gifts
FOR SELECT
USING (true);