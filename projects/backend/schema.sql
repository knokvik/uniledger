-- ============================================
-- UNILEDGER DATABASE SCHEMA
-- Role-Based Access Control (RBAC) System
-- Roles: Owner, Volunteer, Member
-- ============================================

-- Clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  banner_url TEXT,
  logo_url TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  banner_url TEXT,
  event_date TIMESTAMP,
  location TEXT,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  sponsor_name VARCHAR(255),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Club members table (many-to-many with roles)
CREATE TABLE IF NOT EXISTS club_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'volunteer', 'member'
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(club_id, user_id),
  CHECK (role IN ('owner', 'volunteer', 'member'))
);

-- Event members table (many-to-many with roles)
CREATE TABLE IF NOT EXISTS event_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'volunteer', 'member'
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
  visibility VARCHAR(50) NOT NULL DEFAULT 'public', -- 'public', 'volunteer', 'owner'
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

-- Add comments
COMMENT ON TABLE clubs IS 'Clubs/Organizations in the system';
COMMENT ON TABLE events IS 'Events organized by clubs or sponsors';
COMMENT ON TABLE club_members IS 'Club membership with role-based access (owner, volunteer, member)';
COMMENT ON TABLE event_members IS 'Event participation with role-based access (owner, volunteer, member)';
COMMENT ON TABLE channels IS 'Chat channels with visibility control (public, volunteer, owner)';
COMMENT ON TABLE messages IS 'Chat messages within channels';

-- Add column comments for clarity
COMMENT ON COLUMN club_members.role IS 'User role in club: owner (full control), volunteer (limited access), member (basic access)';
COMMENT ON COLUMN event_members.role IS 'User role in event: owner (full control), volunteer (limited access), member (basic access)';
COMMENT ON COLUMN channels.visibility IS 'Channel visibility: public (all members), volunteer (volunteers + owners), owner (owners only)';
