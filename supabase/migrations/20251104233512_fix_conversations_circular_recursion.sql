/*
  # Fix Conversations Circular Recursion

  ## Problem
  Circular recursion between conversations and conversation_participants:
  - conversations policies check conversation_participants
  - conversation_participants policies check conversations
  
  This creates infinite recursion.

  ## Solution
  Break the circular dependency:
  1. conversations policies will NOT check conversation_participants
  2. Only check created_by for conversations access
  3. Use a materialized approach: store participant user_ids directly in conversations
  
  For now, simplify: users can only see conversations they created.
  Messages will be visible via messages table policies.

  ## Security
  - Users see only conversations they created
  - Messages handle participant access separately
*/

-- Drop problematic policies on conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;

-- Simple policy: only creator can see/update conversation
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (created_by = (select auth.uid()));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can delete their conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (created_by = (select auth.uid()));

COMMENT ON POLICY "Users can view their conversations" ON conversations IS
  'Users can only view conversations they created. Avoids circular recursion with conversation_participants.';

COMMENT ON POLICY "Users can update their conversations" ON conversations IS
  'Only conversation creator can update conversation metadata.';

COMMENT ON POLICY "Users can delete their conversations" ON conversations IS
  'Only conversation creator can delete the conversation.';
