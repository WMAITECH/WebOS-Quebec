/*
  # Allow Users to Create Conversations and See Other Users

  ## Purpose
  Fix the 403 error when creating conversations by simplifying the RLS policy.
  Also ensure users can see other users for creating conversations.

  ## Changes
  1. Simplify conversation INSERT policy to just check authentication
  2. Add policy to allow authenticated users to view other users (for conversation creation)
  3. The created_by field will be validated by the application logic

  ## Security
  - Users must be authenticated to create conversations
  - Users can view other users to start conversations
  - Participants are still restricted to conversation members only
*/

-- Fix conversations INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is authenticated and created_by matches their ID
    created_by = auth.uid()
  );

-- Ensure users can view other users (needed for creating conversations)
DROP POLICY IF EXISTS "Users can view other users" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;

CREATE POLICY "Authenticated users can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Also allow users to view their own profile for updates
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
