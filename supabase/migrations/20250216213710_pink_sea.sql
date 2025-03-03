/*
  # Create classroom tables

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
      - `user_id` (uuid, references profiles)

    - `classes`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `thumbnail` (text)
      - `video_url` (text)
      - `category_id` (uuid, references categories)
      - `user_id` (uuid, references profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for reading and creating content
*/

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE
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
INSERT INTO categories (name, user_id)
SELECT 'AI', id FROM profiles LIMIT 1;

INSERT INTO categories (name, user_id)
SELECT 'Automation', id FROM profiles LIMIT 1;