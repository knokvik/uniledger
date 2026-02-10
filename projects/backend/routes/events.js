import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../config/supabase.js'

const router = express.Router()

/**
 * POST /api/events
 * Create a new event
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { title, description, banner_url, event_date, location, club_id, sponsor_name } = req.body

        if (!title) {
            return res.status(400).json({
                success: false,
                error: 'Event title is required'
            })
        }

        // Create event
        const { data: event, error: eventError } = await supabase
            .from('events')
            .insert({
                title,
                description,
                banner_url,
                event_date,
                location,
                club_id,
                sponsor_name,
                owner_id: userId
            })
            .select()
            .single()

        if (eventError) {
            throw new Error(`Failed to create event: ${eventError.message}`)
        }

        // Add creator as owner in event_members
        const { error: memberError } = await supabase
            .from('event_members')
            .insert({
                event_id: event.id,
                user_id: userId,
                role: 'owner'
            })

        if (memberError) {
            // Rollback: delete the event if member insertion fails
            await supabase.from('events').delete().eq('id', event.id)
            throw new Error(`Failed to add owner to event: ${memberError.message}`)
        }

        // Create default channels
        const defaultChannels = [
            { name: 'general', description: 'General discussion', visibility: 'public' },
            { name: 'announcements', description: 'Event announcements', visibility: 'public' },
            { name: 'volunteers', description: 'Volunteer coordination', visibility: 'volunteer' }
        ]

        const channelsToInsert = defaultChannels.map(ch => ({
            ...ch,
            event_id: event.id,
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
            data: event,
            message: 'Event created successfully!'
        })
    } catch (error) {
        console.error('Event creation error:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

/**
 * GET /api/events/:id
 * Get event details
 */
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params

        const { data: event, error } = await supabase
            .from('events')
            .select(`
        *,
        clubs (
          id,
          name
        )
      `)
            .eq('id', id)
            .single()

        if (error) {
            throw new Error(`Failed to fetch event: ${error.message}`)
        }

        res.json({
            success: true,
            data: event
        })
    } catch (error) {
        console.error('Event fetch error:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

/**
 * PUT /api/events/:id
 * Update event details (owner only)
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { id } = req.params
        const { title, description, banner_url, event_date, location, club_id, sponsor_name } = req.body

        // Check if user is owner
        const { data: membership } = await supabase
            .from('event_members')
            .select('role')
            .eq('event_id', id)
            .eq('user_id', userId)
            .single()

        if (membership?.role !== 'owner') {
            return res.status(403).json({
                success: false,
                error: 'Only event owners can update event details'
            })
        }

        // Update event
        const { data: event, error } = await supabase
            .from('events')
            .update({
                title,
                description,
                banner_url,
                event_date,
                location,
                club_id,
                sponsor_name,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to update event: ${error.message}`)
        }

        res.json({
            success: true,
            data: event,
            message: 'Event updated successfully!'
        })
    } catch (error) {
        console.error('Event update error:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

export default router
