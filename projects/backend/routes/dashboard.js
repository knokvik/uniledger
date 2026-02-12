import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getDashboardData, getUserClubs, getUserEvents } from '../services/dashboardService.js'

const router = express.Router()

/**
 * GET /api/dashboard
 * Get dashboard data for authenticated user
 * Returns clubs and events the user belongs to
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId

        // Fetch dashboard data using service layer
        const dashboardData = await getDashboardData(userId)

        res.json({
            success: true,
            data: dashboardData
        })
    } catch (error) {
        console.error('Dashboard fetch error:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
    }
})

/**
 * GET /api/dashboard/clubs
 * Get user's clubs only
 */
router.get('/clubs', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId
        const clubs = await getUserClubs(userId)
        res.json({ success: true, data: clubs })
    } catch (error) {
        console.error('Clubs fetch error:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * GET /api/dashboard/events
 * Get user's events only
 */
router.get('/events', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId
        const events = await getUserEvents(userId)
        res.json({ success: true, data: events })
    } catch (error) {
        console.error('Events fetch error:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

export default router
