-- Add status to clubs
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'status') THEN
        ALTER TABLE clubs ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        ALTER TABLE clubs ADD CONSTRAINT clubs_status_check CHECK (status IN ('active', 'suspended'));
    END IF;
END $$;

-- Add status to events
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'status') THEN
        ALTER TABLE events ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        ALTER TABLE events ADD CONSTRAINT events_status_check CHECK (status IN ('active', 'cancelled'));
    END IF;
END $$;

-- Add role to users (assuming users table exists)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'member';
        ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('college_admin', 'club_owner', 'volunteer', 'member'));
    END IF;
END $$;
