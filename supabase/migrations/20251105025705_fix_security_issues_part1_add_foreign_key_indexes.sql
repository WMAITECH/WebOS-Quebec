/*
  # Security Fix Part 1: Add Foreign Key Indexes
  
  1. Problem
    - Multiple tables have foreign keys without covering indexes
    - This causes suboptimal query performance
    - Foreign key lookups and joins are slow
  
  2. Solution
    - Add indexes for all unindexed foreign keys
    - Improves JOIN performance
    - Speeds up foreign key constraint checks
  
  3. Performance Impact
    - Significantly faster queries involving these relationships
    - Better query plan optimization
    - Reduced I/O operations
*/

-- AI tables
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id 
  ON ai_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_embeddings_user_id 
  ON ai_embeddings(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_syntheses_query_id 
  ON ai_syntheses(query_id);

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_citizen_id 
  ON appointments(citizen_id);

CREATE INDEX IF NOT EXISTS idx_appointments_department_id 
  ON appointments(department_id);

-- Audit trail
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id 
  ON audit_trail(user_id);

-- Email attachments
CREATE INDEX IF NOT EXISTS idx_email_attachments_email_id 
  ON email_attachments(email_id);

CREATE INDEX IF NOT EXISTS idx_email_attachments_uploaded_by 
  ON email_attachments(uploaded_by);

-- Email labels
CREATE INDEX IF NOT EXISTS idx_email_label_assignments_label_id 
  ON email_label_assignments(label_id);

-- File shares
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id 
  ON file_shares(file_id);

CREATE INDEX IF NOT EXISTS idx_file_shares_shared_by 
  ON file_shares(shared_by);

CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with 
  ON file_shares(shared_with);

-- File versions
CREATE INDEX IF NOT EXISTS idx_file_versions_created_by 
  ON file_versions(created_by);

CREATE INDEX IF NOT EXISTS idx_file_versions_file_id 
  ON file_versions(file_id);

-- Files metadata
CREATE INDEX IF NOT EXISTS idx_files_metadata_parent_id 
  ON files_metadata(parent_id);

-- Government documents
CREATE INDEX IF NOT EXISTS idx_government_documents_citizen_id 
  ON government_documents(citizen_id);

CREATE INDEX IF NOT EXISTS idx_government_documents_department_id 
  ON government_documents(department_id);

-- Indexed pages
CREATE INDEX IF NOT EXISTS idx_indexed_pages_source_id 
  ON indexed_pages(source_id);

-- Message receipts
CREATE INDEX IF NOT EXISTS idx_message_receipts_user_id 
  ON message_receipts(user_id);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
  ON messages(sender_id);

-- Process logs
CREATE INDEX IF NOT EXISTS idx_process_logs_user_id 
  ON process_logs(user_id);

-- Process metrics
CREATE INDEX IF NOT EXISTS idx_process_metrics_process_id 
  ON process_metrics(process_id);

-- Secure messages
CREATE INDEX IF NOT EXISTS idx_secure_messages_recipient_id 
  ON secure_messages(recipient_id);

CREATE INDEX IF NOT EXISTS idx_secure_messages_request_id 
  ON secure_messages(request_id);

CREATE INDEX IF NOT EXISTS idx_secure_messages_sender_id 
  ON secure_messages(sender_id);

-- Service requests
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_to 
  ON service_requests(assigned_to);

CREATE INDEX IF NOT EXISTS idx_service_requests_citizen_id 
  ON service_requests(citizen_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_department_id 
  ON service_requests(department_id);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id 
  ON sessions(user_id);

-- Telemetry
CREATE INDEX IF NOT EXISTS idx_telemetry_user_id 
  ON telemetry(user_id);

-- Threat events
CREATE INDEX IF NOT EXISTS idx_threat_events_user_id 
  ON threat_events(user_id);

-- WebAuthn credentials
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id 
  ON webauthn_credentials(user_id);
