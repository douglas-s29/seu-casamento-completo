-- Create storage bucket for gift images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gift-images', 'gift-images', true);

-- Allow anyone to view gift images (public bucket)
CREATE POLICY "Anyone can view gift images"
ON storage.objects FOR SELECT
USING (bucket_id = 'gift-images');

-- Only admins can upload gift images
CREATE POLICY "Admins can upload gift images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'gift-images' AND public.is_admin(auth.uid()));

-- Only admins can update gift images
CREATE POLICY "Admins can update gift images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'gift-images' AND public.is_admin(auth.uid()));

-- Only admins can delete gift images
CREATE POLICY "Admins can delete gift images"
ON storage.objects FOR DELETE
USING (bucket_id = 'gift-images' AND public.is_admin(auth.uid()));