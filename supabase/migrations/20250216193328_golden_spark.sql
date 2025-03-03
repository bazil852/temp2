/*
  # Fix profile permissions

  1. Changes
    - Update RLS policy on profiles table to allow all authenticated users to read any profile
    - This enables chat users to see other users' display names and avatars

  2. Security
    - Maintains write restrictions (users can only update their own profiles)
    - Read-only access for authenticated users to view other profiles
*/

-- Drop the existing select policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new policy to allow authenticated users to view all profiles
CREATE POLICY "Authenticated users can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Keep the existing update policy unchanged
-- Users can still only update their own profiles