# UniLedger Backend

Backend server for UniLedger with authentication, password encryption, and session management.

## Features

- ✅ Express.js server running on port 3000
- ✅ Bcrypt password encryption
- ✅ Supabase database integration
- ✅ Session-based authentication with cookies
- ✅ Login and Signup endpoints
- ✅ CORS enabled for frontend

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update with your Supabase credentials (already configured)

3. Create users table in Supabase:
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on: `http://localhost:3000`

## API Endpoints

### Authentication

#### POST `/api/auth/signup`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword",
  "name": "John Doe" (optional)
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### POST `/api/auth/login`
Login existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### POST `/api/auth/logout`
Logout current user.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET `/api/auth/me`
Get current logged-in user.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2026-02-11T00:00:00.000Z"
  }
}
```

### Health Check

#### GET `/health`
Check if server is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## Security Features

- **Password Encryption**: All passwords are hashed using bcrypt with 10 salt rounds
- **Session Management**: Express sessions with secure cookies
- **HttpOnly Cookies**: Prevents XSS attacks
- **CORS Protection**: Configured for specific frontend origin
- **Validation**: Input validation on all endpoints

## Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY`: Supabase API key
- `SESSION_SECRET`: Secret key for session encryption
- `COOKIE_MAX_AGE`: Cookie expiration time in milliseconds

## Project Structure

```
backend/
├── config/
│   └── supabase.js       # Supabase client configuration
├── middleware/
│   └── auth.js           # Authentication middleware
├── routes/
│   └── auth.js           # Authentication routes
├── .env                  # Environment variables
├── .env.example          # Environment template
├── .gitignore           # Git ignore file
├── package.json         # Dependencies
├── server.js            # Main server file
└── README.md            # Documentation
```
