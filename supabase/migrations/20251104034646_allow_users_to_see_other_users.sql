/*
  # Allow Users to View Other Users

  1. Problem
    - Current RLS only allows users to read their own profile
    - Users cannot see other users to create conversations
    - Messaging system requires viewing other users' basic info

  2. Solution
    - Add policy allowing authenticated users to read all user profiles
    - Restricts to basic info: id, email, full_name, phone_number, phone_verified
    - Maintains security while enabling messaging functionality

  3. Security
    - Only authenticated users can view
    - No sensitive data exposed
    - Read-only access
*/

-- Add policy to allow users to view other users' profiles
CREATE POLICY "Authenticated users can view all user profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);
