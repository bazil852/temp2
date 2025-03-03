/*
  # Add blueprints table and relationships

  1. New Tables
    - `blueprints`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `download_url` (text)
      - `category_id` (uuid, references categories)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `blueprints` table
    - Add policies for authenticated users to:
      - Read all blueprints
      - Create their own blueprints
*/

CREATE TABLE blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  download_url TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_blueprints_category_id ON blueprints(category_id);
CREATE INDEX idx_blueprints_user_id ON blueprints(user_id);
CREATE INDEX idx_blueprints_created_at ON blueprints(created_at DESC);

-- Enable RLS
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read blueprints"
  ON blueprints
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create blueprints"
  ON blueprints
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);