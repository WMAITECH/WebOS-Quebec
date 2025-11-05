/*
  # Remove All Icons from Applications

  ## Overview
  This migration removes all icon symbols from applications table and replaces
  them with empty strings for a clean, professional, text-only interface.

  ## Changes
  - Sets all icon fields to empty string
  - Removes visual clutter for corporate environment
*/

-- Remove all icons from system applications
UPDATE applications SET icon = '' WHERE is_system = true;

-- Set default icon to empty string for new applications
ALTER TABLE applications ALTER COLUMN icon SET DEFAULT '';
