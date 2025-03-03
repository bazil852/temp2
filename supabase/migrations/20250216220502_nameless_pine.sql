/*
  # Add AI Tools and Categories

  1. New Tables
    - `ai_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references profiles)

    - `ai_tools`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `logo_url` (text)
      - `category_id` (uuid, references ai_categories)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create AI categories table
CREATE TABLE ai_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(name)
);

-- Enable RLS for AI categories
ALTER TABLE ai_categories ENABLE ROW LEVEL SECURITY;

-- AI Categories policies
CREATE POLICY "Anyone can read AI categories"
  ON ai_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create AI categories"
  ON ai_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create AI tools table
CREATE TABLE ai_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  category_id UUID REFERENCES ai_categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_ai_tools_category_id ON ai_tools(category_id);
CREATE INDEX idx_ai_tools_user_id ON ai_tools(user_id);
CREATE INDEX idx_ai_tools_created_at ON ai_tools(created_at DESC);

-- Enable RLS for AI tools
ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;

-- AI Tools policies
CREATE POLICY "Anyone can read AI tools"
  ON ai_tools
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create AI tools"
  ON ai_tools
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create a bucket for AI tool logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-tool-logos', 'ai-tool-logos', true);

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ai-tool-logos'
  AND auth.role() = 'authenticated'
);

-- Allow public access to view logos
CREATE POLICY "Anyone can view logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ai-tool-logos');

-- Insert initial AI categories
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Get the first user's ID
  SELECT id INTO first_user_id FROM profiles LIMIT 1;
  
  -- Insert AI categories
  INSERT INTO ai_categories (name, user_id)
  VALUES 
    ('Text Generation', first_user_id),
    ('Image Processing', first_user_id),
    ('Code Assistant', first_user_id)
  ON CONFLICT (name) DO NOTHING;
END $$;