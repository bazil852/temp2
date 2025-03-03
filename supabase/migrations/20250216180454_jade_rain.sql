/*
  # Create storage bucket for message images

  1. New Features
    - Create a public bucket for storing message images
    - Set up storage policies for authenticated users
*/

-- Create a bucket for message images
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-images'
  AND auth.role() = 'authenticated'
);

-- Allow public access to view images
CREATE POLICY "Anyone can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'message-images');