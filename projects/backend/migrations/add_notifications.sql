-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'join_request', 'join_accepted', 'join_rejected', 'join_hold', 'payment_verified'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- ID of related entity (club_id, event_id, request_id, payment_id)
  related_type VARCHAR(50), -- 'club', 'event', 'join_request', 'payment'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (type IN ('join_request', 'join_accepted', 'join_rejected', 'join_hold', 'payment_verified'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Comments
COMMENT ON TABLE notifications IS 'User notifications for join requests, payments, and other events';
COMMENT ON COLUMN notifications.type IS 'Notification type: join_request, join_accepted, join_rejected, join_hold, payment_verified';
