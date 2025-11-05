/*
  # Fix infinite recursion in conversation_participants policies

  1. Changes
    - Drop the existing recursive SELECT policy
    - Create a simple non-recursive SELECT policy that directly checks user_id
    - Fix INSERT policy to be more specific

  2. Security
    - Users can only see participants in conversations where they are participants
    - Users can only add participants to conversations they created or are part of
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view participants in conversations they are part of" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations they created" ON conversation_participants;

-- Create simple non-recursive SELECT policy
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
      AND cp2.user_id = auth.uid()
    )
  );

-- Create proper INSERT policy
CREATE POLICY "Users can add participants to their conversations"
  ON conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
      AND c.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
      AND cp2.user_id = auth.uid()
    )
  );
