import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { getUserChannels } from '../services/dashboardService.js'

const router = express.Router()

/**
 * GET /api/channels/:type/:id
 * Get channels for a club or event based on user's role
 * type: 'club' or 'event'
 * id: club_id or event_id
 */
router.get('/:type/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { type, id } = req.params

        if (type !== 'club' && type !== 'event') {
            return res.status(400).json({
                success: false,
                error: 'Invalid type. Must be "club" or "event"'
            })
        }

        const clubId = type === 'club' ? id : null
        const eventId = type === 'event' ? id : null

        const channels = await getUserChannels(userId, clubId, eventId)

        res.json({
            success: true,
            data: channels
        })
    } catch (error) {
        console.error('Channel fetch error:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

export default router
