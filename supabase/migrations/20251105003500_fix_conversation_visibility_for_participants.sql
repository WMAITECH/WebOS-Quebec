/*
  # Fix conversation visibility for all participants

  1. Changes
    - Update SELECT policy on conversations to allow participants to see conversations they're part of
    - Users should see conversations they created OR conversations they participate in

  2. Security
    - Maintains authentication requirement
    - Ensures users can only see conversations they're involved in
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;

-- Create new policy that allows participants to see conversations
CREATE POLICY "Users can view conversations they participate in"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
    )
  );
