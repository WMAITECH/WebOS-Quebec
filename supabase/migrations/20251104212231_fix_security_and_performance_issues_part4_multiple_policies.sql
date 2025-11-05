/*
  # Fix Security and Performance Issues - Part 4: Multiple Permissive Policies

  ## Changes
  Consolidate multiple SELECT policies into single policies

  ## Tables Updated
  - audit_logs: 2 policies → 1 policy
  - trusted_sources: 2 policies → 1 policy
  - user_profiles: 2 policies → 1 policy
  - users: 3 policies → 1 policy

  ## Security Notes
  All consolidated policies maintain the same security guarantees
  Admins can view all, regular users can view their own data
*/

-- =====================================================
-- AUDIT_LOGS: Consolidate SELECT policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;

CREATE POLICY "Users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
        AND u.role = 'admin'
    )
  );

-- =====================================================
-- TRUSTED_SOURCES: Consolidate SELECT policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage trusted sources" ON trusted_sources;
DROP POLICY IF EXISTS "Authenticated users can view active trusted sources" ON trusted_sources;

CREATE POLICY "Users can view trusted sources"
  ON trusted_sources FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
        AND u.role = 'admin'
    )
  );

-- =====================================================
-- USER_PROFILES: Consolidate SELECT policies
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

CREATE POLICY "Users can view profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (select auth.uid())
        AND u.role = 'admin'
    )
  );

-- =====================================================
-- USERS: Consolidate SELECT policies
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view all user profiles" ON users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Users table should allow viewing all users for messaging/collaboration
CREATE POLICY "Users can view user profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);
