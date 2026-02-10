import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../config/supabase.js'

const router = express.Router()

/**
 * GET /api/members/:type/:id
 * Get members for a club or event based on user's role
 * type: 'club' or 'event'
 * id: club_id or event_id
 * 
 * Visibility:
 * - All users see: members
 * - Organizers/Volunteers see: members + volunteers
 * - Organizers see: members + volunteers + organizers (all)
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

        // Get user's role
        const memberTable = type === 'club' ? 'club_members' : 'event_members'
        const idField = type === 'club' ? 'club_id' : 'event_id'

        const { data: userMembership } = await supabase
            .from(memberTable)
            .select('role')
            .eq(idField, id)
            .eq('user_id', userId)
            .single()

        const userRole = userMembership?.role || 'member'

        // Build query based on role
        let query = supabase
            .from(memberTable)
            .select(`
        role,
        joined_at,
        users (
          id,
          email,
          full_name
        )
      `)
            .eq(idField, id)

        // Filter based on user's role
        if (userRole === 'owner') {
            // Owners see all members
        } else if (userRole === 'volunteer') {
            // Volunteers see members and volunteers only
            query = query.in('role', ['member', 'volunteer'])
        } else {
            // Members see only other members
            query = query.eq('role', 'member')
        }

        const { data: members, error } = await query.order('joined_at', { ascending: true })

        if (error) {
            throw new Error(`Failed to fetch members: ${error.message}`)
        }

        // Format response
        const formattedMembers = (members || []).map(m => ({
            user_id: m.users.id,
            name: m.users.full_name || 'Unknown User',
            email: m.users.email,
            role: m.role,
            joined_at: m.joined_at
        }))

        res.json({
            success: true,
            data: {
                members: formattedMembers,
                user_role: userRole
            }
        })
    } catch (error) {
        console.error('Members fetch error:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

export default router
