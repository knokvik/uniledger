import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import channelsRoutes from './routes/channels.js'
import membersRoutes from './routes/members.js'
import clubsRoutes from './routes/clubs.js'
import eventsRoutes from './routes/events.js'
import messagesRoutes from './routes/messages.js'
import searchRoutes from './routes/search.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Frontend URLs
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(express.static(__dirname))

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true in production with HTTPS
    httpOnly: true,
    maxAge: parseInt(process.env.COOKIE_MAX_AGE) || 86400000, // 24 hours
    sameSite: 'lax'
  }
}))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/channels', channelsRoutes)
app.use('/api/members', membersRoutes)
app.use('/api/clubs', clubsRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/search', searchRoutes)

// Test page
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'))
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'UniLedger Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      test: '/test',
      auth: {
        signup: 'POST /api/auth/signup',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        me: 'GET /api/auth/me'
      },
      dashboard: {
        getData: 'GET /api/dashboard'
      },
      channels: {
        getChannels: 'GET /api/channels/:type/:id (type: club|event)'
      },
      members: {
        getMembers: 'GET /api/members/:type/:id (type: club|event)'
      },
      clubs: {
        create: 'POST /api/clubs',
        get: 'GET /api/clubs/:id',
        update: 'PUT /api/clubs/:id'
      },
      events: {
        create: 'POST /api/events',
        get: 'GET /api/events/:id',
        update: 'PUT /api/events/:id'
      }
    }
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
  console.log(`📡 Environment: ${process.env.NODE_ENV}`)
})

export default app
