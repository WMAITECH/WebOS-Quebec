/*
  # Fix conversation deletion policy

  1. Changes
    - Update DELETE policy on conversations table
    - Allow both creator (created_by) and participants to delete conversations
    - Uses existing user_is_conversation_participant() function for consistency

  2. Security
    - Maintains RLS protection
    - Only conversation creator or participants can delete
    - Prevents unauthorized deletion by other users
*/

-- Drop existing delete policy
DROP POLICY IF EXISTS "Users can delete their conversations" ON conversations;

-- Create new policy allowing creator OR participants to delete
CREATE POLICY "Users can delete their conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR user_is_conversation_participant(id, auth.uid())
  );

COMMENT ON POLICY "Users can delete their conversations" ON conversations IS
  'Users can delete conversations they created or are participants in. Allows any participant to delete a conversation.';
