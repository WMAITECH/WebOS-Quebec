/*
  # Fix Email Accounts Visibility

  ## Changes
  - Drop restrictive SELECT policy on email_accounts
  - Add new policy allowing authenticated users to see all active email accounts
  
  ## Security
  - Users can still only update/insert their own accounts
  - Only active accounts are visible
  - Read-only access to other users' email accounts
*/

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "email_accounts_select_policy" ON email_accounts;

-- Create new policy allowing all authenticated users to see active accounts
CREATE POLICY "Users can view all active email accounts"
  ON email_accounts
  FOR SELECT
  TO authenticated
  USING (is_active = true);
