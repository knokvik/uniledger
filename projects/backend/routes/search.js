import express from 'express'
import { supabase } from '../config/supabase.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

/**
 * GET /api/search
 * Search for clubs and events
 * Query param: q (search term)
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const { q } = req.query

        if (!q || q.trim().length === 0) {
            return res.json({
                success: true,
                data: { clubs: [], events: [] }
            })
        }

        const query = q.trim()

        // Parallel search requests
        const [clubsResponse, eventsResponse] = await Promise.all([
            supabase
                .from('clubs')
                .select('*')
                .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
                .limit(10),

            supabase
                .from('events')
                .select('*')
                .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
                .limit(10)
        ])

        if (clubsResponse.error) throw clubsResponse.error
        if (eventsResponse.error) throw eventsResponse.error

        res.json({
            success: true,
            data: {
                clubs: clubsResponse.data || [],
                events: eventsResponse.data || []
            }
        })

    } catch (error) {
        console.error('Search API error:', error)
        res.status(500).json({ success: false, error: 'Failed to perform search' })
    }
})

export default router
