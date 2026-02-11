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
import { supabase } from '../config/supabase.js'

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

/**
 * POST /api/channels
 * Create a new channel
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { name, description, visibility, type, type_id } = req.body // type: 'club' | 'event'

        if (!name || !type || !type_id) {
            return res.status(400).json({ success: false, error: 'Missing required fields' })
        }

        // Check ownership
        let ownerId = null
        if (type === 'club') {
            const { data: club } = await supabase.from('clubs').select('owner_id').eq('id', type_id).single()
            ownerId = club?.owner_id
        } else if (type === 'event') {
            const { data: event } = await supabase.from('events').select('owner_id').eq('id', type_id).single()
            ownerId = event?.owner_id
        }

        if (ownerId !== userId) {
            return res.status(403).json({ success: false, error: 'Only owners can create channels' })
        }

        // Create channel
        const { data: channel, error } = await supabase
            .from('channels')
            .insert({
                name,
                description,
                visibility: visibility || 'public',
                club_id: type === 'club' ? type_id : null,
                event_id: type === 'event' ? type_id : null,
                created_by: userId
            })
            .select()
            .single()

        if (error) throw error

        res.status(201).json({ success: true, data: channel })
    } catch (error) {
        console.error('Create channel error:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * DELETE /api/channels/:id
 * Delete a channel
 */
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { id } = req.params

        // Get channel to check parent ownership
        const { data: channel, error: fetchError } = await supabase
            .from('channels')
            .select('*')
            .eq('id', id)
            .single()

        if (fetchError || !channel) {
            return res.status(404).json({ success: false, error: 'Channel not found' })
        }

        // Check ownership
        let ownerId = null
        if (channel.club_id) {
            const { data: club } = await supabase.from('clubs').select('owner_id').eq('id', channel.club_id).single()
            ownerId = club?.owner_id
        } else if (channel.event_id) {
            const { data: event } = await supabase.from('events').select('owner_id').eq('id', channel.event_id).single()
            ownerId = event?.owner_id
        }

        if (ownerId !== userId) {
            return res.status(403).json({ success: false, error: 'Only owners can delete channels' })
        }

        // Delete channel
        const { error: deleteError } = await supabase
            .from('channels')
            .delete()
            .eq('id', id)

        if (deleteError) throw deleteError

        res.json({ success: true, message: 'Channel deleted successfully' })
    } catch (error) {
        console.error('Delete channel error:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * PUT /api/channels/:id
 * Update a channel
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { id } = req.params
        const { name, visibility, description } = req.body

        // Get channel to check parent ownership
        const { data: channel, error: fetchError } = await supabase
            .from('channels')
            .select('*')
            .eq('id', id)
            .single()

        if (fetchError || !channel) {
            return res.status(404).json({ success: false, error: 'Channel not found' })
        }

        // Check ownership
        let ownerId = null
        if (channel.club_id) {
            const { data: club } = await supabase.from('clubs').select('owner_id').eq('id', channel.club_id).single()
            ownerId = club?.owner_id
        } else if (channel.event_id) {
            const { data: event } = await supabase.from('events').select('owner_id').eq('id', channel.event_id).single()
            ownerId = event?.owner_id
        }

        if (ownerId !== userId) {
            return res.status(403).json({ success: false, error: 'Only owners can update channels' })
        }

        // Update channel
        const { data: updatedChannel, error: updateError } = await supabase
            .from('channels')
            .update({
                name: name || channel.name,
                visibility: visibility || channel.visibility,
                description: description !== undefined ? description : channel.description
            })
            .eq('id', id)
            .select()
            .single()

        if (updateError) throw updateError

        res.json({ success: true, data: updatedChannel })
    } catch (error) {
        console.error('Update channel error:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

export default router
