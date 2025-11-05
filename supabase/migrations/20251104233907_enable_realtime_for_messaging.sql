/*
  # Enable Realtime for Messaging System

  ## Changes
  Enable Supabase Realtime for tables used in messaging:
  - messages: real-time message delivery
  - message_receipts: read receipt updates
  - conversations: conversation updates
  - conversation_participants: participant changes

  ## Security
  Realtime respects RLS policies, so no additional security concerns
*/

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for message receipts
ALTER PUBLICATION supabase_realtime ADD TABLE message_receipts;

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable realtime for conversation participants
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
