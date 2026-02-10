# 🗄️ Supabase Database Setup Guide

## ⚠️ IMPORTANT: You Must Complete This Setup First!

The authentication errors you're seeing (401, 500) are because the `users` table doesn't exist in your Supabase database yet. Follow these steps to fix it:

---

## 📋 Step-by-Step Setup Instructions

### Step 1: Access Supabase SQL Editor

1. Open your Supabase project dashboard:
   ```
   https://xalcfoerplflookalapw.supabase.co
   ```

2. In the left sidebar, click on **"SQL Editor"**

3. Click **"New Query"** button

### Step 2: Run the Setup SQL Script

Copy the **entire** SQL script from `setup.sql` (or copy from below) and paste it into the SQL Editor:

```sql
-- UniLedger Database Setup Script
-- Run this in your Supabase SQL Editor to create the necessary tables

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Create policy to allow users to update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Note: Insert operations are handled by the backend with service role key
-- so we don't need an RLS policy for INSERT

-- Verify table creation
SELECT 'Users table created successfully!' as status;
```

### Step 3: Execute the Script

1. Click the **"Run"** button (or press `Ctrl+Enter` / `Cmd+Enter`)
2. You should see a success message: `"Users table created successfully!"`

### Step 4: Verify Table Creation

1. In the left sidebar, click on **"Table Editor"**
2. You should now see a `users` table listed
3. Click on it to verify the columns:
   - `id` (UUID, Primary Key)
   - `email` (VARCHAR, Unique)
   - `password` (TEXT)
   - `name` (VARCHAR, Optional)
   - `created_at` (TIMESTAMP)
   - `last_login` (TIMESTAMP)

---

## ✅ Testing After Setup

Once the table is created, test your authentication:

### Option 1: Use the Frontend

1. Make sure your backend is running:
   ```bash
   cd projects/backend
   npm run dev
   ```

2. Make sure your frontend is running:
   ```bash
   cd projects/frontend
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`
4. Try to **register** a new account
5. Then try to **login** with those credentials

### Option 2: Use the Backend Test Page

1. Open `http://localhost:3000/test` in your browser
2. Test the signup and login functionality directly

### Option 3: Use cURL

**Sign Up:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}' \
  -c cookies.txt
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -c cookies.txt
```

---

## 🔍 Troubleshooting

### Error: "relation 'users' does not exist"
- **Solution:** You haven't run the SQL script yet. Go back to Step 2.

### Error: "duplicate key value violates unique constraint"
- **Solution:** You're trying to register with an email that already exists. Use a different email or delete the existing user from the Supabase Table Editor.

### Error: "Invalid email or password" on login
- **Solution:** Make sure you're using the exact email and password you registered with. Passwords are case-sensitive.

### Still getting 401/500 errors?
1. Check that your `.env` file has the correct Supabase credentials
2. Verify the table was created in the **correct** Supabase project
3. Check the backend console logs for detailed error messages
4. Make sure your backend server is running on port 3000

---

## 🔐 Security Notes

- **Passwords are hashed** using bcrypt with 10 salt rounds before storage
- **Row Level Security (RLS)** is enabled to protect user data
- The backend uses the **service role key** for admin operations
- Sessions are managed with **httpOnly cookies** to prevent XSS attacks

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase SQL Editor Guide](https://supabase.com/docs/guides/database/overview)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✨ What's Next?

After setting up the database:

1. ✅ Test user registration
2. ✅ Test user login
3. ✅ Verify session persistence
4. ✅ Test logout functionality
5. ✅ Start building your application features!

---

**Need Help?** Check the backend logs at `http://localhost:3000` for detailed error messages.
