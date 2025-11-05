/*
  # Enhance Notifications System

  ## Changes
  - Add missing columns: is_dismissed, dismissed_at, icon, body, reference_id
  - Add indexes for performance
  - Create triggers for automatic notification creation
  - Update RLS policies

  ## New Columns
  - `is_dismissed` (boolean) - Track if notification is dismissed by user
  - `dismissed_at` (timestamptz) - When notification was dismissed
  - `icon` (text) - Icon identifier for the notification
  - `body` (text) - Alternative to message field
  - `reference_id` (uuid) - ID of related object (email_id, message_id, etc.)
*/

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'is_dismissed'
  ) THEN
    ALTER TABLE notifications ADD COLUMN is_dismissed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'dismissed_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN dismissed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'icon'
  ) THEN
    ALTER TABLE notifications ADD COLUMN icon text DEFAULT 'bell';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'body'
  ) THEN
    ALTER TABLE notifications ADD COLUMN body text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'reference_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN reference_id uuid;
  END IF;
END $$;

-- Update body from message if needed
UPDATE notifications SET body = message WHERE body IS NULL AND message IS NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_active 
  ON notifications(user_id, is_dismissed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_reference 
  ON notifications(reference_id) WHERE reference_id IS NOT NULL;

-- Create function to auto-create email notifications
CREATE OR REPLACE FUNCTION create_email_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  recipient_user_id uuid;
BEGIN
  -- Only create notification for received emails (inbox folder)
  IF NEW.folder = 'inbox' AND NEW.is_read = false THEN
    -- Get the user_id from the email account
    SELECT user_id INTO recipient_user_id
    FROM email_accounts
    WHERE id = NEW.account_id;

    IF recipient_user_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        category,
        title,
        message,
        body,
        icon,
        action_url,
        reference_id,
        priority
      ) VALUES (
        recipient_user_id,
        'email',
        'email',
        'Nouveau courriel',
        'De: ' || NEW.from_address || ' - ' || NEW.subject,
        'De: ' || NEW.from_address || ' - ' || NEW.subject,
        'mail',
        '/apps/mail?email=' || NEW.id::text,
        NEW.id,
        CASE 
          WHEN NEW.priority = 'high' THEN 'high'
          WHEN NEW.priority = 'urgent' THEN 'urgent'
          ELSE 'normal'
        END
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for email notifications
DROP TRIGGER IF EXISTS trigger_email_notification ON emails;
CREATE TRIGGER trigger_email_notification
  AFTER INSERT ON emails
  FOR EACH ROW
  EXECUTE FUNCTION create_email_notification();

-- Create function to auto-create message notifications
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  participant_record RECORD;
  sender_name text;
BEGIN
  -- Get sender name
  SELECT display_name INTO sender_name
  FROM users
  WHERE id = NEW.sender_id;

  IF sender_name IS NULL THEN
    sender_name := 'Utilisateur';
  END IF;

  -- Create notification for all conversation participants except the sender
  FOR participant_record IN
    SELECT user_id
    FROM conversation_participants
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      category,
      title,
      message,
      body,
      icon,
      action_url,
      reference_id,
      priority
    ) VALUES (
      participant_record.user_id,
      'message',
      'message',
      'Nouveau message',
      sender_name || ': ' || LEFT(NEW.content, 100),
      sender_name || ': ' || LEFT(NEW.content, 100),
      'message-circle',
      '/apps/messages?conversation=' || NEW.conversation_id::text,
      NEW.id,
      'normal'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS trigger_message_notification ON messages;
CREATE TRIGGER trigger_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- Create function to auto-dismiss notification when email is read
CREATE OR REPLACE FUNCTION dismiss_email_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    UPDATE notifications
    SET is_read = true, read_at = now()
    WHERE reference_id = NEW.id
      AND type = 'email'
      AND is_read = false;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for auto-dismissing email notifications
DROP TRIGGER IF EXISTS trigger_dismiss_email_notification ON emails;
CREATE TRIGGER trigger_dismiss_email_notification
  AFTER UPDATE ON emails
  FOR EACH ROW
  WHEN (NEW.is_read = true AND OLD.is_read = false)
  EXECUTE FUNCTION dismiss_email_notification();
