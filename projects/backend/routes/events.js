import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { supabase } from '../config/supabase.js'

const router = express.Router()

/**
 * GET /api/events
 * List active events
 */
router.get('/', async (req, res) => {
    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('*')
            .eq('status', 'active') // Only show active events
            .order('event_date', { ascending: true })

        if (error) throw error

        res.json({
            success: true,
            data: events
        })
    } catch (error) {
        console.error('List events error:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

/**
 * POST /api/events
 * Create a new event (Starts as 'pending')
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId
        const { title, description, banner_url, event_date, location, club_id, sponsor_name, channels, wallet_address, ticket_price } = req.body

        if (!title) {
            return res.status(400).json({ success: false, error: 'Event title is required' })
        }

        // Create event with 'pending' status
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
                wallet_address,
                ticket_price,
                owner_id: userId,

                status: 'active' // For testing: Auto-approve events
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
            await supabase.from('events').delete().eq('id', event.id)
            throw new Error(`Failed to add owner to event: ${memberError.message}`)
        }

        // Create default channels
        const channelsToCreate = (channels && Array.isArray(channels) && channels.length > 0)
            ? channels
            : [
                { name: 'general', description: 'General discussion', visibility: 'public' },
                { name: 'announcements', description: 'Event announcements', visibility: 'public' },
                { name: 'volunteers', description: 'Volunteer coordination', visibility: 'volunteer' }
            ]

        const channelsToInsert = channelsToCreate.map(ch => ({
            name: ch.name || 'channel',
            description: ch.description || '',
            visibility: ch.visibility || 'public',
            event_id: event.id,
            created_by: userId
        }))

        await supabase.from('channels').insert(channelsToInsert)

        // NOTIFY ADMINS
        const { data: admins } = await supabase.from('users').select('id').eq('role', 'college_admin')
        if (admins && admins.length > 0) {
            const notifications = admins.map(admin => ({
                user_id: admin.id,
                type: 'approval_request',
                title: 'New Event Request',
                message: `Event "${title}" requires approval.`,
                related_id: event.id,
                related_type: 'event'
            }))
            await supabase.from('notifications').insert(notifications)
        }

        res.status(201).json({
            success: true,
            data: event,
            message: 'Event request submitted! Pending admin approval.'
        })
    } catch (error) {
        console.error('Event creation error:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * GET /api/events/:id
 * Get event details
 */
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.session.userId

        const { data: event, error } = await supabase
            .from('events')
            .select(`*, clubs (id, name)`)
            .eq('id', id)
            .single()

        if (error || !event) {
            return res.status(404).json({ success: false, error: 'Event not found' })
        }

        // Access Control for Pending events
        if (event.status !== 'active') {
            const { data: user } = await supabase.from('users').select('role').eq('id', userId).single()
            const isAdmin = user?.role === 'college_admin'

            if (!isAdmin && event.owner_id !== userId) {
                return res.status(403).json({ success: false, error: 'Event is pending approval.' })
            }
        }

        res.json({ success: true, data: event })
    } catch (error) {
        console.error('Event fetch error:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * PUT /api/events/:id
 * Update event details (owner only)
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId
        const { id } = req.params
        const { title, description, banner_url, event_date, location, club_id, sponsor_name, wallet_address, ticket_price } = req.body

        const { data: event } = await supabase
            .from('events')
            .select('owner_id')
            .eq('id', id)
            .single()

        if (event?.owner_id !== userId) {
            return res.status(403).json({ success: false, error: 'Only event owners can update details' })
        }

        const { data: updatedEvent, error } = await supabase
            .from('events')
            .update({
                title, description, banner_url, event_date, location, club_id, sponsor_name, wallet_address, ticket_price,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        res.json({ success: true, data: updatedEvent })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * DELETE /api/events/:id
 * Delete an event (owner only)
 */
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId
        const { id } = req.params

        // Verify ownership first
        const { data: event, error: fetchError } = await supabase
            .from('events')
            .select('owner_id')
            .eq('id', id)
            .single()

        if (fetchError || !event) {
            return res.status(404).json({ success: false, error: 'Event not found' })
        }

        if (event.owner_id !== userId) {
            return res.status(403).json({ success: false, error: 'Only the requestor can delete this event' })
        }

        // Delete the event
        const { error: deleteError } = await supabase
            .from('events')
            .delete()
            .eq('id', id)

        if (deleteError) {
            throw deleteError
        }

        res.json({
            success: true,
            message: 'Event deleted successfully'
        })

    } catch (error) {
        console.error('Delete event error:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

export default router
