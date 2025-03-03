/*
  # Add automation categories

  1. New Tables
    - `automation_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `created_at` (timestamptz)
      - `user_id` (uuid, references profiles)

  2. Changes
    - Update blueprints table to reference automation_categories instead of categories
    - Add initial automation categories

  3. Security
    - Enable RLS on automation_categories table
    - Add policies for authenticated users to read and create categories
*/

-- Create automation categories table
CREATE TABLE automation_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(name)
);

-- Enable RLS
ALTER TABLE automation_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read automation categories"
  ON automation_categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create automation categories"
  ON automation_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update blueprints table to reference automation_categories
ALTER TABLE blueprints
DROP CONSTRAINT blueprints_category_id_fkey;

ALTER TABLE blueprints
ADD CONSTRAINT blueprints_category_id_fkey
FOREIGN KEY (category_id) REFERENCES automation_categories(id)
ON DELETE CASCADE;

-- Insert initial automation categories
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Get the first user's ID
  SELECT id INTO first_user_id FROM profiles LIMIT 1;
  
  -- Insert automation categories
  INSERT INTO automation_categories (name, user_id)
  VALUES 
    ('N8N Automations', first_user_id),
    ('Make.com Automations', first_user_id)
  ON CONFLICT (name) DO NOTHING;
END $$;