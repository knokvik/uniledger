# Role-Based Access Control (RBAC) System

## 🎯 Overview

UniLedger now implements a comprehensive role-based access control system for clubs and events with three distinct roles:

1. **Owner** - Full control over club/event
2. **Volunteer** - Limited access with special permissions
3. **Member** - Basic access to public resources

## 📊 Database Schema

### Tables Created

#### 1. **clubs**
- Stores club information
- `owner_id`: References the user who created the club
- Fields: name, description, banner_url, logo_url

#### 2. **events**
- Stores event information
- `owner_id`: References the user who created the event
- Fields: title, description, banner_url, event_date, location, club_id, sponsor_name

#### 3. **club_members** (NEW)
- Many-to-many relationship between users and clubs
- **`role`**: 'owner', 'volunteer', or 'member'
- Tracks when user joined
- Unique constraint: one role per user per club

#### 4. **event_members** (NEW)
- Many-to-many relationship between users and events
- **`role`**: 'owner', 'volunteer', or 'member'
- Tracks when user joined
- Unique constraint: one role per user per event

#### 5. **channels**
- Chat channels for clubs and events
- **`visibility`**: 'public', 'volunteer', or 'owner'
- Determines who can see/access the channel

#### 6. **messages**
- Chat messages within channels
- References channel_id and user_id

### Channel Visibility Rules

| User Role | Can See |
|-----------|---------|
| **Owner** | All channels (public, volunteer, owner) |
| **Volunteer** | Public + Volunteer channels |
| **Member** | Public channels only |

## 🔐 Access Control Matrix

### Club/Event Permissions

| Action | Owner | Volunteer | Member |
|--------|-------|-----------|--------|
| View public channels | ✅ | ✅ | ✅ |
| View volunteer channels | ✅ | ✅ | ❌ |
| View owner channels | ✅ | ❌ | ❌ |
| Edit club/event details | ✅ | ❌ | ❌ |
| Add/remove channels | ✅ | ❌ | ❌ |
| Manage members | ✅ | ❌ | ❌ |
| Delete club/event | ✅ | ❌ | ❌ |

## 📝 API Response Format

### Dashboard Data

```json
{
  "success": true,
  "data": {
    "clubs": [
      {
        "id": "uuid",
        "name": "Coding Club",
        "description": "Learn to code together",
        "banner_url": "https://...",
        "logo_url": "https://...",
        "owner_id": "uuid",
        "user_role": "owner",
        "member_count": 48,
        "channel_count": 5,
        "joined_at": "2026-01-15T10:00:00Z",
        "created_at": "2026-01-01T00:00:00Z"
      }
    ],
    "events": [
      {
        "id": "uuid",
        "title": "HackFest 2026",
        "description": "24-hour hackathon",
        "banner_url": "https://...",
        "event_date": "2026-03-15T09:00:00Z",
        "location": "Main Auditorium",
        "club_id": "uuid",
        "club_name": "Coding Club",
        "sponsor_name": null,
        "owner_id": "uuid",
        "user_role": "volunteer",
        "participant_count": 120,
        "channel_count": 3,
        "joined_at": "2026-01-20T14:00:00Z",
        "created_at": "2026-01-10T00:00:00Z"
      }
    ]
  }
}
```

## 🚀 Migration Instructions

### Option 1: Automatic Migration (Recommended)

```bash
cd projects/backend
node scripts/migrate-simple.js
```

This will:
- Check Supabase connection
- Provide instructions for manual migration
- Verify tables after creation

### Option 2: Manual Migration

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy Schema**
   - Open: `projects/backend/schema.sql`
   - Copy entire contents

4. **Execute**
   - Paste into SQL Editor
   - Click "Run" (or Cmd/Ctrl + Enter)

5. **Verify**
   - Check "Table Editor" to see new tables
   - Should see: clubs, events, club_members, event_members, channels, messages

