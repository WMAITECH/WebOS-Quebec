/*
  # Fix Security and Performance Issues - Part 1: Indexes

  ## Changes
  Add missing foreign key indexes for better query performance

  ## Tables Updated
  - ai_email_response_queue
  - api_keys
  - audit_logs
  - conversations
  - crawl_queue
  - emails
  - rate_limits
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_ai_email_response_queue_email_id 
  ON ai_email_response_queue(email_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id 
  ON api_keys(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id 
  ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
  ON conversations(created_by);

CREATE INDEX IF NOT EXISTS idx_crawl_queue_source_id 
  ON crawl_queue(source_id);

CREATE INDEX IF NOT EXISTS idx_emails_in_reply_to 
  ON emails(in_reply_to);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id 
  ON rate_limits(user_id);
