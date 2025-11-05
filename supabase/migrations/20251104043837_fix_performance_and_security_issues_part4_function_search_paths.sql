/*
  # Fix Performance and Security Issues - Part 4: Fix Function Search Paths

  1. Security Improvements
    - Set stable search_path for functions to prevent security vulnerabilities
    - Functions with mutable search_path can be exploited
    - Setting search_path explicitly ensures functions use correct schemas
    
  2. Affected Functions
    - user_is_conversation_participant
    - update_conversation_timestamp

  3. Notes
    - search_path 'public' ensures functions only use public schema
    - SECURITY DEFINER functions especially need this
    - Prevents schema injection attacks
*/

-- Fix user_is_conversation_participant function
CREATE OR REPLACE FUNCTION public.user_is_conversation_participant(
  conversation_uuid uuid,
  user_uuid uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_uuid
      AND cp.user_id = user_uuid
  );
END;
$$;

-- Fix update_conversation_timestamp function
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;
