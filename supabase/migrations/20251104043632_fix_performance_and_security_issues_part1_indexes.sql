/*
  # Fix Performance and Security Issues - Part 1: Add Missing Indexes

  1. Performance Improvements
    - Add indexes for all unindexed foreign keys (32 indexes)
    - This significantly improves JOIN performance and foreign key constraint checks
    
  2. New Indexes
    - ai_conversations: user_id
    - ai_embeddings: user_id
    - ai_syntheses: query_id
    - appointments: citizen_id, department_id
    - audit_trail: user_id
    - conversations: created_by
    - email_attachments: email_id
    - email_label_assignments: label_id
    - emails: account_id
    - file_shares: file_id, shared_by, shared_with
    - file_versions: created_by, file_id
    - files_metadata: parent_id
    - government_documents: citizen_id, department_id
    - indexed_pages: source_id
    - message_receipts: user_id
    - process_logs: user_id
    - process_metrics: process_id
    - secure_messages: recipient_id, request_id, sender_id
    - service_requests: assigned_to, citizen_id, department_id
    - sessions: user_id
    - telemetry: user_id
    - threat_events: user_id
    - webauthn_credentials: user_id

  3. Notes
    - These indexes are essential for query performance at scale
    - Foreign keys without indexes cause full table scans during JOINs
*/

-- AI Conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id 
  ON public.ai_conversations(user_id);

-- AI Embeddings
CREATE INDEX IF NOT EXISTS idx_ai_embeddings_user_id 
  ON public.ai_embeddings(user_id);

-- AI Syntheses
CREATE INDEX IF NOT EXISTS idx_ai_syntheses_query_id 
  ON public.ai_syntheses(query_id);

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_citizen_id 
  ON public.appointments(citizen_id);

CREATE INDEX IF NOT EXISTS idx_appointments_department_id 
  ON public.appointments(department_id);

-- Audit Trail
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id 
  ON public.audit_trail(user_id);

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_created_by 
  ON public.conversations(created_by);

-- Email Attachments
CREATE INDEX IF NOT EXISTS idx_email_attachments_email_id 
  ON public.email_attachments(email_id);

-- Email Label Assignments
CREATE INDEX IF NOT EXISTS idx_email_label_assignments_label_id 
  ON public.email_label_assignments(label_id);

-- Emails
CREATE INDEX IF NOT EXISTS idx_emails_account_id 
  ON public.emails(account_id);

-- File Shares
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id 
  ON public.file_shares(file_id);

CREATE INDEX IF NOT EXISTS idx_file_shares_shared_by 
  ON public.file_shares(shared_by);

CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with 
  ON public.file_shares(shared_with);

-- File Versions
CREATE INDEX IF NOT EXISTS idx_file_versions_created_by 
  ON public.file_versions(created_by);

CREATE INDEX IF NOT EXISTS idx_file_versions_file_id 
  ON public.file_versions(file_id);

-- Files Metadata
CREATE INDEX IF NOT EXISTS idx_files_metadata_parent_id 
  ON public.files_metadata(parent_id);

-- Government Documents
CREATE INDEX IF NOT EXISTS idx_government_documents_citizen_id 
  ON public.government_documents(citizen_id);

CREATE INDEX IF NOT EXISTS idx_government_documents_department_id 
  ON public.government_documents(department_id);

-- Indexed Pages
CREATE INDEX IF NOT EXISTS idx_indexed_pages_source_id 
  ON public.indexed_pages(source_id);

-- Message Receipts
CREATE INDEX IF NOT EXISTS idx_message_receipts_user_id 
  ON public.message_receipts(user_id);

-- Process Logs
CREATE INDEX IF NOT EXISTS idx_process_logs_user_id 
  ON public.process_logs(user_id);

-- Process Metrics
CREATE INDEX IF NOT EXISTS idx_process_metrics_process_id 
  ON public.process_metrics(process_id);

-- Secure Messages
CREATE INDEX IF NOT EXISTS idx_secure_messages_recipient_id 
  ON public.secure_messages(recipient_id);

CREATE INDEX IF NOT EXISTS idx_secure_messages_request_id 
  ON public.secure_messages(request_id);

CREATE INDEX IF NOT EXISTS idx_secure_messages_sender_id 
  ON public.secure_messages(sender_id);

-- Service Requests
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_to 
  ON public.service_requests(assigned_to);

CREATE INDEX IF NOT EXISTS idx_service_requests_citizen_id 
  ON public.service_requests(citizen_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_department_id 
  ON public.service_requests(department_id);

-- Sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id 
  ON public.sessions(user_id);

-- Telemetry
CREATE INDEX IF NOT EXISTS idx_telemetry_user_id 
  ON public.telemetry(user_id);

-- Threat Events
CREATE INDEX IF NOT EXISTS idx_threat_events_user_id 
  ON public.threat_events(user_id);

-- Webauthn Credentials
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id 
  ON public.webauthn_credentials(user_id);
