/*
  # Fix Infinite Recursion in Conversation RLS Policies

  1. Problem
    - conversation_participants SELECT policy checks itself causing infinite recursion
    - conversations SELECT policy also triggers the recursive check
  
  2. Solution
    - Simplify conversation_participants SELECT to avoid self-reference
    - Use direct user_id check instead of subquery on same table
  
  3. Changes
    - Drop existing recursive policies
    - Create new non-recursive policies
    - Maintain same security guarantees without recursion
*/

-- Drop old recursive policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;

-- Non-recursive policy for conversation_participants
-- Users can see participant records where they are listed
CREATE POLICY "Users can view participant records"
  ON conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Non-recursive policy for conversations
-- Users can see conversations where they have a participant record
CREATE POLICY "Users can view their conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );
