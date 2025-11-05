/*
  # Create Storage Buckets and RLS Policies

  ## Overview
  This migration creates Supabase Storage buckets for file attachments
  and configures Row Level Security policies for secure access.

  ## Storage Buckets
  - message-attachments (private, 500MB max per file)
  - email-attachments (private, 500MB max per file)

  ## Security Policies
  - Users can only access files in folders matching their user ID
  - Authenticated users can read, upload, and delete their own files
  - Public access is disabled for both buckets

  ## File Organization
  Files are stored in user-specific folders:
  - message-attachments/{user_id}/{timestamp}_{random}_{filename}
  - email-attachments/{user_id}/{timestamp}_{random}_{filename}
*/

-- Create message-attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  false,
  524288000,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Create email-attachments bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'email-attachments',
  'email-attachments',
  false,
  524288000,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE RLS POLICIES - MESSAGE ATTACHMENTS
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own message attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own message attachments" ON storage.objects;

-- Allow users to read their own message attachments
CREATE POLICY "Users can read own message attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to upload their own message attachments
CREATE POLICY "Users can upload own message attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own message attachments
CREATE POLICY "Users can delete own message attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own message attachments
CREATE POLICY "Users can update own message attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- STORAGE RLS POLICIES - EMAIL ATTACHMENTS
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own email attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own email attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own email attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own email attachments" ON storage.objects;

-- Allow users to read their own email attachments
CREATE POLICY "Users can read own email attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to upload their own email attachments
CREATE POLICY "Users can upload own email attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own email attachments
CREATE POLICY "Users can delete own email attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own email attachments
CREATE POLICY "Users can update own email attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'email-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- VERIFY CONFIGURATION
-- ============================================

-- Check that buckets were created
DO $$
DECLARE
  message_bucket_count INTEGER;
  email_bucket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO message_bucket_count
  FROM storage.buckets
  WHERE id = 'message-attachments';

  SELECT COUNT(*) INTO email_bucket_count
  FROM storage.buckets
  WHERE id = 'email-attachments';

  IF message_bucket_count = 0 THEN
    RAISE NOTICE 'WARNING: message-attachments bucket was not created';
  ELSE
    RAISE NOTICE 'SUCCESS: message-attachments bucket is ready';
  END IF;

  IF email_bucket_count = 0 THEN
    RAISE NOTICE 'WARNING: email-attachments bucket was not created';
  ELSE
    RAISE NOTICE 'SUCCESS: email-attachments bucket is ready';
  END IF;
END $$;