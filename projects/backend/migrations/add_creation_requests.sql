-- Create Club Creation Requests Table
CREATE TABLE IF NOT EXISTS club_creation_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  logo_url TEXT,
  requested_by UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id)
);

-- Create Event Creation Requests Table
CREATE TABLE IF NOT EXISTS event_creation_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  logo_url TEXT,
  ticket_price NUMERIC,
  event_date TIMESTAMP,
  location TEXT,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id)
);
