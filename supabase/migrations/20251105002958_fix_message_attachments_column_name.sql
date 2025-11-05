/*
  # Fix message_attachments column naming

  1. Changes
    - Rename `filename` to `file_name` for consistency with other columns
    - Update all references to use the new column name

  2. Security
    - No changes to RLS policies
*/

-- Rename the column to match the expected naming convention
ALTER TABLE message_attachments 
  RENAME COLUMN filename TO file_name;
