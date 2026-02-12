# Profile Image Upload Setup Guide

## 🎯 Complete Setup Instructions

This guide will help you set up profile image uploads using Supabase Storage.

## Step 1: Run Database Migration

Run the following SQL in your Supabase SQL Editor:

```sql
-- Add avatar_url column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Create trigger
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Step 2: Create Supabase Storage Bucket

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Navigate to Storage**
   - Click "Storage" in the left sidebar
   - Click "New bucket" button

3. **Create the 'profiles' Bucket**
   - Bucket name: `profiles`
   - Public bucket: **Yes** ✅ (Important!)
   - File size limit: 5MB (recommended)
   - Click "Create bucket"

##Step 3: Set Storage Policies (Optional but Recommended)

For better security, set up Row Level Security policies for the storage bucket:

```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profiles');

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profiles');
```

## Step 4: Access the Profile Page

1. **Start the servers** (if not already running):
   ```bash
   # Backend
   cd projects/backend
   npm run dev

   # Frontend
   cd projects/frontend
   npm run dev
   ```

2. **Navigate to Profile Page**:
   - Login to your account
   - Go to: http://localhost:5173/profile
   - Or add a link in the Dashboard sidebar

## Step 5: Test Image Upload

1. Click "Choose Image" button
2. Select an image (max 5MB, JPG/PNG/GIF)
3. Click "Upload Avatar"
4. Your image will be:
   - Uploaded to Supabase Storage (`profiles/avatars/`)
   - URL saved to`avatar_url` in the users table
   - Displayed immediately in the profile

## 🔧 API Endpoints

### Upload Avatar
```
POST /api/profile/upload-avatar
Content-Type: multipart/form-data
Authentication: Required (session)

Body:
- avatar: File (image file)

Response:
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatar_url": "https://...supabase.co/storage/v1/object/public/profiles/avatars/..."
  }
}
```

### Update Profile
```
PUT /api/profile
Content-Type: application/json
Authentication: Required (session)

Body:
{
  "name": "New Name"
}

Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "New Name",
    "avatar_url": "..."
  }
}
```

### Get Profile
```
GET /api/profile
Authentication: Required (session)

Response:
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatar_url": "...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

## 📁 File Structure

```
projects/
├── backend/
│   ├── routes/
│   │   └── profile.js          # Profile API endpoints
│   ├── migrations/
│   │   └── add_avatar_to_users.sql
│   └── server.js               # Updated with profile routes
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Profile.tsx     # Profile page component
    │   ├── api/
    │   │   └── auth.ts         # Updated with avatar_url type
    │   └── App.tsx             # Updated with /profile route
```

## 🐛 Troubleshooting

### Avatar not uploading?

**Check 1**: Is the storage bucket created and public?
- Go to Supabase Dashboard > Storage
- Verify 'profiles' bucket exists and is public

**Check 2**: Check browser console for errors
- Open DevTools (F12)
- Look for upload errors

**Check 3**: Check backend logs
- Look at the terminal running `npm run dev`
- Check for Supabase Storage errors

### Image not displaying?

**Check 1**: Is the URL valid?
```sql
SELECT avatar_url FROM users WHERE email = 'your-email@example.com';
```

**Check 2**: Is the bucket public?
- The bucket MUST be public for images to display
- Go to Storage > profiles > Settings > Make public

### Upload fails with "413 Payload Too Large"?

**Solution**: Image file is too large
- Maximum size: 5MB
- Compress the image before uploading
- Or increase the limit in backend/routes/profile.js

## 🎨 Customization

### Change Upload Limits

Edit `projects/backend/routes/profile.js`:
```javascript
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // Change to 10MB
    },
    // ...
});
```

### Add Image Compression

Install sharp:
```bash
cd projects/backend
npm install sharp
```

Update profile route:
```javascript
import sharp from 'sharp';

// Before uploading to Supabase
const compressedBuffer = await sharp(file.buffer)
    .resize(400, 400, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();

// Upload compressedBuffer instead of file.buffer
```

---

**Need Help?** Check the console logs for detailed error messages.
