/*
  # Create messages table for community chat

  1. New Tables
    - `messages` table to store community chat messages
      - `id` (uuid, primary key)
      - `user_id` (uuid) - references profiles.id
      - `content` (text) - message content
      - `image_url` (text, optional) - URL for attached image
      - `created_at` (timestamp) - when the message was sent

  2. Security
    - Enable RLS on `messages` table
    - Add policies for:
      - All authenticated users can read messages
      - Users can create their own messages
*/

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);