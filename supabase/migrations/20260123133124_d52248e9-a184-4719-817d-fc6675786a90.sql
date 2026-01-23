-- CRITICAL FIX: Remove public direct table access, force access through views only
-- The issue is that security_invoker views require underlying SELECT permission,
-- but we can't filter columns with RLS. 

-- Solution: Remove permissive SELECT policies from base tables with sensitive data

-- 1. GIFTS TABLE: Remove public SELECT, keep only admin access
DROP POLICY IF EXISTS "Public read for view" ON public.gifts;
DROP POLICY IF EXISTS "Admins can read all gifts" ON public.gifts;

-- Only admins can read the full gifts table
CREATE POLICY "Only admins can read gifts table"
ON public.gifts
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 2. WEDDING_SETTINGS TABLE: Remove public SELECT, keep only admin access
DROP POLICY IF EXISTS "Anyone can read wedding settings through view" ON public.wedding_settings;
DROP POLICY IF EXISTS "Only admins can view full wedding settings" ON public.wedding_settings;

-- Only admins can read the full wedding_settings table
CREATE POLICY "Only admins can read wedding settings table"
ON public.wedding_settings
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 3. Recreate views WITHOUT security_invoker (SECURITY DEFINER runs as owner, bypasses RLS)
-- This is the correct approach when you want to expose limited columns publicly
-- The view owner has full access, but only exposes safe columns

DROP VIEW IF EXISTS public.gifts_public;
DROP VIEW IF EXISTS public.wedding_settings_public;

-- Create gifts_public view as SECURITY DEFINER (default when no option specified)
-- This view excludes: purchaser_name, purchaser_email, purchased_at
CREATE VIEW public.gifts_public AS
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

-- Create wedding_settings_public view as SECURITY DEFINER
-- This view excludes: pix_key, bank_name, account_holder
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

-- Grant SELECT on views to public roles
GRANT SELECT ON public.gifts_public TO anon;
GRANT SELECT ON public.gifts_public TO authenticated;
GRANT SELECT ON public.wedding_settings_public TO anon;
GRANT SELECT ON public.wedding_settings_public TO authenticated;