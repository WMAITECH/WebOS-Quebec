/*
  # Fix Notification User Validation

  ## Purpose
  Add validation to ensure users exist in the users table before creating notifications

  ## Changes
  - Update email notification trigger to verify user exists in users table
  - Update message notification trigger to verify user exists in users table
  - Prevent foreign key constraint violations

  ## Security
  - Maintains existing RLS policies
  - Prevents orphaned notifications
*/

-- Update the email notification function to verify user exists
CREATE OR REPLACE FUNCTION create_email_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  recipient_user_id uuid;
  user_exists boolean;
BEGIN
  -- Only create notification for received emails (inbox folder)
  IF NEW.folder = 'inbox' AND NEW.is_read = false THEN
    -- Get the user_id from the email account
    SELECT user_id INTO recipient_user_id
    FROM email_accounts
    WHERE id = NEW.account_id;

    IF recipient_user_id IS NOT NULL THEN
      -- Verify the user exists in the users table
      SELECT EXISTS(SELECT 1 FROM users WHERE id = recipient_user_id) INTO user_exists;
      
      IF user_exists THEN
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
      ELSE
        RAISE WARNING 'User % does not exist in users table, skipping notification', recipient_user_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Update the message notification function to verify users exist
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  sender_name text;
  participant_record record;
  user_exists boolean;
BEGIN
  -- Get sender name from users table
  SELECT COALESCE(full_name, email) INTO sender_name
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
    -- Verify the user exists in the users table
    SELECT EXISTS(SELECT 1 FROM users WHERE id = participant_record.user_id) INTO user_exists;
    
    IF user_exists THEN
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
        'messaging',
        'Nouveau message',
        sender_name || ': ' || LEFT(NEW.content, 100),
        sender_name || ': ' || NEW.content,
        'message-square',
        '/apps/messages?conversation=' || NEW.conversation_id::text,
        NEW.id,
        'normal'
      );
    ELSE
      RAISE WARNING 'User % does not exist in users table, skipping notification', participant_record.user_id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;
