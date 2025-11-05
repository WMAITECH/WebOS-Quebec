/*
  # Fix Security and Performance Issues - Part 5: Function Search Path

  ## Changes
  Fix update_conversation_timestamp function to use immutable search_path

  ## Security Impact
  Prevents potential security vulnerabilities from mutable search_path
  Function will always use public schema explicitly

  ## Tables Affected
  - conversations (via trigger on messages table)
*/

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS messages_update_conversation_timestamp ON messages;
DROP FUNCTION IF EXISTS update_conversation_timestamp() CASCADE;

-- Recreate with fixed search_path
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_conversation_timestamp() IS 
  'Updates conversation timestamp when new message is inserted. Uses immutable search_path for security.';

-- Recreate trigger
CREATE TRIGGER messages_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
