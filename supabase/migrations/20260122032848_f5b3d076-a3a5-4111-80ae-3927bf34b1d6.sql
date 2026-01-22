-- Fix conflicting RLS policies on gifts table
-- Remove the old "Anyone can view gifts" policy that was recreated
DROP POLICY IF EXISTS "Anyone can view gifts" ON public.gifts;

-- Ensure only the secure policy exists
-- The "Only admins can view full gift data" policy should remain

-- Also drop duplicate policies on wedding_settings
DROP POLICY IF EXISTS "Anyone can view wedding settings" ON public.wedding_settings;

-- Verify: gifts should only have admin SELECT policy
-- wedding_settings should only have admin SELECT policy