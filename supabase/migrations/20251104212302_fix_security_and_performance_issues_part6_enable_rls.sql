/*
  # Fix Security and Performance Issues - Part 6: Enable RLS

  ## Changes
  Enable RLS on ai_email_response_queue table

  ## Security Impact
  Prevents unauthorized access to AI email response queue
  Users can only access queue entries for their own emails

  ## Tables Updated
  - ai_email_response_queue
*/

-- Enable RLS
ALTER TABLE ai_email_response_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for AI system to manage response queue
-- Users can only see/manage queue entries for their own emails
CREATE POLICY "Users can manage their email response queue"
  ON ai_email_response_queue FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM emails e
      JOIN email_accounts ea ON ea.id = e.account_id
      WHERE e.id = ai_email_response_queue.email_id
        AND ea.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM emails e
      JOIN email_accounts ea ON ea.id = e.account_id
      WHERE e.id = ai_email_response_queue.email_id
        AND ea.user_id = (select auth.uid())
    )
  );

COMMENT ON POLICY "Users can manage their email response queue" ON ai_email_response_queue IS
  'Users can only access AI response queue entries for emails in their own email accounts';
