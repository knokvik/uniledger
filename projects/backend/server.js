import { setDefaultResultOrder } from 'node:dns'
if (setDefaultResultOrder) setDefaultResultOrder('ipv4first')

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
import profileRoutes from './routes/profile.js'
import joinRequestsRoutes from './routes/join-requests.js'
import paymentsRoutes from './routes/payments.js'
import notificationsRoutes from './routes/notifications.js'
import adminRoutes from './routes/adminRoutes.js'

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
app.use('/api/admin', adminRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/channels', channelsRoutes)
app.use('/api/members', membersRoutes)
app.use('/api/clubs', clubsRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/join-requests', joinRequestsRoutes)
app.use('/api/payments', paymentsRoutes)
app.use('/api/notifications', notificationsRoutes)

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
      auth: '/api/auth',
      admin: '/api/admin',
      dashboard: '/api/dashboard'
    }
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err) // Log full error object
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: err.name || 'Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
  console.log(`📡 Environment: ${process.env.NODE_ENV}`)
})

export default app
