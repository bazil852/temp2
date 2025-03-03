/*
  # Add logo support to Blueprints

  1. Changes
    - Add logo_url column to blueprints table
    - Create storage bucket for blueprint logos
    - Add storage policies for blueprint logos

  2. Security
    - Enable public access for viewing logos
    - Restrict upload permissions to authenticated users
*/

-- Add logo_url column to blueprints table
ALTER TABLE blueprints
ADD COLUMN logo_url TEXT;

-- Create a bucket for blueprint logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('blueprint-logos', 'blueprint-logos', true);

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload blueprint logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'blueprint-logos'
  AND auth.role() = 'authenticated'
);

-- Allow public access to view logos
CREATE POLICY "Anyone can view blueprint logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'blueprint-logos');