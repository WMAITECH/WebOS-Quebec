/*
  # Fix Infinite Recursion Using Security Definer Function

  1. Problem
    - Any policy on conversation_participants that queries itself causes recursion
    - Even subqueries trigger the same policy recursively
  
  2. Solution
    - Create a security definer function that bypasses RLS
    - Use this function in policies to check participation
    - Function runs with owner privileges, avoiding RLS checks
  
  3. Security
    - Function is tightly scoped to only check participation
    - No data leakage, only returns boolean
    - Maintains same security guarantees
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view participant records" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;

-- Create helper function that bypasses RLS
CREATE OR REPLACE FUNCTION public.user_is_conversation_participant(conversation_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM conversation_participants 
    WHERE conversation_id = conversation_uuid 
    AND user_id = user_uuid
  );
$$;

-- Simple non-recursive policy for conversation_participants
CREATE POLICY "Users can view participants in conversations they are part of"
  ON conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    public.user_is_conversation_participant(conversation_id, auth.uid())
  );

-- Simple non-recursive policy for conversations
CREATE POLICY "Users can view conversations they participate in"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    public.user_is_conversation_participant(id, auth.uid())
  );
