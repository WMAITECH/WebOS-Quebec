/*
  # Fix Performance and Security Issues - Part 2: Optimize RLS Policies

  1. RLS Performance Optimization
    - Replace auth.uid() with (select auth.uid()) in all policies
    - This prevents re-evaluation of auth.uid() for each row
    - Significantly improves query performance at scale
    
  2. Affected Tables and Policies
    - telemetry: Users can insert own telemetry
    - users: Users can insert own profile
    - user_profiles: 3 policies (view own, update own, admins view all)
    - api_keys: 4 policies (view, create, update, delete own)
    - user_quotas: Users can view own quotas
    - audit_logs: 2 policies (view own, admins view all)
    - trusted_sources: Admins can manage
    - sms_verifications: 3 policies (view, insert, update own)
    - conversations: 2 policies (create, view own)
    - conversation_participants: 2 policies (add participants, view participants)
    - messages: 3 policies (view, send, update)
    - message_receipts: 2 policies (view receipts, mark as read)

  3. Notes
    - Using (select auth.uid()) caches the result for the query
    - This is a critical optimization for production workloads
    - No functional changes, only performance improvements
*/

-- Telemetry
DROP POLICY IF EXISTS "Users can insert own telemetry" ON public.telemetry;
CREATE POLICY "Users can insert own telemetry" 
  ON public.telemetry 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

-- Users
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" 
  ON public.users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (id = (select auth.uid()));

-- User Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" 
  ON public.user_profiles 
  FOR SELECT 
  TO authenticated 
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" 
  ON public.user_profiles 
  FOR UPDATE 
  TO authenticated 
  USING (id = (select auth.uid())) 
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" 
  ON public.user_profiles 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = (select auth.uid()) 
      AND up.role = 'admin'
    )
  );

-- API Keys
DROP POLICY IF EXISTS "Users can view own API keys" ON public.api_keys;
CREATE POLICY "Users can view own API keys" 
  ON public.api_keys 
  FOR SELECT 
  TO authenticated 
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create own API keys" ON public.api_keys;
CREATE POLICY "Users can create own API keys" 
  ON public.api_keys 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own API keys" ON public.api_keys;
CREATE POLICY "Users can update own API keys" 
  ON public.api_keys 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = (select auth.uid())) 
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete own API keys" ON public.api_keys;
CREATE POLICY "Users can delete own API keys" 
  ON public.api_keys 
  FOR DELETE 
  TO authenticated 
  USING (user_id = (select auth.uid()));

-- User Quotas
DROP POLICY IF EXISTS "Users can view own quotas" ON public.user_quotas;
CREATE POLICY "Users can view own quotas" 
  ON public.user_quotas 
  FOR SELECT 
  TO authenticated 
  USING (user_id = (select auth.uid()));

-- Audit Logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs" 
  ON public.audit_logs 
  FOR SELECT 
  TO authenticated 
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs" 
  ON public.audit_logs 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = (select auth.uid()) 
      AND up.role = 'admin'
    )
  );

-- Trusted Sources
DROP POLICY IF EXISTS "Admins can manage trusted sources" ON public.trusted_sources;
CREATE POLICY "Admins can manage trusted sources" 
  ON public.trusted_sources 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up 
      WHERE up.id = (select auth.uid()) 
      AND up.role = 'admin'
    )
  );

-- SMS Verifications
DROP POLICY IF EXISTS "Users can view own SMS verifications" ON public.sms_verifications;
CREATE POLICY "Users can view own SMS verifications" 
  ON public.sms_verifications 
  FOR SELECT 
  TO authenticated 
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own SMS verifications" ON public.sms_verifications;
CREATE POLICY "Users can insert own SMS verifications" 
  ON public.sms_verifications 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own SMS verifications" ON public.sms_verifications;
CREATE POLICY "Users can update own SMS verifications" 
  ON public.sms_verifications 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = (select auth.uid())) 
  WITH CHECK (user_id = (select auth.uid()));

-- Conversations
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
CREATE POLICY "Authenticated users can create conversations" 
  ON public.conversations 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (created_by = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in" 
  ON public.conversations 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp 
      WHERE cp.conversation_id = id 
      AND cp.user_id = (select auth.uid())
    )
  );

-- Conversation Participants
DROP POLICY IF EXISTS "Users can add participants to conversations they created" ON public.conversation_participants;
CREATE POLICY "Users can add participants to conversations they created" 
  ON public.conversation_participants 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c 
      WHERE c.id = conversation_id 
      AND c.created_by = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view participants in conversations they are part of" ON public.conversation_participants;
CREATE POLICY "Users can view participants in conversations they are part of" 
  ON public.conversation_participants 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp 
      WHERE cp.conversation_id = conversation_id 
      AND cp.user_id = (select auth.uid())
    )
  );

-- Messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations" 
  ON public.messages 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp 
      WHERE cp.conversation_id = conversation_id 
      AND cp.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations" 
  ON public.messages 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    sender_id = (select auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp 
      WHERE cp.conversation_id = conversation_id 
      AND cp.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" 
  ON public.messages 
  FOR UPDATE 
  TO authenticated 
  USING (sender_id = (select auth.uid())) 
  WITH CHECK (sender_id = (select auth.uid()));

-- Message Receipts
DROP POLICY IF EXISTS "Users can view receipts for their messages" ON public.message_receipts;
CREATE POLICY "Users can view receipts for their messages" 
  ON public.message_receipts 
  FOR SELECT 
  TO authenticated 
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.message_receipts;
CREATE POLICY "Users can mark messages as read" 
  ON public.message_receipts 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = (select auth.uid()));
