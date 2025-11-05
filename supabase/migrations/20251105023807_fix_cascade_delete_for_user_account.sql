/*
  # Fix cascade delete for user account deletion

  1. Changes
    - Drop and recreate foreign key constraints that prevent user deletion
    - Change ON DELETE RESTRICT to ON DELETE CASCADE for conversations.created_by
    - Change ON DELETE SET NULL to ON DELETE CASCADE for various tables
    - This allows users to delete their own accounts without foreign key violations

  2. Tables affected
    - conversations: created_by now CASCADE deletes
    - file_versions: created_by now CASCADE deletes
    - email_attachments: uploaded_by now CASCADE deletes
    - message_attachments: uploaded_by now CASCADE deletes
    - audit_trail: user_id now CASCADE deletes
    - threat_events: user_id now CASCADE deletes
    - telemetry: user_id now CASCADE deletes

  3. Security
    - All changes preserve data integrity
    - Only affects behavior when a user is deleted
    - Related data is properly cleaned up
*/

-- Fix conversations.created_by (RESTRICT -> CASCADE)
ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_created_by_fkey;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Fix file_versions.created_by (SET NULL -> CASCADE)
ALTER TABLE file_versions
  DROP CONSTRAINT IF EXISTS file_versions_created_by_fkey;

ALTER TABLE file_versions
  ADD CONSTRAINT file_versions_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Fix email_attachments.uploaded_by (SET NULL -> CASCADE)
ALTER TABLE email_attachments
  DROP CONSTRAINT IF EXISTS email_attachments_uploaded_by_fkey;

ALTER TABLE email_attachments
  ADD CONSTRAINT email_attachments_uploaded_by_fkey
  FOREIGN KEY (uploaded_by)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Fix message_attachments.uploaded_by (SET NULL -> CASCADE)
ALTER TABLE message_attachments
  DROP CONSTRAINT IF EXISTS message_attachments_uploaded_by_fkey;

ALTER TABLE message_attachments
  ADD CONSTRAINT message_attachments_uploaded_by_fkey
  FOREIGN KEY (uploaded_by)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Fix audit_trail.user_id (SET NULL -> CASCADE)
ALTER TABLE audit_trail
  DROP CONSTRAINT IF EXISTS audit_trail_user_id_fkey;

ALTER TABLE audit_trail
  ADD CONSTRAINT audit_trail_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Fix threat_events.user_id (SET NULL -> CASCADE)
ALTER TABLE threat_events
  DROP CONSTRAINT IF EXISTS threat_events_user_id_fkey;

ALTER TABLE threat_events
  ADD CONSTRAINT threat_events_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Fix telemetry.user_id (SET NULL -> CASCADE)
ALTER TABLE telemetry
  DROP CONSTRAINT IF EXISTS telemetry_user_id_fkey;

ALTER TABLE telemetry
  ADD CONSTRAINT telemetry_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;
