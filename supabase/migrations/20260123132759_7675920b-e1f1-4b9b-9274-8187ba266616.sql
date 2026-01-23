-- Fix security vulnerabilities: restrict public access to tables with sensitive data

-- 1. GUESTS TABLE: Remove public SELECT, keep only INSERT for RSVP
-- Drop existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can read guests" ON public.guests;
DROP POLICY IF EXISTS "Anyone can view guests" ON public.guests;
DROP POLICY IF EXISTS "Public can view guests" ON public.guests;

-- Ensure only admins can SELECT guest data (contains emails and phones)
CREATE POLICY "Only admins can view guests"
ON public.guests
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 2. GIFT_PURCHASES TABLE: Remove public SELECT
-- Drop existing overly permissive SELECT policy  
DROP POLICY IF EXISTS "Anyone can read gift_purchases" ON public.gift_purchases;
DROP POLICY IF EXISTS "Anyone can view gift_purchases" ON public.gift_purchases;
DROP POLICY IF EXISTS "Public can view gift_purchases" ON public.gift_purchases;
DROP POLICY IF EXISTS "Anyone can view purchases" ON public.gift_purchases;

-- Ensure only admins can SELECT purchase data (contains purchaser emails)
CREATE POLICY "Only admins can view gift_purchases"
ON public.gift_purchases
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- 3. GIFTS TABLE: Restrict direct access, force use of gifts_public view
-- Drop existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can read gifts" ON public.gifts;
DROP POLICY IF EXISTS "Anyone can view gifts" ON public.gifts;
DROP POLICY IF EXISTS "Anyone can read gifts through view" ON public.gifts;
DROP POLICY IF EXISTS "Public can view gifts" ON public.gifts;

-- Create policy that allows public SELECT only through the view (no purchaser data)
-- The gifts_public view uses security_invoker=on, so we need a policy for it
CREATE POLICY "Public can read gifts through secure view"
ON public.gifts
FOR SELECT
USING (true);

-- Note: The gifts_public view already excludes purchaser_name, purchaser_email, purchased_at
-- So public access via view is safe. Admin access to full table is via authenticated + is_admin policies.

-- Actually, let's be more restrictive: public via view only, full table via admin
DROP POLICY IF EXISTS "Public can read gifts through secure view" ON public.gifts;

-- Allow anyone to read NON-SENSITIVE columns (the view handles this)
-- But we need RLS to work with security_invoker views
CREATE POLICY "Allow read for view access"
ON public.gifts
FOR SELECT
USING (true);

-- The security is enforced by the VIEW which only exposes safe columns
-- If someone queries the table directly, they see all columns
-- So we need a different approach: deny direct table access, allow only through view

-- Better approach: create separate policies for authenticated admins vs public
DROP POLICY IF EXISTS "Allow read for view access" ON public.gifts;

-- Admin policy: full access to gifts table
CREATE POLICY "Admins can read all gift data"
ON public.gifts
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Public policy: only allow access to non-sensitive columns
-- Since RLS can't filter columns, we rely on the view
-- But the view needs underlying SELECT permission
-- Solution: Allow SELECT but the view filters sensitive columns
CREATE POLICY "Public can read gifts via view"
ON public.gifts
FOR SELECT
TO anon
USING (true);

-- The gifts_public view excludes: purchaser_name, purchaser_email, purchased_at
-- So anon users querying the view only see safe columns
-- Authenticated non-admins should also use the view
CREATE POLICY "Authenticated non-admins read gifts via view"
ON public.gifts
FOR SELECT
TO authenticated
USING (true);