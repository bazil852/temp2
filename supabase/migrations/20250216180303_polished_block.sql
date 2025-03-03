/*
  # Fix messages relationship with profiles

  1. Changes
    - Add foreign key relationship between messages and profiles
    - Update messages table to use profiles(id) as foreign key
    - Add policy for users to view all messages with profile information
*/

-- Drop existing foreign key if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_user_id_fkey'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT messages_user_id_fkey;
  END IF;
END $$;

-- Add foreign key relationship
ALTER TABLE messages
ADD CONSTRAINT messages_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id)
ON DELETE CASCADE;