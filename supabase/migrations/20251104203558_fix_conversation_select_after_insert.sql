/*
  # Fix Conversation SELECT Policy After INSERT

  ## Purpose
  Fix 403 error that occurs when selecting a conversation immediately after creation.
  The issue: INSERT succeeds but SELECT fails because participants haven't been added yet.

  ## Problem
  1. User creates conversation with INSERT (succeeds)
  2. Frontend does .select().single() to get the created conversation
  3. SELECT policy checks conversation_participants table
  4. Participants haven't been added yet (they're added AFTER the INSERT)
  5. SELECT fails with 403

  ## Solution
  Allow users to SELECT conversations where they are EITHER:
  - A participant (existing behavior)
  - The creator (new behavior - allows SELECT immediately after INSERT)

  ## Security
  - Users can only see conversations they created or participate in
  - No security regression - creators will become participants anyway
  - Prevents the race condition between INSERT and adding participants
*/

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;

-- New SELECT policy: allow creator OR participant
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    -- Allow if user created the conversation
    created_by = auth.uid()
    OR
    -- Allow if user is a participant
    EXISTS (
      SELECT 1 
      FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id 
        AND cp.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "Users can view their conversations" ON conversations IS
  'Users can view conversations they created or participate in. Creator check allows SELECT immediately after INSERT before participants are added.';
