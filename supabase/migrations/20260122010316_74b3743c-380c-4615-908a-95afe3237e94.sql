-- Add background_image_url column to wedding_settings
ALTER TABLE public.wedding_settings 
ADD COLUMN IF NOT EXISTS background_image_url TEXT;