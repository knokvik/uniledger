import express from 'express';
import { supabase } from '../config/supabase.js';
import { createNotification } from './notifications.js';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    next();
};

/**
 * @route   POST /api/join-requests/club/:clubId
 * @desc    Request to join a club
 * @access  Private
 */
router.post('/club/:clubId', requireAuth, async (req, res) => {
    try {
        const { clubId } = req.params;
        const userId = req.session.userId;
        const { message } = req.body;

        // Check if club exists
        const { data: club, error: clubError } = await supabase
            .from('clubs')
            .select('id, name, owner_id')
            .eq('id', clubId)
            .single();

        if (clubError || !club) {
            return res.status(404).json({
                success: false,
                message: 'Club not found'
            });
        }

        // Check if user is already a member
        const { data: existingMember } = await supabase
            .from('club_members')
            .select('id')
            .eq('club_id', clubId)
            .eq('user_id', userId)
            .single();

        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'You are already a member of this club'
            });
        }

        // Check if there's already a pending request
        const { data: existingRequest } = await supabase
            .from('club_join_requests')
            .select('id, status')
            .eq('club_id', clubId)
            .eq('user_id', userId)
            .single();

        if (existingRequest) {
            if (existingRequest.status === 'pending' || existingRequest.status === 'hold') {
                return res.status(400).json({
                    success: false,
                    message: `You already have a ${existingRequest.status} request for this club`
                });
            }
            // If rejected, allow new request by deleting old one
            if (existingRequest.status === 'rejected') {
                await supabase
                    .from('club_join_requests')
                    .delete()
                    .eq('id', existingRequest.id);
            }
        }

        // Create join request
        const { data: request, error: requestError } = await supabase
            .from('club_join_requests')
            .insert({
                club_id: clubId,
                user_id: userId,
                message: message || null,
                status: 'pending'
            })
            .select()
            .single();

        if (requestError) {
            console.error('Error creating join request:', requestError);
            return res.status(500).json({
                success: false,
                message: 'Failed to create join request',
                error: requestError.message
            });
        }

        // Get user details for notification
        const { data: userData } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', userId)
            .single();

        const userName = userData?.name || userData?.email || 'A user';

        // Create notification for club owner
        await createNotification(
            club.owner_id,
            'join_request',
            `New join request for ${club.name}`,
            `${userName} has requested to join your club${message ? ': ' + message : '.'}`,
            clubId,
            'club'
        );

        res.json({
            success: true,
            message: 'Join request sent successfully',
            request
        });

    } catch (error) {
        console.error('Join request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/join-requests/club/:clubId
 * @desc    Get join requests for a club (owner only)
 * @access  Private (Owner)
 */
router.get('/club/:clubId', requireAuth, async (req, res) => {
    try {
        const { clubId } = req.params;
        const userId = req.session.userId;
        const { status } = req.query; // Optional filter by status

        // Check if user is the owner
        const { data: club, error: clubError } = await supabase
            .from('clubs')
            .select('id, name, owner_id')
            .eq('id', clubId)
            .single();

        if (clubError || !club) {
            return res.status(404).json({
                success: false,
                message: 'Club not found'
            });
        }

        if (club.owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only club owner can view join requests'
            });
        }

        // Build query
        let query = supabase
            .from('club_join_requests')
            .select(`
                id,
                club_id,
                user_id,
                status,
                message,
                owner_message,
                created_at,
                updated_at,
                users:user_id (
                    id,
                    name,
                    email,
                    avatar_url
                )
            `)
            .eq('club_id', clubId)
            .order('created_at', { ascending: false });

        // Filter by status if provided
        if (status && ['pending', 'accepted', 'rejected', 'hold'].includes(status)) {
            query = query.eq('status', status);
        }

        const { data: requests, error: requestsError } = await query;

        if (requestsError) {
            console.error('Error fetching join requests:', requestsError);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch join requests',
                error: requestsError.message
            });
        }

        res.json({
            success: true,
            requests: requests || []
        });

    } catch (error) {
        console.error('Get join requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/join-requests/:requestId
 * @desc    Update join request status (owner only)
 * @access  Private (Owner)
 */
router.put('/:requestId', requireAuth, async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.session.userId;
        const { status, ownerMessage } = req.body;

        // Validate status
        if (!['accepted', 'rejected', 'hold'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be: accepted, rejected, or hold'
            });
        }

        // Get the request
        const { data: request, error: requestError } = await supabase
            .from('club_join_requests')
            .select('*, clubs:club_id(owner_id)')
            .eq('id', requestId)
            .single();

        if (requestError || !request) {
            return res.status(404).json({
                success: false,
                message: 'Join request not found'
            });
        }

        // Check if user is the owner
        if (request.clubs.owner_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only club owner can manage join requests'
            });
        }

        // If accepting, add user to club members
        if (status === 'accepted') {
            const { error: memberError } = await supabase
                .from('club_members')
                .insert({
                    club_id: request.club_id,
                    user_id: request.user_id,
                    role: 'member'
                });

            if (memberError) {
                console.error('Error adding member:', memberError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to add member to club',
                    error: memberError.message
                });
            }

            const { data: clubData } = await supabase
                .from('clubs')
                .select('name')
                .eq('id', request.club_id)
                .single();

            // Create notification for user
            await createNotification(
                request.user_id,
                'join_accepted',
                'Join request accepted',
                `Your join request for ${clubData?.name || 'the club'} has been accepted! ${ownerMessage || ''}`,
                request.club_id,
                'club'
            );

            // Delete the request after accepting
            await supabase
                .from('club_join_requests')
                .delete()
                .eq('id', requestId);

            return res.json({
                success: true,
                message: 'User added to club successfully'
            });
        }

        // For rejected or hold, update the request
        const { data: updatedRequest, error: updateError } = await supabase
            .from('club_join_requests')
            .update({
                status,
                owner_message: ownerMessage || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating join request:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to update join request',
                error: updateError.message
            });
        }

        // Get club name for notification
        const { data: clubData } = await supabase
            .from('clubs')
            .select('name')
            .eq('id', request.club_id)
            .single();

        // Create notification for user
        const notificationType = status === 'rejected' ? 'join_rejected' : 'join_hold';
        const notificationTitle = status === 'rejected' ? 'Join request rejected' : 'Join request on hold';
        const notificationMessage = status === 'rejected'
            ? `Your join request for ${clubData?.name || 'the club'} was rejected. ${ownerMessage || ''}`
            : `Your join request for ${clubData?.name || 'the club'} is on hold. ${ownerMessage || 'The owner may need more information.'}`;

        await createNotification(
            request.user_id,
            notificationType,
            notificationTitle,
            notificationMessage,
            request.club_id,
            'club'
        );

        res.json({
            success: true,
            message: `Request ${status}`,
            request: updatedRequest
        });

    } catch (error) {
        console.error('Update join request error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/join-requests/my-requests
 * @desc    Get current user's join requests
 * @access  Private
 */
router.get('/my-requests', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const { data: requests, error } = await supabase
            .from('club_join_requests')
            .select(`
                id,
                club_id,
                status,
                message,
                owner_message,
                created_at,
                updated_at,
                clubs:club_id (
                    id,
                    name,
                    logo_url
                )
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user requests:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch your join requests',
                error: error.message
            });
        }

        res.json({
            success: true,
            requests: requests || []
        });

    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

export default router;
