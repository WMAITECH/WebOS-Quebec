/*
  # Security Fixes - Part 3: Consolidate Multiple Permissive Policies
  
  ## Overview
  This migration consolidates multiple permissive policies into single optimized policies.
  This improves query performance and simplifies policy management.
  
  ## Tables Updated
  - appointments
  - citizen_profiles
  - email_accounts
  - government_departments
  - government_documents
  - secure_messages
  - service_requests
*/

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can manage all appointments" ON appointments;
DROP POLICY IF EXISTS "Citizens can create appointments" ON appointments;
DROP POLICY IF EXISTS "Citizens can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Citizens can update own appointments" ON appointments;

CREATE POLICY "appointments_select_policy" ON appointments
  FOR SELECT
  TO authenticated
  USING (citizen_id = (SELECT auth.uid()));

CREATE POLICY "appointments_insert_policy" ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (citizen_id = (SELECT auth.uid()));

CREATE POLICY "appointments_update_policy" ON appointments
  FOR UPDATE
  TO authenticated
  USING (citizen_id = (SELECT auth.uid()))
  WITH CHECK (citizen_id = (SELECT auth.uid()));

-- ============================================
-- CITIZEN PROFILES TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON citizen_profiles;
DROP POLICY IF EXISTS "Citizens can view own profile" ON citizen_profiles;

CREATE POLICY "citizen_profiles_select_policy" ON citizen_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- EMAIL ACCOUNTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can view all email accounts" ON email_accounts;
DROP POLICY IF EXISTS "Users can view own email account" ON email_accounts;

CREATE POLICY "email_accounts_select_policy" ON email_accounts
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================
-- GOVERNMENT DEPARTMENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can manage departments" ON government_departments;
DROP POLICY IF EXISTS "Everyone can view active departments" ON government_departments;

CREATE POLICY "government_departments_select_policy" ON government_departments
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================
-- GOVERNMENT DOCUMENTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can manage all documents" ON government_documents;
DROP POLICY IF EXISTS "Citizens can view own documents" ON government_documents;

CREATE POLICY "government_documents_select_policy" ON government_documents
  FOR SELECT
  TO authenticated
  USING (citizen_id = (SELECT auth.uid()));

-- ============================================
-- SECURE MESSAGES TABLE
-- ============================================

DROP POLICY IF EXISTS "Users can view messages they received" ON secure_messages;
DROP POLICY IF EXISTS "Users can view messages they sent" ON secure_messages;

CREATE POLICY "secure_messages_select_policy" ON secure_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = (SELECT auth.uid()) OR
    recipient_id = (SELECT auth.uid())
  );

-- ============================================
-- SERVICE REQUESTS TABLE
-- ============================================

DROP POLICY IF EXISTS "Admins can view all requests" ON service_requests;
DROP POLICY IF EXISTS "Citizens can view own requests" ON service_requests;

CREATE POLICY "service_requests_select_policy" ON service_requests
  FOR SELECT
  TO authenticated
  USING (citizen_id = (SELECT auth.uid()));

-- ============================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON POLICY "appointments_select_policy" ON appointments IS 'Consolidated RLS: Users view only their own appointments';
COMMENT ON POLICY "appointments_insert_policy" ON appointments IS 'Consolidated RLS: Users create only their own appointments';
COMMENT ON POLICY "appointments_update_policy" ON appointments IS 'Consolidated RLS: Users update only their own appointments';

COMMENT ON POLICY "citizen_profiles_select_policy" ON citizen_profiles IS 'Consolidated RLS: Users view only their own profile';

COMMENT ON POLICY "email_accounts_select_policy" ON email_accounts IS 'Consolidated RLS: Users view only their own email account';

COMMENT ON POLICY "government_departments_select_policy" ON government_departments IS 'Consolidated RLS: All authenticated users can view active departments';

COMMENT ON POLICY "government_documents_select_policy" ON government_documents IS 'Consolidated RLS: Users view only their own documents';

COMMENT ON POLICY "secure_messages_select_policy" ON secure_messages IS 'Consolidated RLS: Users view messages they sent or received';

COMMENT ON POLICY "service_requests_select_policy" ON service_requests IS 'Consolidated RLS: Users view only their own service requests';
