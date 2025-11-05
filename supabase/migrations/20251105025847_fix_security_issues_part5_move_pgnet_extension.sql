/*
  # Security Fix Part 5: Move pg_net Extension
  
  1. Problem
    - pg_net extension is installed in public schema
    - This is not a security best practice
    - Extensions should be in their own schema or extensions schema
  
  2. Solution
    - Create 'extensions' schema if it doesn't exist
    - Move pg_net to extensions schema
    - Update search_path if needed
  
  3. Security Impact
    - Better schema organization
    - Separates extensions from application data
    - Follows PostgreSQL best practices
*/

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_net to extensions schema
-- Note: We need to drop and recreate the extension in the new schema
DO $$
BEGIN
  -- Check if pg_net exists in public
  IF EXISTS (
    SELECT 1 
    FROM pg_extension 
    WHERE extname = 'pg_net'
  ) THEN
    -- Drop from public (if it was there)
    DROP EXTENSION IF EXISTS pg_net CASCADE;
    
    -- Recreate in extensions schema
    CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
  ELSE
    -- Just create it in extensions schema
    CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
  END IF;
END $$;

-- Grant usage on extensions schema to necessary roles
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
