/*
  # Message Attachments and File Storage System

  ## Overview
  This migration creates a complete file attachment system for both messaging and email apps.
  Supports multi-file uploads, all file types, with security and quota management.

  ## New Tables

  ### message_attachments
  File attachments for instant messages
  - `id` (uuid, primary key)
  - `message_id` (uuid, references messages) - Parent message
  - `filename` (text) - Original filename
  - `file_path` (text) - Path in Supabase Storage
  - `file_size` (bigint) - Size in bytes
  - `mime_type` (text) - MIME type
  - `checksum` (text) - SHA-256 for integrity verification
  - `uploaded_by` (uuid, references users) - Uploader
  - `created_at` (timestamptz)

  ### user_storage_quota
  Track storage usage per user
  - `user_id` (uuid, references users, primary key)
  - `used_bytes` (bigint) - Total bytes used
  - `quota_bytes` (bigint) - Total quota (default 5 GB)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own attachments
  - Automatic quota tracking with triggers
  - Cascade deletes for data integrity

  ## Storage Buckets
  Note: Supabase Storage buckets must be created via dashboard or API:
  - message-attachments (private, 500MB max per file)
  - email-attachments (private, 500MB max per file)

  ## Indexes
  - Optimized for fast attachment lookups
  - Composite indexes for message and user queries
*/

-- ============================================
-- TABLES
-- ============================================

-- Message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL,
  checksum text,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- User storage quota tracking
CREATE TABLE IF NOT EXISTS user_storage_quota (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  used_bytes bigint DEFAULT 0 NOT NULL,
  quota_bytes bigint DEFAULT 5368709120 NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id 
  ON message_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_message_attachments_uploaded_by 
  ON message_attachments(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_message_attachments_mime_type 
  ON message_attachments(mime_type);

CREATE INDEX IF NOT EXISTS idx_message_attachments_created_at 
  ON message_attachments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_storage_quota_user_id 
  ON user_storage_quota(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_storage_quota ENABLE ROW LEVEL SECURITY;

-- Message attachments policies
CREATE POLICY "Users can view attachments of their messages"
  ON message_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_attachments.message_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create attachments for their messages"
  ON message_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_attachments.message_id
      AND cp.user_id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Users can delete their own attachments"
  ON message_attachments FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- User storage quota policies
CREATE POLICY "Users can view own storage quota"
  ON user_storage_quota FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own storage quota"
  ON user_storage_quota FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can insert storage quota"
  ON user_storage_quota FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update storage quota when attachment is added
CREATE OR REPLACE FUNCTION update_storage_quota_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update storage quota
  INSERT INTO user_storage_quota (user_id, used_bytes, updated_at)
  VALUES (NEW.uploaded_by, NEW.file_size, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    used_bytes = user_storage_quota.used_bytes + NEW.file_size,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update storage quota when attachment is deleted
CREATE OR REPLACE FUNCTION update_storage_quota_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease storage usage
  UPDATE user_storage_quota
  SET 
    used_bytes = GREATEST(0, used_bytes - OLD.file_size),
    updated_at = now()
  WHERE user_id = OLD.uploaded_by;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get storage usage for a user
CREATE OR REPLACE FUNCTION get_storage_usage(p_user_id uuid)
RETURNS TABLE(
  used_bytes bigint,
  quota_bytes bigint,
  used_percentage numeric,
  available_bytes bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(sq.used_bytes, 0) AS used_bytes,
    COALESCE(sq.quota_bytes, 5368709120) AS quota_bytes,
    ROUND((COALESCE(sq.used_bytes, 0)::numeric / COALESCE(sq.quota_bytes, 5368709120)::numeric) * 100, 2) AS used_percentage,
    GREATEST(0, COALESCE(sq.quota_bytes, 5368709120) - COALESCE(sq.used_bytes, 0)) AS available_bytes
  FROM user_storage_quota sq
  WHERE sq.user_id = p_user_id
  UNION ALL
  SELECT 0, 5368709120, 0.0, 5368709120
  WHERE NOT EXISTS (
    SELECT 1 FROM user_storage_quota WHERE user_id = p_user_id
  )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS trigger_update_storage_on_insert ON message_attachments;
CREATE TRIGGER trigger_update_storage_on_insert
  AFTER INSERT ON message_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_quota_on_insert();

DROP TRIGGER IF EXISTS trigger_update_storage_on_delete ON message_attachments;
CREATE TRIGGER trigger_update_storage_on_delete
  AFTER DELETE ON message_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_quota_on_delete();

-- Also update email attachments to track storage
DROP TRIGGER IF EXISTS trigger_update_storage_on_email_insert ON email_attachments;
CREATE TRIGGER trigger_update_storage_on_email_insert
  AFTER INSERT ON email_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_quota_on_insert();

DROP TRIGGER IF EXISTS trigger_update_storage_on_email_delete ON email_attachments;
CREATE TRIGGER trigger_update_storage_on_email_delete
  AFTER DELETE ON email_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_quota_on_delete();

-- ============================================
-- UPDATE EMAIL ATTACHMENTS TABLE
-- ============================================

-- Add uploaded_by column to email_attachments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_attachments' AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE email_attachments ADD COLUMN uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add checksum column to email_attachments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_attachments' AND column_name = 'checksum'
  ) THEN
    ALTER TABLE email_attachments ADD COLUMN checksum text;
  END IF;
END $$;

-- Analyze tables
ANALYZE message_attachments;
ANALYZE user_storage_quota;
ANALYZE email_attachments;