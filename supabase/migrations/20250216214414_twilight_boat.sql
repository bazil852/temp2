/*
  # Fix classroom tables and permissions

  1. Changes
    - Drop and recreate categories and classes tables with proper constraints
    - Update RLS policies for better security
    - Add indexes for better query performance

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS categories;

-- Recreate categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(name)
);

-- Enable RLS for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail TEXT,
  video_url TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_classes_category_id ON classes(category_id);
CREATE INDEX idx_classes_user_id ON classes(user_id);
CREATE INDEX idx_classes_created_at ON classes(created_at DESC);

-- Enable RLS for classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Classes policies
CREATE POLICY "Anyone can read classes"
  ON classes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create classes"
  ON classes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert default categories
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Get the first user's ID
  SELECT id INTO first_user_id FROM profiles LIMIT 1;
  
  -- Insert categories if they don't exist
  INSERT INTO categories (name, user_id)
  VALUES 
    ('AI', first_user_id),
    ('Automation', first_user_id)
  ON CONFLICT (name) DO NOTHING;
END $$;