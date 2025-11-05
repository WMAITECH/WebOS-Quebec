/*
  # Security Fixes - Part 1: Indexes and RLS Optimization
  
  ## Overview
  This migration addresses critical security and performance issues.
  
  ## 1. Foreign Key Indexes
  - Add missing indexes for foreign key columns in crawl_queue and emails tables
  
  ## 2. RLS Performance Optimization
  - Optimize notification and notification_preferences RLS policies using (select auth.uid())
  
  ## 3. Function Security
  - Fix search_path for functions to prevent security vulnerabilities
*/

-- ============================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_crawl_queue_source_id ON crawl_queue(source_id);
CREATE INDEX IF NOT EXISTS idx_emails_in_reply_to ON emails(in_reply_to);

-- ============================================
-- 2. OPTIMIZE RLS POLICIES - NOTIFICATIONS
-- ============================================

DROP POLICY IF EXISTS "notif_select" ON notifications;
DROP POLICY IF EXISTS "notif_insert" ON notifications;
DROP POLICY IF EXISTS "notif_update" ON notifications;
DROP POLICY IF EXISTS "notif_delete" ON notifications;

CREATE POLICY "notif_select" ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notif_insert" ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "notif_update" ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "notif_delete" ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- 3. OPTIMIZE RLS POLICIES - NOTIFICATION_PREFERENCES
-- ============================================

DROP POLICY IF EXISTS "pref_select" ON notification_preferences;
DROP POLICY IF EXISTS "pref_insert" ON notification_preferences;
DROP POLICY IF EXISTS "pref_update" ON notification_preferences;

CREATE POLICY "pref_select" ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "pref_insert" ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "pref_update" ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================
-- 4. FIX FUNCTION SEARCH PATHS
-- ============================================

ALTER FUNCTION set_email_thread_id() SECURITY DEFINER SET search_path = public, pg_temp;
ALTER FUNCTION validate_geolocation(jsonb) SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON INDEX idx_crawl_queue_source_id IS 'Performance: Index for foreign key crawl_queue.source_id';
COMMENT ON INDEX idx_emails_in_reply_to IS 'Performance: Index for foreign key emails.in_reply_to';

COMMENT ON POLICY "notif_select" ON notifications IS 'Optimized RLS: Users can view own notifications';
COMMENT ON POLICY "notif_insert" ON notifications IS 'Optimized RLS: Users can create own notifications';
COMMENT ON POLICY "notif_update" ON notifications IS 'Optimized RLS: Users can update own notifications';
COMMENT ON POLICY "notif_delete" ON notifications IS 'Optimized RLS: Users can delete own notifications';

COMMENT ON POLICY "pref_select" ON notification_preferences IS 'Optimized RLS: Users can view own preferences';
COMMENT ON POLICY "pref_insert" ON notification_preferences IS 'Optimized RLS: Users can create own preferences';
COMMENT ON POLICY "pref_update" ON notification_preferences IS 'Optimized RLS: Users can update own preferences';
