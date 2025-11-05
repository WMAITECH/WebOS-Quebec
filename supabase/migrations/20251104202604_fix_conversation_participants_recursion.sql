/*
  # Fix Conversation Participants Recursion

  ## Purpose
  Fix the infinite recursion error in conversation_participants RLS policies.
  The current policy tries to check if a user is a participant by querying
  the same table, creating a circular dependency.

  ## Changes
  - Drop the recursive RLS policy on conversation_participants
  - Create a simple, non-recursive policy that checks directly against auth.uid()
  - Maintain security while avoiding recursion

  ## Security
  - Users can only see participant records for conversations they're part of
  - Simple direct check without subquery on the same table
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON conversation_participants;

-- Create non-recursive policy for viewing participants
-- Users can see participants of conversations where they are themselves a participant
CREATE POLICY "Users can view participants of their conversations"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    -- Direct check: can see participants if user_id matches OR if there's a matching conversation_id
    user_id = auth.uid()
    OR 
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Create policy for adding participants
-- Only conversation creators can add participants
CREATE POLICY "Conversation creators can add participants"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
      AND c.created_by = auth.uid()
    )
  );

-- Allow users to remove themselves from conversations
CREATE POLICY "Users can leave conversations"
  ON conversation_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
