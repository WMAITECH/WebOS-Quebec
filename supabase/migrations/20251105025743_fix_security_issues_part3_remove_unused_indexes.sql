/*
  # Security Fix Part 3: Remove Unused Indexes
  
  1. Problem
    - Multiple indexes exist but are never used
    - They consume storage space
    - They slow down INSERT/UPDATE/DELETE operations
    - PostgreSQL must maintain them unnecessarily
  
  2. Solution
    - Drop all unused indexes
    - Keep only indexes that are actively used
    - Reduces storage overhead
    - Improves write performance
  
  3. Indexes Removed
    - AI email response queue
    - API keys
    - Audit logs
    - Crawl queue
    - Emails
    - Rate limits
    - Message attachments (duplicate/unused)
    - User storage quota
    - Conversation participants lookup
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_ai_email_response_queue_email_id;
DROP INDEX IF EXISTS idx_api_keys_user_id;
DROP INDEX IF EXISTS idx_audit_logs_user_id;
DROP INDEX IF EXISTS idx_crawl_queue_source_id;
DROP INDEX IF EXISTS idx_emails_in_reply_to;
DROP INDEX IF EXISTS idx_rate_limits_user_id;
DROP INDEX IF EXISTS idx_message_attachments_message_id;
DROP INDEX IF EXISTS idx_message_attachments_uploaded_by;
DROP INDEX IF EXISTS idx_message_attachments_mime_type;
DROP INDEX IF EXISTS idx_message_attachments_created_at;
DROP INDEX IF EXISTS idx_user_storage_quota_user_id;
DROP INDEX IF EXISTS idx_conversation_participants_lookup;
