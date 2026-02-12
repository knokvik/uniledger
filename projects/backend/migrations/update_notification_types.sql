-- Update notifications type check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'system', 
    'message', 
    'event_invite', 
    'club_invite', 
    'payment', 
    'join_request', 
    'join_approved', 
    'join_rejected',
    -- New types
    'club_request', 
    'event_request', 
    'request_approved', 
    'request_rejected'
));
