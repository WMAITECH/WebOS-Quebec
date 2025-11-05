/*
  # Fix Security and Performance Issues - Part 2: Auth RLS Initialization

  ## Changes
  Replace auth.uid() with (select auth.uid()) to prevent re-evaluation for each row

  ## Tables Updated
  - conversations (3 policies)
  - users (1 policy)
  - emails (2 policies)
  - message_receipts (2 policies)
  - conversation_participants (3 policies)
  - messages (3 policies)

  ## Performance Impact
  Significant improvement for queries on large tables by evaluating auth.uid() once
  instead of per-row
*/

-- =====================================================
-- CONVERSATIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id 
        AND cp.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id 
        AND cp.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id 
        AND cp.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- USERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- =====================================================
-- EMAILS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can send emails from their accounts" ON emails;
DROP POLICY IF EXISTS "Users can view their emails" ON emails;

CREATE POLICY "Users can send emails from their accounts"
  ON emails FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_accounts ea
      WHERE ea.id = emails.account_id
        AND ea.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can view their emails"
  ON emails FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM email_accounts ea
      WHERE ea.id = emails.account_id
        AND ea.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- MESSAGE_RECEIPTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can mark messages as read" ON message_receipts;
DROP POLICY IF EXISTS "Users can view message receipts" ON message_receipts;

CREATE POLICY "Users can mark messages as read"
  ON message_receipts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view message receipts"
  ON message_receipts FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_receipts.message_id
        AND m.sender_id = (select auth.uid())
    )
  );

-- =====================================================
-- CONVERSATION_PARTICIPANTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can add participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can remove participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view participants" ON conversation_participants;

CREATE POLICY "Users can add participants"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND (
          c.created_by = (select auth.uid())
          OR EXISTS (
            SELECT 1 FROM conversation_participants cp
            WHERE cp.conversation_id = c.id
              AND cp.user_id = (select auth.uid())
          )
        )
    )
  );

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

CREATE POLICY "Users can view participants"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- MESSAGES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = (select auth.uid()))
  WITH CHECK (sender_id = (select auth.uid()));
