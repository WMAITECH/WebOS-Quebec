/*
  # Security Fix Part 4: Fix Function Search Paths (v3)
  
  1. Problem
    - Three functions have mutable search_path
    - This is a security risk as it can be exploited
    - Functions could reference wrong schema objects
  
  2. Solution
    - Drop and recreate functions with explicit search_path
    - Use correct column names (used_bytes, quota_bytes)
    - Use SECURITY DEFINER appropriately
    - Lock down to 'public' schema only
  
  3. Functions Fixed
    - update_storage_quota_on_delete
    - update_storage_quota_on_insert
    - get_storage_usage
*/

-- Fix update_storage_quota_on_delete function
DROP FUNCTION IF EXISTS public.update_storage_quota_on_delete() CASCADE;
CREATE FUNCTION public.update_storage_quota_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE user_storage_quota
  SET 
    used_bytes = GREATEST(0, COALESCE(used_bytes, 0) - COALESCE(OLD.size, 0)),
    updated_at = now()
  WHERE user_id = OLD.uploaded_by;
  
  RETURN OLD;
END;
$$;

-- Fix update_storage_quota_on_insert function
DROP FUNCTION IF EXISTS public.update_storage_quota_on_insert() CASCADE;
CREATE FUNCTION public.update_storage_quota_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update storage quota
  INSERT INTO user_storage_quota (user_id, used_bytes, quota_bytes, updated_at)
  VALUES (NEW.uploaded_by, COALESCE(NEW.size, 0), 5368709120, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET
    used_bytes = COALESCE(user_storage_quota.used_bytes, 0) + COALESCE(NEW.size, 0),
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Fix get_storage_usage function
DROP FUNCTION IF EXISTS public.get_storage_usage(uuid);
CREATE FUNCTION public.get_storage_usage(p_user_id uuid)
RETURNS TABLE (
  used_bytes bigint,
  quota_bytes bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    COALESCE(used_bytes, 0) as used_bytes,
    COALESCE(quota_bytes, 5368709120) as quota_bytes
  FROM user_storage_quota
  WHERE user_id = p_user_id;
$$;

-- Recreate triggers if they were dropped
DROP TRIGGER IF EXISTS trigger_update_storage_on_insert ON message_attachments;
CREATE TRIGGER trigger_update_storage_on_insert
  AFTER INSERT ON message_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_quota_on_insert();

DROP TRIGGER IF EXISTS trigger_update_storage_on_delete ON message_attachments;
CREATE TRIGGER trigger_update_storage_on_delete
  AFTER DELETE ON message_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_quota_on_delete();
