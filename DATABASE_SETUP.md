# Database Setup Guide

## 🎯 Complete Setup Instructions

Follow these steps to set up your database with the new schema and seed channels.

## Step 1: Apply Schema to Supabase

### Option A: Manual (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Execute Schema**
   - Open: `projects/backend/schema.sql`
   - Copy the entire file contents
   - Paste into the SQL Editor
   - Click "Run" (or press Cmd/Ctrl + Enter)

4. **Verify Tables Created**
   - Go to "Table Editor" in left sidebar
   - You should see these tables:
     - ✅ clubs
     - ✅ events
     - ✅ club_members
     - ✅ event_members
     - ✅ channels
     - ✅ messages

### Option B: Using Migration Script

```bash
cd projects/backend
node scripts/migrate-simple.js
```

This will show you instructions for manual migration.

## Step 2: Seed Default Channels

After the schema is applied, run this script to create default channels for existing clubs and events:

```bash
cd projects/backend
node scripts/seed-channels.js
```

**What this does**:
- Finds all existing clubs and events
- Creates 3 default channels for each:
  - #general (public)
  - #announcements (public)
  - #volunteers (volunteer)
- Skips clubs/events that already have channels

**Expected Output**:
```
🌱 Starting channel seeding...

📊 Found 3 clubs
📊 Found 2 events

🏢 Creating channels for clubs...
  ✅ Created 3 channels for club "Coding Club"
  ✅ Created 3 channels for club "Design Club"
  ✅ Created 3 channels for club "Sports Club"

📅 Creating channels for events...
  ✅ Created 3 channels for event "HackFest 2026"
  ✅ Created 3 channels for event "Design Workshop"

==================================================
🎉 Seeding complete! Created 15 channels total
==================================================
```

## Step 3: Add Members to Clubs/Events

For existing clubs and events, you need to add the owner to the membership tables:

### Manual SQL (Run in Supabase SQL Editor)

```sql
-- Add owners to club_members
INSERT INTO club_members (club_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM clubs
WHERE owner_id IS NOT NULL
ON CONFLICT (club_id, user_id) DO NOTHING;

-- Add owners to event_members
INSERT INTO event_members (event_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM events
WHERE owner_id IS NOT NULL
ON CONFLICT (event_id, user_id) DO NOTHING;
```

## Step 4: Verify Setup

### Check Channels

```sql
-- See all channels
SELECT 
  c.name as channel_name,
  c.visibility,
  cl.name as club_name,
  e.title as event_title
FROM channels c
LEFT JOIN clubs cl ON c.club_id = cl.id
LEFT JOIN events e ON c.event_id = e.id
ORDER BY c.created_at;
```

### Check Members

```sql
-- See club members
SELECT 
  cl.name as club_name,
  u.email,
  cm.role
FROM club_members cm
JOIN clubs cl ON cm.club_id = cl.id
JOIN users u ON cm.user_id = u.id;

-- See event members
SELECT 
  e.title as event_title,
  u.email,
  em.role
FROM event_members em
JOIN events e ON em.event_id = e.id
JOIN users u ON em.user_id = u.id;
```

## Step 5: Test in Frontend

1. **Refresh the frontend** (http://localhost:5173)
2. **Login** with your account
3. **Click on a club or event**
4. **You should see**:
   - Secondary sidebar with club/event name
   - 3 channels listed: #general, #announcements, #volunteers
   - First channel auto-selected
   - Chat interface displayed

## 🐛 Troubleshooting

### No channels showing?

**Check 1**: Are there channels in the database?
```sql
SELECT COUNT(*) FROM channels;
```

**Check 2**: Run the seed script
```bash
node scripts/seed-channels.js
```

**Check 3**: Check browser console for errors
- Open DevTools (F12)
- Look for API errors
- Check Network tab for failed requests

### "Authentication required" error?

**Check**: Are you logged in?
- Session might have expired
- Try logging out and back in

### Channels not filtered by role?

**Check**: Is the user a member?
```sql
SELECT * FROM club_members WHERE user_id = 'your-user-id';
```

If not, add them:
```sql
INSERT INTO club_members (club_id, user_id, role)
VALUES ('club-id', 'user-id', 'owner');
```

## 📊 Expected Database State

After setup, your database should have:

### Clubs Table
```
id | name | owner_id | created_at
```

### Club Members Table
```
id | club_id | user_id | role | joined_at
```

### Channels Table
```
id | name | visibility | club_id | event_id | created_by
```

Each club/event should have 3 channels:
- general (public)
- announcements (public)
- volunteers (volunteer)

## 🚀 Next Steps

After setup is complete:

1. ✅ Channels will load dynamically
2. ✅ Role-based filtering will work
3. ✅ You can create new clubs/events (they'll auto-create channels)
4. ✅ You can add members with different roles

---

**Need Help?** Check the console logs for detailed error messages.
