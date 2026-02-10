# Backend Setup Instructions

## ✅ Server Status
Your backend server is now **running on port 3000**!

## 🗄️ Database Setup (Important!)

Before you can use login/signup, you need to create the users table in Supabase:

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project: https://xalcfoerplflookalapw.supabase.co
2. Navigate to the **SQL Editor** in the left sidebar
3. Click **"New Query"**

### Step 2: Run the SQL Script
Copy and paste this SQL script into the editor:

```sql
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
```

### Step 3: Execute the Script
Click **"Run"** or press `Ctrl+Enter` to create the table.

✅ You can also find this SQL in the `setup.sql` file.

## 🧪 Testing the API

### Option 1: Use the Test Page (Recommended)
Open in your browser:
```
http://localhost:3000/test
```

This provides a beautiful UI to test all authentication features:
- Sign Up
- Login
- Get User Info
- Logout

### Option 2: Use cURL

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

**Get Current User:**
```bash
curl http://localhost:3000/api/auth/me -b cookies.txt
```

**Logout:**
```bash
curl -X POST http://localhost:3000/api/auth/logout -b cookies.txt
```

### Option 3: Use Postman or Thunder Client
1. Import the endpoints from the README.md
2. Make sure to enable "Send cookies" in settings

## 🔐 Security Features Implemented

✅ **Bcrypt Password Hashing** - All passwords are encrypted with 10 salt rounds
✅ **Session Management** - Express sessions with secure cookies
✅ **HttpOnly Cookies** - Prevents XSS attacks
✅ **CORS Protection** - Configured for your frontend
✅ **Input Validation** - All endpoints validate input
✅ **Secure by Default** - Production-ready security settings

## 📡 API Endpoints

```
POST   /api/auth/signup   - Register new user
POST   /api/auth/login    - Login user
POST   /api/auth/logout   - Logout user
GET    /api/auth/me       - Get current user info
GET    /health            - Health check
GET    /test              - Test page UI
```

## 🌐 Connecting from Frontend

In your React/Next.js frontend, use fetch with `credentials: 'include'`:

```javascript
// Login example
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Important for cookies!
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
})

const data = await response.json()
```

## 🔧 Configuration

All configuration is in `.env`:
- `PORT=3000` - Server port
- `SUPABASE_URL` - Your Supabase project URL (already set)
- `SUPABASE_PUBLISHABLE_KEY` - Your API key (already set)
- `SESSION_SECRET` - Session encryption key (change in production!)
- `COOKIE_MAX_AGE` - Cookie lifetime (24 hours by default)

## 🚀 Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## 📦 What's Included

```
backend/
├── config/
│   └── supabase.js          # Supabase client
├── middleware/
│   └── auth.js              # Auth middleware
├── routes/
│   └── auth.js              # Auth endpoints
├── .env                     # Environment variables (configured)
├── .env.example             # Environment template
├── package.json             # Dependencies
├── server.js                # Main server
├── setup.sql                # Database setup
├── test.html                # Test UI
├── test-api.js              # Test script
└── README.md                # Documentation
```

## 🎉 Next Steps

1. ✅ Create the database table in Supabase (see above)
2. ✅ Test the API at http://localhost:3000/test
3. ✅ Integrate with your frontend
4. ✅ Update SESSION_SECRET before deploying

---

**Server is running at:** http://localhost:3000
**Test page:** http://localhost:3000/test
**Health check:** http://localhost:3000/health
