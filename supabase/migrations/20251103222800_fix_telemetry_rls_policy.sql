/*
  # Fix Telemetry RLS Policy

  1. Changes
    - Drop existing INSERT policy on telemetry table
    - Create new INSERT policy with proper WITH CHECK clause
    - Ensure users can only insert telemetry for their own user_id

  2. Security
    - Users can only insert telemetry records with their own user_id
    - Prevents users from inserting telemetry for other users
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert own telemetry" ON telemetry;

-- Create new policy with WITH CHECK clause
CREATE POLICY "Users can insert own telemetry"
  ON telemetry
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
