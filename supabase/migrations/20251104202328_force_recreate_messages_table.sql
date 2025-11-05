/*
  # Force Recreate Messages Table

  ## Purpose
  Force drop and recreate the messages table with the correct simple structure.
  The table currently has fields like topic, extension, event, payload which are
  incompatible with the frontend code.

  ## Changes
  1. Drop message_receipts first (depends on messages)
  2. Force drop messages table with CASCADE
  3. Recreate messages with simple structure (id, conversation_id, sender_id, content, created_at, edited, deleted)
  4. Recreate message_receipts
  5. Recreate all indexes and policies

  ## Security
  - Maintain all RLS policies
  - Ensure users can only access their messages
*/

-- Step 1: Drop dependent tables
DROP TABLE IF EXISTS message_receipts CASCADE;

-- Step 2: Force drop messages table
DROP TABLE IF EXISTS messages CASCADE;

-- Step 3: Recreate messages table with correct simple structure
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  edited boolean DEFAULT false,
  deleted boolean DEFAULT false
);

-- Step 4: Recreate message_receipts table
CREATE TABLE message_receipts (
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- Step 5: Create indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_message_receipts_message ON message_receipts(message_id);
CREATE INDEX idx_message_receipts_user ON message_receipts(user_id);

-- Step 6: Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_receipts ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Step 8: RLS Policies for message_receipts
CREATE POLICY "Users can view message receipts"
  ON message_receipts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_receipts.message_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON message_receipts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Step 9: Recreate trigger
DROP TRIGGER IF EXISTS update_conversation_on_message ON messages;

CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();
