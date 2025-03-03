/*
  # Add comments system

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `message_id` (uuid, references messages)
      - `user_id` (uuid, references profiles)
      - `content` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on comments table
    - Add policies for:
      - Authenticated users can read all comments
      - Users can create their own comments
*/

-- Create comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);