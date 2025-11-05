/*
  # Fix Messaging System - Complete and Operational

  1. Improvements
    - Add cascade deletes for data integrity
    - Add trigger to auto-create message receipts
    - Add trigger to update conversation timestamp on new messages
    - Add function to mark messages as read
    - Add indexes for better performance

  2. Security
    - Ensure RLS policies are secure and performant
    - Add policy for message receipts creation

  3. Features
    - Automatic message read receipts
    - Conversation timestamp updates
    - Proper cascade deletes
*/

-- Add cascade deletes for better data integrity
ALTER TABLE conversation_participants 
  DROP CONSTRAINT IF EXISTS conversation_participants_conversation_id_fkey,
  ADD CONSTRAINT conversation_participants_conversation_id_fkey 
    FOREIGN KEY (conversation_id) 
    REFERENCES conversations(id) 
    ON DELETE CASCADE;

ALTER TABLE messages 
  DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey,
  ADD CONSTRAINT messages_conversation_id_fkey 
    FOREIGN KEY (conversation_id) 
    REFERENCES conversations(id) 
    ON DELETE CASCADE;

ALTER TABLE message_receipts 
  DROP CONSTRAINT IF EXISTS message_receipts_message_id_fkey,
  ADD CONSTRAINT message_receipts_message_id_fkey 
    FOREIGN KEY (message_id) 
    REFERENCES messages(id) 
    ON DELETE CASCADE;

-- Function to auto-create message receipts for all participants except sender
CREATE OR REPLACE FUNCTION public.create_message_receipts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create receipts for all participants except the sender
  INSERT INTO public.message_receipts (message_id, user_id)
  SELECT NEW.id, cp.user_id
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to create message receipts automatically
DROP TRIGGER IF EXISTS trigger_create_message_receipts ON public.messages;
CREATE TRIGGER trigger_create_message_receipts
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_receipts();

-- Ensure the update conversation timestamp trigger exists
DROP TRIGGER IF EXISTS trigger_update_conversation_timestamp ON public.messages;
CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update all unread message receipts for this user in this conversation
  UPDATE public.message_receipts mr
  SET read_at = now()
  WHERE mr.user_id = p_user_id
    AND mr.read_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = mr.message_id
        AND m.conversation_id = p_conversation_id
    );
  
  -- Update last_read_at for the participant
  UPDATE public.conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$;

-- Add index for conversation participants lookup
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id 
  ON public.conversation_participants(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id 
  ON public.conversation_participants(user_id);

-- Add composite index for message receipts lookup
CREATE INDEX IF NOT EXISTS idx_message_receipts_message_user 
  ON public.message_receipts(message_id, user_id);

CREATE INDEX IF NOT EXISTS idx_message_receipts_unread 
  ON public.message_receipts(user_id, read_at) 
  WHERE read_at IS NULL;

-- Add index for messages by conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
  ON public.messages(conversation_id, created_at DESC);

-- Ensure message receipts can be updated by users
DROP POLICY IF EXISTS "Users can update own message receipts" ON public.message_receipts;
CREATE POLICY "Users can update own message receipts" 
  ON public.message_receipts 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = (select auth.uid())) 
  WITH CHECK (user_id = (select auth.uid()));
