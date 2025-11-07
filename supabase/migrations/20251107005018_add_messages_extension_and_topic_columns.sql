/*
  # Add extension and topic columns to messages table

  1. Changes
    - Add `extension` column (text, nullable) to messages table for file type tracking
    - Add `topic` column (text, nullable) to messages table for message categorization
  
  2. Notes
    - These columns are used by AI helper messages and file attachments
    - Both are optional fields for backward compatibility
*/

-- Add extension column for file type tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'extension'
  ) THEN
    ALTER TABLE messages ADD COLUMN extension text;
  END IF;
END $$;

-- Add topic column for message categorization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'topic'
  ) THEN
    ALTER TABLE messages ADD COLUMN topic text;
  END IF;
END $$;
