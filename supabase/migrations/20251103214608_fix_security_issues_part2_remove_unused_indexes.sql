/*
  # Security Fixes - Part 2: Remove Unused Indexes
  
  ## Overview
  This migration removes all unused indexes to reduce maintenance overhead and improve write performance.
  
  ## Indexes Being Removed
  - All indexes that are not actively used by queries
  - This improves INSERT/UPDATE/DELETE performance
  - Reduces database maintenance overhead
*/

-- ============================================
-- REMOVE UNUSED INDEXES
-- ============================================

-- Government and appointments indexes
DROP INDEX IF EXISTS idx_government_documents_department_id;
DROP INDEX IF EXISTS idx_government_documents_document_type;
DROP INDEX IF EXISTS idx_government_documents_citizen_id;
DROP INDEX IF EXISTS idx_appointments_citizen_id;
DROP INDEX IF EXISTS idx_appointments_department_id;
DROP INDEX IF EXISTS idx_appointments_scheduled_at;
DROP INDEX IF EXISTS idx_appointments_status;

-- Telemetry and monitoring indexes
DROP INDEX IF EXISTS idx_telemetry_metric_time;
DROP INDEX IF EXISTS idx_telemetry_user_id;

-- Application and session indexes
DROP INDEX IF EXISTS idx_apps_user;
DROP INDEX IF EXISTS idx_apps_system;
DROP INDEX IF EXISTS idx_sessions_user_id;

-- AI and embeddings indexes
DROP INDEX IF EXISTS idx_ai_embeddings_user_id;
DROP INDEX IF EXISTS idx_ai_conv_user;

-- File system indexes
DROP INDEX IF EXISTS idx_file_shares_file_id;
DROP INDEX IF EXISTS idx_file_shares_shared_by;
DROP INDEX IF EXISTS idx_file_shares_shared_with;
DROP INDEX IF EXISTS idx_file_versions_file_id;
DROP INDEX IF EXISTS idx_file_versions_created_by;
DROP INDEX IF EXISTS idx_files_user_path;
DROP INDEX IF EXISTS idx_files_parent;

-- Process and security indexes
DROP INDEX IF EXISTS idx_process_metrics_process_id;
DROP INDEX IF EXISTS idx_process_user_status;
DROP INDEX IF EXISTS idx_threat_events_user_id;
DROP INDEX IF EXISTS idx_webauthn_credentials_user_id;

-- Audit trail indexes
DROP INDEX IF EXISTS idx_audit_user_action;
DROP INDEX IF EXISTS idx_audit_created;

-- Citizen profiles and services indexes
DROP INDEX IF EXISTS idx_citizen_profiles_user_id;
DROP INDEX IF EXISTS idx_service_requests_citizen_id;
DROP INDEX IF EXISTS idx_service_requests_department_id;
DROP INDEX IF EXISTS idx_service_requests_assigned_to;
DROP INDEX IF EXISTS idx_service_requests_status;
DROP INDEX IF EXISTS idx_service_requests_submitted_at;

-- Secure messages indexes
DROP INDEX IF EXISTS idx_secure_messages_request_id;
DROP INDEX IF EXISTS idx_secure_messages_sender_id;
DROP INDEX IF EXISTS idx_secure_messages_recipient_id;
DROP INDEX IF EXISTS idx_secure_messages_created_at;

-- Notification indexes
DROP INDEX IF EXISTS idx_notif_read;

-- Email system indexes
DROP INDEX IF EXISTS idx_email_accounts_email_address;
DROP INDEX IF EXISTS idx_emails_account_id;
DROP INDEX IF EXISTS idx_emails_folder;
DROP INDEX IF EXISTS idx_emails_is_read;
DROP INDEX IF EXISTS idx_emails_is_starred;
DROP INDEX IF EXISTS idx_emails_is_deleted;
DROP INDEX IF EXISTS idx_emails_thread_id;
DROP INDEX IF EXISTS idx_emails_sent_at;
DROP INDEX IF EXISTS idx_emails_created_at;
DROP INDEX IF EXISTS idx_emails_from_address;
DROP INDEX IF EXISTS idx_emails_to_addresses;
DROP INDEX IF EXISTS idx_email_attachments_email_id;
DROP INDEX IF EXISTS idx_email_labels_account_id;
DROP INDEX IF EXISTS idx_email_label_assignments_email_id;
DROP INDEX IF EXISTS idx_email_label_assignments_label_id;

-- OSINT search engine indexes
DROP INDEX IF EXISTS idx_search_queries_geo;
DROP INDEX IF EXISTS idx_indexed_pages_geo;
DROP INDEX IF EXISTS idx_ai_syntheses_geo;
DROP INDEX IF EXISTS idx_trusted_sources_domain;
DROP INDEX IF EXISTS idx_trusted_sources_category;
DROP INDEX IF EXISTS idx_trusted_sources_active;
DROP INDEX IF EXISTS idx_indexed_pages_url;
DROP INDEX IF EXISTS idx_indexed_pages_source_id;
DROP INDEX IF EXISTS idx_indexed_pages_content_hash;
DROP INDEX IF EXISTS idx_indexed_pages_status;
DROP INDEX IF EXISTS idx_indexed_pages_published_at;
DROP INDEX IF EXISTS idx_indexed_pages_title_trgm;
DROP INDEX IF EXISTS idx_indexed_pages_content_trgm;
DROP INDEX IF EXISTS idx_page_embeddings_vector;
DROP INDEX IF EXISTS idx_search_queries_created_at;
DROP INDEX IF EXISTS idx_ai_syntheses_query_id;
DROP INDEX IF EXISTS idx_ai_syntheses_source_page_ids;
DROP INDEX IF EXISTS idx_crawl_queue_status;
DROP INDEX IF EXISTS idx_crawl_queue_priority;
DROP INDEX IF EXISTS idx_crawl_queue_scheduled_for;
