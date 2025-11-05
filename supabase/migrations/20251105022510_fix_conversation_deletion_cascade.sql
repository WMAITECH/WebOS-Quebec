/*
  # Fix conversation deletion constraints

  Problem:
  - conversations.created_by has DELETE rule SET NULL
  - But created_by is NOT NULL
  - This causes errors when trying to delete conversations

  Solution:
  - Change foreign key constraint from SET NULL to RESTRICT
  - This prevents deleting users who have created conversations
  - Conversations can still be deleted normally

  Security:
  - Maintains referential integrity
  - Prevents orphaned conversations
*/

-- Drop the old constraint
ALTER TABLE conversations 
DROP CONSTRAINT IF EXISTS conversations_created_by_fkey;

-- Add new constraint with RESTRICT (prevents deleting users who created conversations)
ALTER TABLE conversations
ADD CONSTRAINT conversations_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES users(id) 
ON DELETE RESTRICT;
