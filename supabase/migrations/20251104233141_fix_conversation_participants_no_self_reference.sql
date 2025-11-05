/*
  # Fix Conversation Participants - Remove All Self-References

  ## Problem
  Any reference to conversation_participants within its own policies causes recursion,
  even via SECURITY DEFINER functions.

  ## Solution
  Simplify policies to NEVER check if user is a participant via conversation_participants.
  Instead, rely ONLY on:
  1. Direct ownership (user_id = auth.uid())
  2. Conversation creator check (via conversations table only)

  ## Trade-off
  Participants can only view themselves in the participant list, not other participants,
  UNLESS they are the conversation creator.

  ## Security
  - Still secure: users only see their own participation or conversations they created
  - No data leakage
  - No recursion possible
*/

-- Drop function
DROP FUNCTION IF EXISTS is_conversation_participant(uuid, uuid) CASCADE;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can remove participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants" ON conversation_participants;

-- VIEW: Simple rules without self-reference
CREATE POLICY "Users can view participants"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    -- User can see themselves
    user_id = (select auth.uid())
    OR
    -- Conversation creator can see all participants
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by = (select auth.uid())
    )
  );

-- INSERT: Only creator can add participants
CREATE POLICY "Users can add participants"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by = (select auth.uid())
    )
  );

-- DELETE: Can remove self OR creator can remove anyone
CREATE POLICY "Users can remove participants"
  ON conversation_participants FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by = (select auth.uid())
    )
  );

COMMENT ON POLICY "Users can view participants" ON conversation_participants IS
  'Users can view their own participation record or all participants if they created the conversation.';

COMMENT ON POLICY "Users can add participants" ON conversation_participants IS
  'Only conversation creators can add new participants.';

COMMENT ON POLICY "Users can remove participants" ON conversation_participants IS
  'Users can remove themselves, or conversation creator can remove anyone.';
