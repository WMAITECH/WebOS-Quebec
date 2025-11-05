/*
  # Fix Conversation Trigger Authentication Context

  ## Purpose
  Fix the trigger to properly access auth.uid() in BEFORE INSERT context.
  The issue is that the trigger was not able to access auth.uid() properly.

  ## Changes
  1. Remove the automatic trigger approach (doesn't work with auth.uid())
  2. Make created_by have a DEFAULT value of auth.uid()
  3. Simplify RLS policy to check created_by = auth.uid()
  4. This way the database sets created_by automatically if not provided

  ## Security
  - created_by defaults to auth.uid() if not provided
  - RLS ensures only rows where created_by = auth.uid() can be inserted
  - Users cannot spoof the creator ID
*/

-- Drop the trigger approach - it doesn't work with auth.uid()
DROP TRIGGER IF EXISTS set_conversation_creator_trigger ON conversations;
DROP FUNCTION IF EXISTS set_conversation_creator();

-- Set a DEFAULT value for created_by instead
-- This will use auth.uid() when no value is provided
ALTER TABLE conversations 
  ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Update RLS policy to allow insert when created_by matches auth.uid()
-- The DEFAULT value will handle cases where created_by is not provided
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if created_by is either provided and equals auth.uid()
    -- OR if it's NULL (will be set to DEFAULT auth.uid())
    created_by = auth.uid() OR created_by IS NULL
  );

-- Make sure created_by cannot be NULL after insert
ALTER TABLE conversations 
  ALTER COLUMN created_by SET NOT NULL;
