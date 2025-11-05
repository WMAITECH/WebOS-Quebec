/*
  # Fix Security and Performance Issues - Part 3: Remove Unused Indexes

  ## Changes
  Drop indexes that have not been used to reduce storage overhead

  ## Indexes Removed (30 total)
  - Message-related: 2 indexes
  - AI-related: 3 indexes
  - Appointments: 2 indexes
  - Audit trail: 1 index
  - Email-related: 2 indexes
  - File management: 5 indexes
  - Government documents: 2 indexes
  - OSINT: 1 index
  - Process monitoring: 2 indexes
  - Secure messages: 3 indexes
  - Service requests: 3 indexes
  - Sessions: 1 index
  - Telemetry: 1 index
  - Security: 1 index
  - WebAuthn: 1 index
  - Notifications: 1 index

  ## Performance Impact
  Reduces storage usage and write overhead
*/

-- Message-related indexes
DROP INDEX IF EXISTS idx_messages_sender;
DROP INDEX IF EXISTS idx_message_receipts_user;

-- AI-related indexes
DROP INDEX IF EXISTS idx_ai_conversations_user_id;
DROP INDEX IF EXISTS idx_ai_embeddings_user_id;
DROP INDEX IF EXISTS idx_ai_syntheses_query_id;

-- Appointments
DROP INDEX IF EXISTS idx_appointments_citizen_id;
DROP INDEX IF EXISTS idx_appointments_department_id;

-- Audit trail
DROP INDEX IF EXISTS idx_audit_trail_user_id;

-- Email-related
DROP INDEX IF EXISTS idx_email_attachments_email_id;
DROP INDEX IF EXISTS idx_email_label_assignments_label_id;

-- File management
DROP INDEX IF EXISTS idx_file_shares_file_id;
DROP INDEX IF EXISTS idx_file_shares_shared_by;
DROP INDEX IF EXISTS idx_file_shares_shared_with;
DROP INDEX IF EXISTS idx_file_versions_created_by;
DROP INDEX IF EXISTS idx_file_versions_file_id;
DROP INDEX IF EXISTS idx_files_metadata_parent_id;

-- Government documents
DROP INDEX IF EXISTS idx_government_documents_citizen_id;
DROP INDEX IF EXISTS idx_government_documents_department_id;

-- OSINT
DROP INDEX IF EXISTS idx_indexed_pages_source_id;

-- Process monitoring
DROP INDEX IF EXISTS idx_process_logs_user_id;
DROP INDEX IF EXISTS idx_process_metrics_process_id;

-- Secure messages
DROP INDEX IF EXISTS idx_secure_messages_recipient_id;
DROP INDEX IF EXISTS idx_secure_messages_request_id;
DROP INDEX IF EXISTS idx_secure_messages_sender_id;

-- Service requests
DROP INDEX IF EXISTS idx_service_requests_assigned_to;
DROP INDEX IF EXISTS idx_service_requests_citizen_id;
DROP INDEX IF EXISTS idx_service_requests_department_id;

-- Sessions
DROP INDEX IF EXISTS idx_sessions_user_id;

-- Telemetry
DROP INDEX IF EXISTS idx_telemetry_user_id;

-- Security
DROP INDEX IF EXISTS idx_threat_events_user_id;

-- WebAuthn
DROP INDEX IF EXISTS idx_webauthn_credentials_user_id;

-- Notifications
DROP INDEX IF EXISTS idx_notifications_user_active;
