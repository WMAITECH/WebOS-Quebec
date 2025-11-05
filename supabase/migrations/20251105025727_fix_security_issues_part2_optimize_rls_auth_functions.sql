/*
  # Security Fix Part 2: Optimize RLS Auth Functions
  
  1. Problem
    - RLS policies call auth.uid() directly for each row
    - This re-evaluates the function for every row checked
    - Causes poor performance at scale
  
  2. Solution
    - Wrap auth.uid() in SELECT subquery: (select auth.uid())
    - PostgreSQL evaluates it once and caches the result
    - Dramatically improves performance for large datasets
  
  3. Tables Fixed
    - users
    - message_attachments
    - user_storage_quota
    - conversations
    - conversation_participants
*/

-- Fix users table RLS policies
DROP POLICY IF EXISTS "Users can delete own account" ON users;
CREATE POLICY "Users can delete own account"
  ON users
  FOR DELETE
  TO authenticated
  USING (id = (select auth.uid()));

-- Fix message_attachments table RLS policies
DROP POLICY IF EXISTS "Users can create attachments for their messages" ON message_attachments;
CREATE POLICY "Users can create attachments for their messages"
  ON message_attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own attachments" ON message_attachments;
CREATE POLICY "Users can delete their own attachments"
  ON message_attachments
  FOR DELETE
  TO authenticated
  USING (uploaded_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view attachments of their messages" ON message_attachments;
CREATE POLICY "Users can view attachments of their messages"
  ON message_attachments
  FOR SELECT
  TO authenticated
  USING (
    uploaded_by = (select auth.uid())
    OR EXISTS (
      SELECT 1
      FROM messages m
      INNER JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
      WHERE m.id = message_attachments.message_id
      AND cp.user_id = (select auth.uid())
    )
  );

-- Fix user_storage_quota table RLS policies
DROP POLICY IF EXISTS "System can insert storage quota" ON user_storage_quota;
CREATE POLICY "System can insert storage quota"
  ON user_storage_quota
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own storage quota" ON user_storage_quota;
CREATE POLICY "Users can update own storage quota"
  ON user_storage_quota
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view own storage quota" ON user_storage_quota;
CREATE POLICY "Users can view own storage quota"
  ON user_storage_quota
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Fix conversations table RLS policy
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
CREATE POLICY "Users can view conversations they participate in"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    user_is_conversation_participant(id, (select auth.uid()))
  );

-- Fix conversation_participants table RLS policies
DROP POLICY IF EXISTS "Conversation creators can add participants" ON conversation_participants;
CREATE POLICY "Conversation creators can add participants"
  ON conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = conversation_id
      AND c.created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participants can view all members of their conversations" ON conversation_participants;
CREATE POLICY "Participants can view all members of their conversations"
  ON conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    user_is_conversation_participant(conversation_id, (select auth.uid()))
  );

DROP POLICY IF EXISTS "Users can leave or creators can remove participants" ON conversation_participants;
CREATE POLICY "Users can leave or creators can remove participants"
  ON conversation_participants
  FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1
      FROM conversations c
      WHERE c.id = conversation_id
      AND c.created_by = (select auth.uid())
    )
  );
