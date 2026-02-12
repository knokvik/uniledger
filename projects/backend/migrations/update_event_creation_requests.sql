-- Add missing columns to event_creation_requests table

ALTER TABLE event_creation_requests ADD COLUMN IF NOT EXISTS sponsor_name TEXT;
ALTER TABLE event_creation_requests ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE event_creation_requests ADD COLUMN IF NOT EXISTS channels_json JSONB;
