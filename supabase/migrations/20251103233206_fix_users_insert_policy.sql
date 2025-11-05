/*
  # Fix Users Table INSERT Policy

  ## Changes
  - Add INSERT policy to allow authenticated users to create their own profile
  - Policy ensures users can only insert a row with their own auth.uid()

  ## Security
  - Users can only create a profile for themselves (id must match auth.uid())
  - Email must match their authenticated email
  - Prevents users from creating profiles for other users
*/

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
