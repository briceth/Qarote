-- Enable pg_partman extension
CREATE EXTENSION IF NOT EXISTS pg_partman SCHEMA public;

-- Create the partman schema if it doesn't exist (some versions need this)
CREATE SCHEMA IF NOT EXISTS partman;

-- Grant necessary permissions for partman to work properly
GRANT USAGE ON SCHEMA partman TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA partman TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA partman TO postgres;

-- Ensure the background worker can access what it needs
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA partman TO postgres;

-- Set up some basic configuration for pg_partman
-- This ensures the extension works properly with your use case
ALTER DATABASE rabbit_dashboard SET search_path = public, partman;

-- Create a maintenance role (optional but recommended)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'partman_maintenance') THEN
        CREATE ROLE partman_maintenance;
    END IF;
END
$$;

GRANT USAGE ON SCHEMA partman TO partman_maintenance;
GRANT ALL ON ALL TABLES IN SCHEMA partman TO partman_maintenance;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA partman TO partman_maintenance;