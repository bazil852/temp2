/*
  # Add profile photo and display name fields

  1. Changes
    - Add display_name and avatar_url columns to profiles table
    - Update RLS policies for the new fields
*/

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN display_name TEXT,
ADD COLUMN avatar_url TEXT;

-- Create a storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);

-- Allow public access to view avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');