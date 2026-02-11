import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../config/supabase.js'

const router = express.Router()

// Helper to check channel access
const checkChannelAccess = async (userId, channelId) => {
    try {
        // 1. Get channel
        const { data: channel, error } = await supabase
            .from('channels')
            .select('*')
            .eq('id', channelId)
            .single()

        if (error || !channel) return { allowed: false, error: 'Channel not found' }

        // 2. Determine parent
        const type = channel.club_id ? 'club' : 'event'
        const typeId = channel.club_id || channel.event_id

        if (!typeId) return { allowed: false, error: 'Orphan channel' }

        // 3. Check role
        let userRole = null

        if (type === 'club') {
            const { data: club } = await supabase.from('clubs').select('owner_id').eq('id', typeId).single()
            if (club?.owner_id === userId) {
                userRole = 'owner'
            } else {
                const { data: memb } = await supabase.from('club_members').select('role').eq('club_id', typeId).eq('user_id', userId).single()
                userRole = memb?.role
            }
        } else {
            const { data: event } = await supabase.from('events').select('owner_id').eq('id', typeId).single()
            if (event?.owner_id === userId) {
                userRole = 'owner'
            } else {
                const { data: memb } = await supabase.from('event_members').select('role').eq('event_id', typeId).eq('user_id', userId).single()
                userRole = memb?.role
            }
        }

        if (!userRole) return { allowed: false, error: 'Not a member' }

        // 4. Check visibility
        if (channel.visibility === 'public') return { allowed: true }
        if (channel.visibility === 'volunteer' && ['volunteer', 'owner'].includes(userRole)) return { allowed: true }
        if (channel.visibility === 'owner' && userRole === 'owner') return { allowed: true }

        return { allowed: false, error: 'Access denied' }
    } catch (e) {
        console.error('Access check error:', e)
        return { allowed: false, error: 'Server error during access check' }
    }
}

/**
 * GET /api/messages/:channelId
 * Get messages for a channel
 */
router.get('/:channelId', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { channelId } = req.params

        const access = await checkChannelAccess(userId, channelId)
        if (!access.allowed) {
            return res.status(403).json({ success: false, error: access.error })
        }

        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select(`
                *,
                users (
                    id,
                    name
                )
            `)
            .eq('channel_id', channelId)
            .order('created_at', { ascending: true })

        if (messagesError) throw messagesError

        res.json({ success: true, data: messages })
    } catch (error) {
        console.error('Fetch messages error:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * POST /api/messages
 * Send a message
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { channelId, content } = req.body

        if (!channelId || !content) {
            return res.status(400).json({ success: false, error: 'Missing required fields' })
        }

        const access = await checkChannelAccess(userId, channelId)
        if (!access.allowed) {
            return res.status(403).json({ success: false, error: access.error })
        }

        const { data: message, error: insertError } = await supabase
            .from('messages')
            .insert({
                channel_id: channelId,
                user_id: userId,
                content
            })
            .select(`
                *,
                users (
                    id,
                    name
                )
            `)
            .single()

        if (insertError) throw insertError

        res.status(201).json({ success: true, data: message })
    } catch (error) {
        console.error('Send message error:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

export default router
