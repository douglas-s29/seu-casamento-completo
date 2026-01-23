-- Clean up duplicate/conflicting policies and properly secure tables

-- GIFTS TABLE: Remove all SELECT policies and create clean ones
DROP POLICY IF EXISTS "Anyone can read gifts through view" ON public.gifts;
DROP POLICY IF EXISTS "Only admins can view full gift data" ON public.gifts;
DROP POLICY IF EXISTS "Admins can read all gift data" ON public.gifts;
DROP POLICY IF EXISTS "Public can read gifts via view" ON public.gifts;
DROP POLICY IF EXISTS "Authenticated non-admins read gifts via view" ON public.gifts;

-- Create single admin-only policy for full table access
CREATE POLICY "Admins can read all gifts"
ON public.gifts
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create policy for anon/public to read through view only
-- The gifts_public view has security_invoker=on so it needs underlying permission
CREATE POLICY "View access for gifts_public"
ON public.gifts
FOR SELECT
TO anon, authenticated
USING (true);

-- Wait, that's still too permissive. The issue is that security_invoker views
-- execute queries as the calling user, so they need permission on the base table.
-- But we can't filter columns with RLS.

-- Better approach: deny direct table access, only allow via view by checking context
-- Actually, the proper fix is to NOT use security_invoker for this case

-- Let's drop the permissive policy and recreate the view WITHOUT security_invoker
DROP POLICY IF EXISTS "View access for gifts_public" ON public.gifts;

-- Drop and recreate the view without security_invoker (so it runs as definer/owner)
DROP VIEW IF EXISTS public.gifts_public;

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
-- Note: Excludes purchaser_name, purchaser_email, purchased_at

-- Grant access to the view for anon and authenticated users
GRANT SELECT ON public.gifts_public TO anon;
GRANT SELECT ON public.gifts_public TO authenticated;

-- Now the gifts table only needs admin SELECT policy
-- (view runs with owner privileges, bypassing RLS)

-- GUEST_PURCHASES: Remove any lingering duplicate policies
DROP POLICY IF EXISTS "Only admins can view guests" ON public.guests;

-- Recreate clean policy
CREATE POLICY "Only admins can view guests"
ON public.guests
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));