/*
  # Fix Conversation Participants - Drop and Recreate

  ## Solution
  1. Drop existing function and policies
  2. Create new security definer function
  3. Recreate policies using the function

  ## Security
  Function bypasses RLS safely to check participation without recursion
*/

-- Drop existing function first
DROP FUNCTION IF EXISTS is_conversation_participant(uuid, uuid) CASCADE;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can remove participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants" ON conversation_participants;

-- Create helper function that bypasses RLS
CREATE FUNCTION is_conversation_participant(
  conv_id uuid,
  check_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM conversation_participants cp
    WHERE cp.conversation_id = conv_id
      AND cp.user_id = check_user_id
  );
$$;

COMMENT ON FUNCTION is_conversation_participant(uuid, uuid) IS
  'Check if user is a participant in a conversation. SECURITY DEFINER to avoid RLS recursion.';

-- VIEW: Use the security definer function
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
    -- User is a participant (checked via security definer function)
    is_conversation_participant(conversation_id, (select auth.uid()))
  );

-- INSERT: Use the security definer function
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
    is_conversation_participant(conversation_id, (select auth.uid()))
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
