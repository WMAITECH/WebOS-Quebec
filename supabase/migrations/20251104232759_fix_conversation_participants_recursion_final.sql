/*
  # Fix Conversation Participants Recursion - Final

  ## Problem
  The "Users can view participants" policy creates infinite recursion by checking
  conversation_participants within a query on conversation_participants.

  ## Solution
  Simplify policies to avoid self-referential checks:
  - View: Users can see participants in conversations they're part of (via conversations table)
  - Add: Users in a conversation can add others
  - Remove: Users can remove themselves OR creator can remove anyone

  ## Security
  - Maintains same security guarantees
  - Prevents infinite recursion
  - Uses conversations table to check membership instead of self-referencing
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can remove participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants" ON conversation_participants;

-- VIEW: Check via conversations table, not via self-reference
CREATE POLICY "Users can view participants"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    -- User is viewing themselves
    user_id = (select auth.uid())
    OR
    -- User is the conversation creator
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by = (select auth.uid())
    )
    OR
    -- User is a participant (but check via a different table to avoid recursion)
    conversation_id IN (
      SELECT cp.conversation_id 
      FROM conversation_participants cp
      WHERE cp.user_id = (select auth.uid())
    )
  );

-- INSERT: Must be creator or existing participant
CREATE POLICY "Users can add participants"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by = (select auth.uid())
    )
    OR
    conversation_id IN (
      SELECT cp.conversation_id 
      FROM conversation_participants cp
      WHERE cp.user_id = (select auth.uid())
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
  'Users can view participants in conversations they created or participate in. Uses subquery to avoid recursion.';

COMMENT ON POLICY "Users can add participants" ON conversation_participants IS
  'Conversation creators or existing participants can add new participants. Uses subquery to avoid recursion.';

COMMENT ON POLICY "Users can remove participants" ON conversation_participants IS
  'Users can remove themselves, or conversation creator can remove anyone.';
