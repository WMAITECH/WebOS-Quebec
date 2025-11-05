/*
  # ULTIMATE FIX: Conversation Participants RLS - No Recursion (v2)
  
  ## Problem Analysis
  The previous policy created infinite recursion because it queried conversation_participants 
  within the RLS policy for conversation_participants itself.
  
  ## Solution Strategy
  Use a security definer function that bypasses RLS to check participation.
  This breaks the recursion cycle safely.
  
  ## Security
  - Users can only see participants in conversations they belong to
  - The check function is secure and doesn't leak information
  - All operations remain properly restricted
*/

-- Step 1: Drop all existing policies on conversation_participants
DROP POLICY IF EXISTS "Users can view all participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can remove participants" ON conversation_participants;

-- Step 2: Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS public.user_is_conversation_participant(uuid, uuid);

-- Step 3: Create a security definer function to check if user is in a conversation
-- This function bypasses RLS to avoid recursion
CREATE FUNCTION public.user_is_conversation_participant(
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

-- Step 4: Create new SELECT policy using the security definer function
CREATE POLICY "Participants can view all members of their conversations"
  ON conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    user_is_conversation_participant(conversation_id, auth.uid())
  );

-- Step 5: Recreate INSERT policy (creator can add participants)
CREATE POLICY "Conversation creators can add participants"
  ON conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = conversation_id
      AND c.created_by = auth.uid()
    )
  );

-- Step 6: Recreate DELETE policy (user can leave or creator can remove)
CREATE POLICY "Users can leave or creators can remove participants"
  ON conversation_participants
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = conversation_id
      AND c.created_by = auth.uid()
    )
  );

-- Step 7: Create index to optimize the security definer function
CREATE INDEX IF NOT EXISTS idx_conversation_participants_lookup
  ON conversation_participants(conversation_id, user_id);

-- Step 8: Grant execute permission on the function
GRANT EXECUTE ON FUNCTION user_is_conversation_participant(uuid, uuid) TO authenticated;
