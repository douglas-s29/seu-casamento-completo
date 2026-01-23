-- Recreate the wedding_settings_public view with proper public access
-- First drop the existing view
DROP VIEW IF EXISTS public.wedding_settings_public;

-- Recreate the view with security_invoker=off to allow public access
CREATE VIEW public.wedding_settings_public AS
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

-- Grant SELECT access to anon and authenticated roles on the view
GRANT SELECT ON public.wedding_settings_public TO anon;
GRANT SELECT ON public.wedding_settings_public TO authenticated;

-- Also recreate gifts_public view with proper access
DROP VIEW IF EXISTS public.gifts_public;

CREATE VIEW public.gifts_public AS
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

-- Grant SELECT access to anon and authenticated roles on the view
GRANT SELECT ON public.gifts_public TO anon;
GRANT SELECT ON public.gifts_public TO authenticated;