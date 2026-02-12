-- ============================================
-- CLUB JOIN REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS club_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'hold'
  message TEXT, -- Optional message from user when requesting
  owner_message TEXT, -- Message from owner when accepting/rejecting/holding
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(club_id, user_id), -- User can only have one active request per club
  CHECK (status IN ('pending', 'accepted', 'rejected', 'hold'))
);

-- ============================================
-- EVENT PAYMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS event_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  transaction_id VARCHAR(255) NOT NULL, -- Algorand transaction ID
  amount NUMERIC NOT NULL, -- Amount paid in ALGO
  wallet_address VARCHAR(255) NOT NULL, -- User's wallet address
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'failed'
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(transaction_id), -- Each transaction can only be used once
  CHECK (status IN ('pending', 'verified', 'failed'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_club_join_requests_club_id ON club_join_requests(club_id);
CREATE INDEX IF NOT EXISTS idx_club_join_requests_user_id ON club_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_club_join_requests_status ON club_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_event_payments_event_id ON event_payments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_user_id ON event_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_transaction_id ON event_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_event_payments_status ON event_payments(status);

-- Comments
COMMENT ON TABLE club_join_requests IS 'Join requests for clubs with owner approval workflow';
COMMENT ON TABLE event_payments IS 'Algorand payment records for event ticket purchases';
COMMENT ON COLUMN club_join_requests.status IS 'Request status: pending (awaiting review), accepted (approved), rejected (denied), hold (on hold with message)';
COMMENT ON COLUMN event_payments.status IS 'Payment status: pending (awaiting verification), verified (confirmed on blockchain), failed (verification failed)';
