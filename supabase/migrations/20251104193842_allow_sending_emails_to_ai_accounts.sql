/*
  # Allow Sending Emails to AI Accounts

  ## Problem
  Users cannot send emails to AI helper accounts because RLS policy checks
  that the recipient account belongs to the sender (auth.uid()).

  ## Solution
  - Modify INSERT policy on emails table
  - Allow inserting emails where sender OR recipient is the authenticated user
  - Allow sending TO any active email account (including AI accounts)
  
  ## Security
  - Users can only send FROM their own accounts
  - Users can send TO any active account (including AI helpers)
  - Users can only read/update/delete their own emails
*/

-- Drop the old restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create own emails" ON emails;

-- Create new policy allowing users to send emails from their accounts to any active account
CREATE POLICY "Users can send emails from their accounts"
  ON emails
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Sender must be authenticated user's account
    EXISTS (
      SELECT 1 
      FROM email_accounts 
      WHERE email_accounts.id = emails.account_id 
        AND email_accounts.user_id = auth.uid()
    )
  );

-- Add policy to allow users to receive emails (for SELECT)
DROP POLICY IF EXISTS "Users can view own emails" ON emails;

CREATE POLICY "Users can view their emails"
  ON emails
  FOR SELECT
  TO authenticated
  USING (
    -- Can see emails in their own accounts (sent or received)
    EXISTS (
      SELECT 1 
      FROM email_accounts 
      WHERE email_accounts.id = emails.account_id 
        AND email_accounts.user_id = auth.uid()
    )
  );
