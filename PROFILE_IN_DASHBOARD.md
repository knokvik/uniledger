# Quick Setup: Profile Settings in Dashboard

## ✅ What's Implemented:

When you click the **⚙️ Settings** icon in the bottom-left user profile section of the Dashboard, a modal will pop up allowing you to:

1. **Upload Profile Picture** - Upload to Supabase Storage
2. **Edit Name** - Update your display name
3. **View Email** - Your email (read-only)

## 🚀 Setup Instructions (3 Steps):

### Step 1: Add `avatar_url` Column to Users Table

Run this in **Supabase SQL Editor**:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
```

### Step 2: Create Supabase Storage Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Name: `profiles`
4. **Public**: ✅ **YES** (Important!)
5. Click **"Create"**

### Step 3: Test It!

1. Go to: **http://localhost:5173**
2. Login to your account
3. Look at the **bottom-left** of the Dashboard sidebar
4. Click the **⚙️ Settings** icon next to your name
5. The profile modal will open!

## 📸 Features:

- ✅ **Upload Avatar** - Images stored in Supabase Storage (`profiles/avatars/`)
- ✅ **Edit Name** - Update your display name
- ✅ **Live Preview** - See your avatar before uploading
- ✅ **Validation** - Max 5MB, images only
- ✅ **Inline Modal** - No separate route needed
- ✅ **Auto-refresh** - Page reloads after changes to show updates

## 🎯 Where is it?

**Location**: Dashboard → Bottom-left sidebar → Click **⚙️** icon next to your profile

```
┌─────────────────────┐
│  Dashboard          │
│                     │
│  📊 Dashboard       │
│  🏢 My Clubs        │
│  📅 Events          │
│                     │
│  ───────────────    │ 
│  👤 Your Name       │ ← Bottom of sidebar
│     your@email.com  │
│                 ⚙️  │ ← Click this
│  [Logout]           │
└─────────────────────┘
```

## 🐛 Troubleshooting:

### Modal not opening?
- Check browser console for errors
- Make sure servers are running (`npm run dev` in both backend and frontend)

### Avatar not uploading?
- Make sure you created the `profiles` bucket in Supabase Storage
- Make sure the bucket is **PUBLIC**
- Check backend logs for upload errors

### Avatar not showing?
- Run the SQL migration (Step 1)
- Check that `avatar_url` column exists in users table

---

**That's it!** Click the gear icon and start customizing your profile! 🎉
