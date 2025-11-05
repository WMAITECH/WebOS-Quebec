/*
  # Security Fixes - Part 4: Move Extensions to Extensions Schema
  
  ## Overview
  This migration moves vector and pg_trgm extensions from the public schema
  to a dedicated extensions schema for better security and organization.
  
  ## Extensions Being Moved
  - vector (for vector similarity search)
  - pg_trgm (for fuzzy text search)
*/

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move vector extension to extensions schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'vector' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION vector SET SCHEMA extensions;
  END IF;
END $$;

-- Move pg_trgm extension to extensions schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension e 
    JOIN pg_namespace n ON e.extnamespace = n.oid 
    WHERE e.extname = 'pg_trgm' AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
END $$;

-- Grant usage on extensions schema to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO service_role;

-- Update search_path to include extensions schema
ALTER DATABASE postgres SET search_path TO public, extensions;

COMMENT ON SCHEMA extensions IS 'Schema for PostgreSQL extensions (vector, pg_trgm, etc.)';
