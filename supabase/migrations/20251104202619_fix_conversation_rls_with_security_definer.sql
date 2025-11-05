/*
  # Fix Conversation RLS with Security Definer Function

  ## Purpose
  Completely eliminate recursion by using a SECURITY DEFINER function
  to check conversation participation without triggering RLS checks.

  ## Changes
  - Create a security definer function to check participation
  - Update all RLS policies to use this function
  - Avoid any self-referential queries in RLS policies

  ## Security
  - SECURITY DEFINER function bypasses RLS for internal checks only
  - All policies still enforce proper access control
  - Users can only access their own data
*/

-- Create a function to check if a user is a conversation participant
-- SECURITY DEFINER allows it to bypass RLS and avoid recursion
CREATE OR REPLACE FUNCTION is_conversation_participant(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM conversation_participants 
    WHERE conversation_id = p_conversation_id 
    AND user_id = p_user_id
  );
$$;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Conversation creators can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can leave conversations" ON conversation_participants;

-- Recreate simple, non-recursive policies using the function
CREATE POLICY "Users can view participants"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR is_conversation_participant(conversation_id, auth.uid())
  );

CREATE POLICY "Users can add participants"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
      AND (c.created_by = auth.uid() OR is_conversation_participant(c.id, auth.uid()))
    )
  );

CREATE POLICY "Users can remove participants"
  ON conversation_participants FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
      AND c.created_by = auth.uid()
    )
  );
