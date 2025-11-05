/*
  # Fix Performance and Security Issues - Part 3: Remove Unused Indexes

  1. Performance Improvements
    - Remove 26 unused indexes that are never used
    - Unused indexes slow down INSERT/UPDATE/DELETE operations
    - They consume storage space without providing query benefits
    
  2. Removed Indexes
    - user_profiles: idx_user_profiles_email, idx_user_profiles_role, idx_user_profiles_active
    - api_keys: idx_api_keys_user_id, idx_api_keys_hash, idx_api_keys_active
    - user_quotas: idx_user_quotas_user_id, idx_user_quotas_reset
    - rate_limits: 6 indexes (user_id, ip, endpoint, window, composite, ip_composite)
    - audit_logs: 5 indexes (user_id, action, resource, created_at, status)
    - sms_verifications: idx_sms_verifications_phone
    - users: idx_users_phone
    - conversations: idx_conversations_type
    - messages: idx_messages_conversation
    - message_receipts: idx_message_receipts_message
    - crawl_queue: idx_crawl_queue_source_id
    - emails: idx_emails_in_reply_to

  3. Notes
    - These indexes have not been used and are safe to remove
    - Removing them improves write performance and reduces storage
    - Can be re-added later if usage patterns change
*/

-- User Profiles
DROP INDEX IF EXISTS public.idx_user_profiles_email;
DROP INDEX IF EXISTS public.idx_user_profiles_role;
DROP INDEX IF EXISTS public.idx_user_profiles_active;

-- API Keys
DROP INDEX IF EXISTS public.idx_api_keys_user_id;
DROP INDEX IF EXISTS public.idx_api_keys_hash;
DROP INDEX IF EXISTS public.idx_api_keys_active;

-- User Quotas
DROP INDEX IF EXISTS public.idx_user_quotas_user_id;
DROP INDEX IF EXISTS public.idx_user_quotas_reset;

-- Rate Limits
DROP INDEX IF EXISTS public.idx_rate_limits_user_id;
DROP INDEX IF EXISTS public.idx_rate_limits_ip;
DROP INDEX IF EXISTS public.idx_rate_limits_endpoint;
DROP INDEX IF EXISTS public.idx_rate_limits_window;
DROP INDEX IF EXISTS public.idx_rate_limits_composite;
DROP INDEX IF EXISTS public.idx_rate_limits_ip_composite;

-- Audit Logs
DROP INDEX IF EXISTS public.idx_audit_logs_user_id;
DROP INDEX IF EXISTS public.idx_audit_logs_action;
DROP INDEX IF EXISTS public.idx_audit_logs_resource;
DROP INDEX IF EXISTS public.idx_audit_logs_created_at;
DROP INDEX IF EXISTS public.idx_audit_logs_status;

-- SMS Verifications
DROP INDEX IF EXISTS public.idx_sms_verifications_phone;

-- Users
DROP INDEX IF EXISTS public.idx_users_phone;

-- Conversations
DROP INDEX IF EXISTS public.idx_conversations_type;

-- Messages
DROP INDEX IF EXISTS public.idx_messages_conversation;

-- Message Receipts
DROP INDEX IF EXISTS public.idx_message_receipts_message;

-- Crawl Queue
DROP INDEX IF EXISTS public.idx_crawl_queue_source_id;

-- Emails
DROP INDEX IF EXISTS public.idx_emails_in_reply_to;
