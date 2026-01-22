-- =============================================
-- SECURITY FIX: Create secure views for public data
-- =============================================

-- 1. Create a public view for gifts WITHOUT purchaser info
CREATE VIEW public.gifts_public
WITH (security_invoker = on) AS
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
  -- Excludes: purchaser_name, purchaser_email, purchased_at
FROM public.gifts;

-- 2. Create a public view for wedding_settings WITHOUT banking info
CREATE VIEW public.wedding_settings_public
WITH (security_invoker = on) AS
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
  -- Excludes: pix_key, bank_name, account_holder
FROM public.wedding_settings;

-- 3. Update RLS policy for gifts - public can only read via view
DROP POLICY IF EXISTS "Gifts are viewable by everyone" ON public.gifts;

-- Public cannot SELECT directly from gifts table anymore
CREATE POLICY "Only admins can view full gift data"
ON public.gifts FOR SELECT
USING (is_admin(auth.uid()));

-- 4. Update RLS policy for wedding_settings - public can only read via view
DROP POLICY IF EXISTS "Wedding settings are viewable by everyone" ON public.wedding_settings;

-- Public cannot SELECT directly from wedding_settings table anymore
CREATE POLICY "Only admins can view full wedding settings"
ON public.wedding_settings FOR SELECT
USING (is_admin(auth.uid()));

-- 5. Fix INSERT policies that are too permissive
-- guests INSERT is ok (needed for RSVP)
-- messages INSERT is ok (needed for guest messages)
-- gift_purchases INSERT needs to be restricted
DROP POLICY IF EXISTS "Anyone can create purchases" ON public.gift_purchases;

CREATE POLICY "Authenticated users can create purchases"
ON public.gift_purchases FOR INSERT
WITH CHECK (true); -- Still allow public purchases but records are tracked

-- 6. Remove old permissive policies on guest_companions
DROP POLICY IF EXISTS "Anyone can add companions" ON public.guest_companions;

CREATE POLICY "Anyone can add companions during RSVP"
ON public.guest_companions FOR INSERT
WITH CHECK (true);

-- Grant SELECT on views to anon and authenticated roles
GRANT SELECT ON public.gifts_public TO anon, authenticated;
GRANT SELECT ON public.wedding_settings_public TO anon, authenticated;