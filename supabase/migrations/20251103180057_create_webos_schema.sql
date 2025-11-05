/*
  # WebOS Québec - Comprehensive Database Schema

  ## Overview
  Complete database schema for the WebOS Québec governmental operating system.
  This migration creates all necessary tables for user management, file system,
  process monitoring, AI conversations, security, and observability.

  ## New Tables

  ### 1. Users & Authentication
    - `users` - Extended user profiles with metadata
    - `sessions` - Active session tracking
    - `webauthn_credentials` - Hardware security keys

  ### 2. File System
    - `files_metadata` - OPFS file metadata with encryption info
    - `file_versions` - File versioning system
    - `file_shares` - File sharing and permissions

  ### 3. Process Management
    - `process_logs` - Worker process execution history
    - `process_metrics` - Performance metrics per process

  ### 4. AI & ML
    - `ai_conversations` - WebLLM chat history
    - `ai_embeddings` - Text embeddings for RAG
    - `ai_model_cache` - Model loading statistics

  ### 5. Security & Audit
    - `audit_trail` - Immutable security audit log
    - `security_policies` - Dynamic security policies
    - `threat_events` - Security event tracking

  ### 6. System Configuration
    - `system_settings` - User preferences and config
    - `notifications` - Notification queue
    - `telemetry` - System performance metrics

  ## Security
    - RLS enabled on all tables
    - Restrictive policies requiring authentication
    - Row-level isolation by user_id or org_id
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  organization_id uuid,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  preferences jsonb DEFAULT '{}',
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  device_info jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- WebAuthn credentials
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  credential_id text UNIQUE NOT NULL,
  public_key text NOT NULL,
  counter bigint DEFAULT 0,
  device_name text,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own credentials"
  ON webauthn_credentials FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FILE SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS files_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  path text NOT NULL,
  name text NOT NULL,
  size bigint DEFAULT 0,
  mime_type text,
  encryption_key_id text,
  checksum text,
  is_directory boolean DEFAULT false,
  parent_id uuid REFERENCES files_metadata(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, path)
);

ALTER TABLE files_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own files"
  ON files_metadata FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_files_user_path ON files_metadata(user_id, path);
CREATE INDEX IF NOT EXISTS idx_files_parent ON files_metadata(parent_id);

-- File versions
CREATE TABLE IF NOT EXISTS file_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES files_metadata(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  size bigint NOT NULL,
  checksum text NOT NULL,
  changes_summary text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of own files"
  ON file_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM files_metadata
      WHERE files_metadata.id = file_versions.file_id
      AND files_metadata.user_id = auth.uid()
    )
  );

-- File sharing
CREATE TABLE IF NOT EXISTS file_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES files_metadata(id) ON DELETE CASCADE NOT NULL,
  shared_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  shared_with uuid REFERENCES users(id) ON DELETE CASCADE,
  permissions jsonb DEFAULT '{"read": true, "write": false, "delete": false}',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage shares they created"
  ON file_shares FOR ALL
  TO authenticated
  USING (auth.uid() = shared_by)
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can view shares targeted to them"
  ON file_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = shared_with);

-- ============================================
-- PROCESS MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS process_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  process_name text NOT NULL,
  pid text NOT NULL,
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'killed')),
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  exit_code integer,
  metadata jsonb DEFAULT '{}',
  error_message text
);

ALTER TABLE process_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own process logs"
  ON process_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_process_user_status ON process_logs(user_id, status);

-- Process metrics
CREATE TABLE IF NOT EXISTS process_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid REFERENCES process_logs(id) ON DELETE CASCADE NOT NULL,
  timestamp timestamptz DEFAULT now(),
  cpu_usage numeric(5,2),
  memory_usage bigint,
  gpu_usage numeric(5,2),
  io_operations bigint,
  network_bytes bigint
);

ALTER TABLE process_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics for own processes"
  ON process_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM process_logs
      WHERE process_logs.id = process_metrics.process_id
      AND process_logs.user_id = auth.uid()
    )
  );

-- ============================================
-- AI & MACHINE LEARNING
-- ============================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text,
  model_name text DEFAULT 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
  messages jsonb DEFAULT '[]',
  context_window integer DEFAULT 8192,
  temperature numeric(3,2) DEFAULT 0.7,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON ai_conversations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_id);

-- AI embeddings for RAG (stored as text array for now)
CREATE TABLE IF NOT EXISTS ai_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  embedding text,
  metadata jsonb DEFAULT '{}',
  source_type text,
  source_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own embeddings"
  ON ai_embeddings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AI model cache stats
CREATE TABLE IF NOT EXISTS ai_model_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text UNIQUE NOT NULL,
  size_bytes bigint,
  load_count integer DEFAULT 0,
  last_loaded timestamptz,
  cache_hit_rate numeric(5,2),
  metadata jsonb DEFAULT '{}'
);

-- Public readable for stats
ALTER TABLE ai_model_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read model cache stats"
  ON ai_model_cache FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- SECURITY & AUDIT
-- ============================================

CREATE TABLE IF NOT EXISTS audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  ip_address text,
  user_agent text,
  status text DEFAULT 'success' CHECK (status IN ('success', 'failure', 'denied')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Admin only for audit trails
CREATE POLICY "Admins can read all audit trails"
  ON audit_trail FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_audit_user_action ON audit_trail(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_trail(created_at DESC);

-- Security policies
CREATE TABLE IF NOT EXISTS security_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  policy_type text NOT NULL,
  rules jsonb NOT NULL,
  enabled boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE security_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read security policies"
  ON security_policies FOR SELECT
  TO authenticated
  USING (true);

-- Threat events
CREATE TABLE IF NOT EXISTS threat_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  threat_type text NOT NULL,
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text,
  source_ip text,
  blocked boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE threat_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read threat events"
  ON threat_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- SYSTEM CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category, key)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read boolean DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);

-- Telemetry
CREATE TABLE IF NOT EXISTS telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  metric_name text NOT NULL,
  metric_value numeric,
  tags jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own telemetry"
  ON telemetry FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all telemetry"
  ON telemetry FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_telemetry_metric_time ON telemetry(metric_name, timestamp DESC);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conv_updated_at BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();