/*
  # AI Email Auto-Responder System

  ## Purpose
  Automatically trigger AI responses when emails are sent to AI assistant accounts

  ## Changes
  - Create function to call the ai-email-responder edge function
  - Create trigger to automatically respond to emails sent to AI accounts
  - Adds delay mechanism to make responses more realistic (2-5 seconds)

  ## Security
  - Uses pg_net extension for HTTP requests
  - Service role key is used server-side
*/

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create function to trigger AI email response
CREATE OR REPLACE FUNCTION trigger_ai_email_response()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  ai_emails text[] := ARRAY['ai.support@quebec.gouv.qc.ca', 'ai.info@quebec.gouv.qc.ca', 'ai.conseiller@quebec.gouv.qc.ca'];
  supabase_url text;
  request_id bigint;
BEGIN
  -- Only process emails sent to AI accounts in their inbox folder
  IF NEW.folder = 'inbox' AND NEW.to_addresses && ai_emails THEN
    
    -- Get the Supabase URL from environment
    supabase_url := current_setting('app.settings.supabase_url', true);
    
    IF supabase_url IS NULL THEN
      supabase_url := 'http://localhost:54321';
    END IF;

    -- Call the edge function asynchronously (after a small delay)
    PERFORM pg_sleep(random() * 3 + 2); -- Random delay between 2-5 seconds
    
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/ai-email-responder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'emailId', NEW.id
      )
    ) INTO request_id;

    RAISE LOG 'AI email responder triggered for email % with request_id %', NEW.id, request_id;
    
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to trigger AI email response for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_ai_email_auto_response ON emails;

-- Create trigger that fires after email insert
CREATE TRIGGER trigger_ai_email_auto_response
  AFTER INSERT ON emails
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_email_response();

-- Create a simpler version that doesn't rely on pg_net if it fails
-- This version uses a scheduled job approach instead

-- Create a table to queue AI email responses
CREATE TABLE IF NOT EXISTS ai_email_response_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ai_email_queue_status ON ai_email_response_queue(status, created_at);

-- Alternative trigger that queues responses
CREATE OR REPLACE FUNCTION queue_ai_email_response()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  ai_emails text[] := ARRAY['ai.support@quebec.gouv.qc.ca', 'ai.info@quebec.gouv.qc.ca', 'ai.conseiller@quebec.gouv.qc.ca'];
  recipient_account record;
BEGIN
  -- Check if email is sent to an AI account
  FOR recipient_account IN 
    SELECT ea.id, ea.email_address
    FROM email_accounts ea
    WHERE ea.id = NEW.account_id
      AND ea.email_address = ANY(ai_emails)
      AND NEW.folder = 'inbox'
  LOOP
    -- Queue this email for AI response
    INSERT INTO ai_email_response_queue (email_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
    
    RAISE LOG 'Queued AI response for email % to account %', NEW.id, recipient_account.email_address;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS trigger_queue_ai_email_response ON emails;

CREATE TRIGGER trigger_queue_ai_email_response
  AFTER INSERT ON emails
  FOR EACH ROW
  EXECUTE FUNCTION queue_ai_email_response();
