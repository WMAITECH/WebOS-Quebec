/*
  # Simplify Conversation RLS - Final Fix

  ## Purpose
  Fix 403 error by making RLS policy work with frontend-provided created_by.
  The issue: auth.uid() as DEFAULT doesn't work - frontend must send created_by.

  ## Changes
  1. Remove DEFAULT auth.uid() (doesn't work in this context)
  2. Keep created_by as NOT NULL (must be provided by frontend)
  3. RLS policy checks that created_by equals auth.uid()
  4. Frontend already sends created_by correctly

  ## Security
  - Frontend sends created_by = currentUser.id
  - RLS verifies created_by = auth.uid() (server-side check)
  - User cannot spoof another user's ID because server validates
*/

-- Remove the non-working DEFAULT
ALTER TABLE conversations 
  ALTER COLUMN created_by DROP DEFAULT;

-- Keep NOT NULL constraint
ALTER TABLE conversations 
  ALTER COLUMN created_by SET NOT NULL;

-- Simple, clear RLS policy
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Verify the policy is correct
COMMENT ON POLICY "Authenticated users can create conversations" ON conversations IS
  'Users can only create conversations where they are the creator. Frontend must send created_by = user.id';
