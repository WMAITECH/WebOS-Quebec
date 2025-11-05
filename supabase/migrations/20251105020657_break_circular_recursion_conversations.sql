/*
  # Break circular recursion in conversations RLS

  Problem:
  - conversations SELECT: checks conversation_participants
  - conversation_participants SELECT: checks conversations
  = INFINITE RECURSION

  Solution:
  - Remove conversations reference from conversation_participants SELECT policy
  - Users can only see their own participation records
  - This breaks the circular dependency

  Security:
  - Users can view conversations they created or participate in
  - Users can only see their own participation records
  - One-way dependency: conversations → conversation_participants
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants" ON conversation_participants;

-- Create simple policy: users can only see their own participation
-- NO reference to conversations table (breaks the recursion)
CREATE POLICY "Users can view their own participation"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