## 🔧 Backend Service Updates

### New Functions

#### `getUserClubs(userId)`
- Returns clubs where user is a member (any role)
- Includes user's role, member count, channel count
- Sorted by join date

#### `getUserEvents(userId)`
- Returns events where user is a participant (any role)
- Includes user's role, participant count, channel count
- Sorted by join date

#### `getUserChannels(userId, clubId, eventId)`
- Returns channels user can access based on role
- Filters by visibility (public/volunteer/owner)
- Sorted by creation date

## 📱 Frontend Updates

### Console Logging

**When clicking a club:**
```
Club: {
  id: "abc-123",
  name: "Coding Club",
  user_role: "owner",
  member_count: 48,
  channel_count: 5,
  ...
}
Clicked club: abc-123 Coding Club
User role: owner
Auto-selected channel: general
Total channels: 5
```

**When clicking an event:**
```
Event: {
  id: "xyz-789",
  title: "HackFest 2026",
  user_role: "volunteer",
  participant_count: 120,
  channel_count: 3,
  ...
}
Clicked event: xyz-789 HackFest 2026
User role: volunteer
Auto-selected channel: general
Total channels: 3
```

## 🎨 UI Features by Role

### Owner View
- ✅ See all channels (public, volunteer, owner)
- ✅ Edit button for club/event details
- ✅ Manage members button
- ✅ Add/remove channels
- ✅ Delete club/event option

### Volunteer View
- ✅ See public + volunteer channels
- ✅ "Volunteer" badge displayed
- ❌ No edit permissions
- ❌ Cannot manage members

### Member View
- ✅ See public channels only
- ✅ "Member" badge displayed
- ❌ No edit permissions
- ❌ Cannot see volunteer/owner channels

## 📦 Example Data Structure

### Creating a Club with Members

```sql
-- 1. Create club
INSERT INTO clubs (name, description, owner_id)
VALUES ('Coding Club', 'Learn to code', 'user-123');

-- 2. Add owner to club_members
INSERT INTO club_members (club_id, user_id, role)
VALUES ('club-456', 'user-123', 'owner');

-- 3. Add volunteers
INSERT INTO club_members (club_id, user_id, role)
VALUES ('club-456', 'user-789', 'volunteer');

-- 4. Add members
INSERT INTO club_members (club_id, user_id, role)
VALUES ('club-456', 'user-101', 'member');

-- 5. Create channels
INSERT INTO channels (name, visibility, club_id)
VALUES 
  ('general', 'public', 'club-456'),
  ('announcements', 'public', 'club-456'),
  ('volunteers', 'volunteer', 'club-456'),
  ('organizers', 'owner', 'club-456');
```

## 🔄 Workflow Examples

### Scenario 1: User Joins a Club

1. User clicks "Join Club"
2. Backend creates entry in `club_members` with role='member'
3. User can now see club in dashboard
4. User can access public channels only

### Scenario 2: User Promoted to Volunteer

1. Owner promotes user
2. Backend updates `club_members` set role='volunteer'
3. User can now see volunteer channels
4. UI shows "Volunteer" badge

### Scenario 3: Owner Creates New Channel

1. Owner clicks "Add Channel"
2. Selects visibility: public/volunteer/owner
3. Backend creates channel with visibility setting
4. Only users with appropriate role can see it

## 🚧 Next Steps

### To Implement

1. **Channel Management UI**
   - Add channel creation form (owners only)
   - Channel visibility selector
   - Edit/delete channel options

2. **Member Management UI**
   - View all members
   - Change member roles
   - Remove members

3. **Role-Based UI**
   - Show/hide edit buttons based on role
   - Display role badges
   - Filter channels by visibility

4. **Real-Time Updates**
   - WebSocket for live chat
   - Real-time member count updates
   - Channel notifications

---

**Status**: ✅ Schema Complete | ⏳ Migration Pending | 🔄 UI Updates In Progress
