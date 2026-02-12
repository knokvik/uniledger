import express from 'express'
import { requireAuth } from '../middleware/authMiddleware.js' // Use new unified middleware
import { supabase } from '../config/supabase.js'

const router = express.Router()

/**
 * GET /api/clubs
 * List active clubs
 */
router.get('/', async (req, res) => {
    try {
        const { data: clubs, error } = await supabase
            .from('clubs')
            .select('id, name, description, banner_url, logo_url, created_at')
            .eq('status', 'active') // Only show active clubs
            .order('created_at', { ascending: false })

        if (error) throw error

        res.json({
            success: true,
            data: clubs
        })
    } catch (error) {
        console.error('List clubs error:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

/**
 * POST /api/clubs
 * Request to create a new club (Starts as 'pending')
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId // Use session ID from authMiddleware
        const { name, description, banner_url, logo_url, channels } = req.body

        // Validation: All fields are mandatory
        if (!name || !description || !banner_url || !logo_url) {
            return res.status(400).json({
                success: false,
                error: 'All fields (Name, Description, Banner URL, Logo URL) are required'
            })
        }

        // Validation: At least one channel required
        if (!channels || !Array.isArray(channels) || channels.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'At least one channel is required'
            })
        }

        // Validation: Description Word Limit
        const wordCount = description.trim().split(/\s+/).filter(Boolean).length
        if (wordCount > 100) {
            return res.status(400).json({
                success: false,
                error: `Description exceeds the 100-word limit (Current: ${wordCount} words)`
            })
        }

        // Create club with 'pending' status
        const { data: club, error: clubError } = await supabase
            .from('clubs')
            .insert({
                name,
                description,
                banner_url,
                logo_url,
                owner_id: userId,
                status: 'pending' // Enforce approval flow
            })
            .select()
            .single()

        if (clubError) throw new Error(clubError.message)

        // Add creator as owner (will be effective once club is active)
        const { error: memberError } = await supabase
            .from('club_members')
            .insert({
                club_id: club.id,
                user_id: userId,
                role: 'owner'
            })

        if (memberError) {
            await supabase.from('clubs').delete().eq('id', club.id)
            throw new Error(memberError.message)
        }

        // Create channels provided by user
        await supabase.from('channels').insert(
            channels.map(ch => ({
                name: ch.name,
                description: ch.description || '',
                visibility: ch.visibility || 'public',
                club_id: club.id,
                created_by: userId
            }))
        )

        // NOTIFY ADMINS
        const { data: admins } = await supabase.from('users').select('id').eq('role', 'college_admin')
        if (admins && admins.length > 0) {
            const notifications = admins.map(admin => ({
                user_id: admin.id,
                type: 'approval_request',
                title: 'New Club Request',
                message: `Club "${name}" requires approval.`,
                related_id: club.id,
                related_type: 'club'
            }))
            await supabase.from('notifications').insert(notifications)
        }

        res.status(201).json({
            success: true,
            data: club,
            message: 'Club request submitted! Pending admin approval.'
        })
    } catch (error) {
        console.error('Club creation error:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * GET /api/clubs/:id
 * Get club details
 */
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params
        const userId = req.session.userId

        const { data: club, error } = await supabase
            .from('clubs')
            .select('*, owner:users(name, email)') // Join owner details
            .eq('id', id)
            .single()

        if (error || !club) {
            return res.status(404).json({ success: false, error: 'Club not found' })
        }

        // Helper to check if user is admin
        const { data: user } = await supabase.from('users').select('role').eq('id', userId).single()
        const isAdmin = user?.role === 'college_admin'

        // Access Control: Only Owner or Admin can see non-active clubs
        if (club.status !== 'active') {
            if (!isAdmin && club.owner_id !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Club is pending approval or suspended.'
                })
            }
        }

        res.json({ success: true, data: club })
    } catch (error) {
        console.error('Club fetch error:', error)
        res.status(500).json({ success: false, error: error.message })
    }
})

/**
 * PUT /api/clubs/:id
 * Update club details (owner only)
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId
        const { id } = req.params
        const { name, description, banner_url, logo_url } = req.body

        // Verify ownership
        const { data: club } = await supabase
            .from('clubs')
            .select('owner_id')
            .eq('id', id)
            .single()

        if (club?.owner_id !== userId) {
            // Also check for 'college_admin'? Maybe. But request says owner updates.
            return res.status(403).json({ success: false, error: 'Only the owner can update this club' })
        }

        const { data: updatedClub, error } = await supabase
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

        if (error) throw error

        res.json({
            success: true,
            data: updatedClub,
            message: 'Club updated successfully'
        })
    } catch (error) {
        res.status(500).json({ success: false, error: error.message })
    }
})

export default router
