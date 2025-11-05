/*
  # Fix conversation_participants SELECT policy

  1. Problem
    - Current policy only allows users to see their own participation
    - Users cannot see other participants in their conversations
    - This causes "Utilisateur" to be displayed instead of real names

  2. Solution
    - Drop the restrictive SELECT policy
    - Create new policy that allows viewing all participants in conversations where the user is a participant

  3. Security
    - Users can only see participants in conversations they are part of
    - Other conversations remain hidden
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own participation" ON conversation_participants;

-- Create new policy that allows viewing all participants in user's conversations
CREATE POLICY "Users can view all participants in their conversations"
  ON conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );
