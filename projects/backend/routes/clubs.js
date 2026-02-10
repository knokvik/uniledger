import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../config/supabase.js'

const router = express.Router()

/**
 * POST /api/clubs
 * Create a new club
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { name, description, banner_url, logo_url } = req.body

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Club name is required'
            })
        }

        // Create club
        const { data: club, error: clubError } = await supabase
            .from('clubs')
            .insert({
                name,
                description,
                banner_url,
                logo_url,
                owner_id: userId
            })
            .select()
            .single()

        if (clubError) {
            throw new Error(`Failed to create club: ${clubError.message}`)
        }

        // Add creator as owner in club_members
        const { error: memberError } = await supabase
            .from('club_members')
            .insert({
                club_id: club.id,
                user_id: userId,
                role: 'owner'
            })

        if (memberError) {
            // Rollback: delete the club if member insertion fails
            await supabase.from('clubs').delete().eq('id', club.id)
            throw new Error(`Failed to add owner to club: ${memberError.message}`)
        }

        // Create default channels
        const defaultChannels = [
            { name: 'general', description: 'General discussion', visibility: 'public' },
            { name: 'announcements', description: 'Important announcements', visibility: 'public' },
            { name: 'volunteers', description: 'Volunteer coordination', visibility: 'volunteer' }
        ]

        const channelsToInsert = defaultChannels.map(ch => ({
            ...ch,
            club_id: club.id,
            created_by: userId
        }))

        const { error: channelError } = await supabase
            .from('channels')
            .insert(channelsToInsert)

        if (channelError) {
            console.error('Failed to create default channels:', channelError)
            // Don't fail the whole operation, just log the error
        }

        res.status(201).json({
            success: true,
            data: club,
            message: 'Club created successfully!'
        })
    } catch (error) {
        console.error('Club creation error:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

/**
 * GET /api/clubs/:id
 * Get club details
 */
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params

        const { data: club, error } = await supabase
            .from('clubs')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            throw new Error(`Failed to fetch club: ${error.message}`)
        }

        res.json({
            success: true,
            data: club
        })
    } catch (error) {
        console.error('Club fetch error:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

/**
 * PUT /api/clubs/:id
 * Update club details (owner only)
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { id } = req.params
        const { name, description, banner_url, logo_url } = req.body

        // Check if user is owner
        const { data: membership } = await supabase
            .from('club_members')
            .select('role')
            .eq('club_id', id)
            .eq('user_id', userId)
            .single()

        if (membership?.role !== 'owner') {
            return res.status(403).json({
                success: false,
                error: 'Only club owners can update club details'
            })
        }

        // Update club
        const { data: club, error } = await supabase
            .from('clubs')
            .update({
                name,
                description,
                banner_url,
                logo_url,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to update club: ${error.message}`)
        }

        res.json({
            success: true,
            data: club,
            message: 'Club updated successfully!'
        })
    } catch (error) {
        console.error('Club update error:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

export default router
