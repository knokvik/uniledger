-- ============================================
-- UNILEDGER DATABASE SCHEMA
-- Role-Based Access Control (RBAC) System
-- Roles: Owner, Volunteer, Member
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT, -- bcrypt hash
  name TEXT,
  role VARCHAR(20) DEFAULT 'member', -- 'college_admin', 'club_owner', 'volunteer', 'member' 
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  CHECK (role IN ('college_admin', 'club_owner', 'volunteer', 'member'))
);

-- Clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  banner_url TEXT,
  logo_url TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'active', 'pending', 'suspended'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (status IN ('active', 'pending', 'suspended'))
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  event_date TIMESTAMP,
  location TEXT,
  sponsor_name TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  wallet_address TEXT,
  ticket_price NUMERIC,
  participant_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- 'active', 'pending', 'cancelled'
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (status IN ('active', 'pending', 'cancelled'))
);

-- Club members table (many-to-many with roles)
CREATE TABLE IF NOT EXISTS club_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member', -- 'owner', 'volunteer', 'member'
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(club_id, user_id),
  CHECK (role IN ('owner', 'volunteer', 'member'))
);

-- Event members table (many-to-many with roles)
CREATE TABLE IF NOT EXISTS event_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member', -- 'owner', 'volunteer', 'member'
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id),
  CHECK (role IN ('owner', 'volunteer', 'member'))
);

-- Channels table (for clubs and events)
-- visibility: 'public' (all members), 'volunteer' (volunteers + owners), 'owner' (owners only)
CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  visibility VARCHAR(20) NOT NULL DEFAULT 'public', -- 'public', 'volunteer', 'owner'
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  -- A channel belongs to either a club OR an event, not both
  CONSTRAINT channel_belongs_to_one CHECK (
    (club_id IS NOT NULL AND event_id IS NULL) OR
    (club_id IS NULL AND event_id IS NOT NULL)
  ),
  CHECK (visibility IN ('public', 'volunteer', 'owner'))
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table (matches notifications.js usage)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'join_request', 'join_accepted', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Event Payments table (matches payments.js usage)
CREATE TABLE IF NOT EXISTS event_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  transaction_id TEXT NOT NULL,
  wallet_address TEXT,
  amount NUMERIC,
  status VARCHAR(20) DEFAULT 'pending', -- 'verified', 'failed', 'pending'
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Join Requests table (matches join-requests.js usage)
CREATE TABLE IF NOT EXISTS join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- MIGRATION PATCHES (For existing structures)
-- ============================================
-- 1. Ensure columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member';
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- 2. Update Constraints used by 'status' columns
-- Drop old constraints if they exist (Postgres naming might vary, so we attempt standard names)
-- Note: 'events_status_check' might not exist if table was created without it.
DO $$ 
BEGIN
    ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE events ADD CONSTRAINT events_status_check CHECK (status IN ('active', 'pending', 'cancelled'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clubs_owner_id ON clubs(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_owner_id ON events(owner_id);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON events(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_role ON club_members(role);
CREATE INDEX IF NOT EXISTS idx_event_members_event_id ON event_members(event_id);
CREATE INDEX IF NOT EXISTS idx_event_members_user_id ON event_members(user_id);
CREATE INDEX IF NOT EXISTS idx_event_members_role ON event_members(role);
CREATE INDEX IF NOT EXISTS idx_channels_club_id ON channels(club_id);
CREATE INDEX IF NOT EXISTS idx_channels_event_id ON channels(event_id);
CREATE INDEX IF NOT EXISTS idx_channels_visibility ON channels(visibility);
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_user_id ON event_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_event_id ON event_payments(event_id);

-- Add comments
COMMENT ON TABLE clubs IS 'Clubs/Organizations in the system';
COMMENT ON TABLE events IS 'Events organized by clubs or sponsors';
COMMENT ON TABLE club_members IS 'Club membership with role-based access (owner, volunteer, member)';
COMMENT ON TABLE event_members IS 'Event participation with role-based access (owner, volunteer, member)';
COMMENT ON TABLE channels IS 'Chat channels with visibility control (public, volunteer, owner)';
COMMENT ON TABLE messages IS 'Chat messages within channels';
COMMENT ON TABLE users IS 'User accounts with system roles';

-- Add column comments for clarity
COMMENT ON COLUMN club_members.role IS 'User role in club: owner (full control), volunteer (limited access), member (basic access)';
COMMENT ON COLUMN event_members.role IS 'User role in event: owner (full control), volunteer (limited access), member (basic access)';
COMMENT ON COLUMN channels.visibility IS 'Channel visibility: public (all members), volunteer (volunteers + owners), owner (owners only)';
COMMENT ON COLUMN users.role IS 'System role: college_admin, club_owner, volunteer, member';
