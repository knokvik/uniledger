import express from 'express';
import { supabase } from '../config/supabase.js';

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
 * Helper function to create a notification
 */
export const createNotification = async (userId, type, title, message, relatedId = null, relatedType = null) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                related_id: relatedId,
                related_type: relatedType,
                is_read: false
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating notification:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Create notification error:', error);
        return null;
    }
};

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for current user
 * @access  Private
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { unreadOnly } = req.query;

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (unreadOnly === 'true') {
            query = query.eq('is_read', false);
        }

        const { data: notifications, error } = await query;

        if (error) {
            console.error('Error fetching notifications:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch notifications',
                error: error.message
            });
        }

        res.json({
            success: true,
            notifications: notifications || [],
            unreadCount: notifications ? notifications.filter(n => !n.is_read).length : 0
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:notificationId/read', requireAuth, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.session.userId;

        // Verify notification belongs to user
        const { data: notification, error: fetchError } = await supabase
            .from('notifications')
            .select('id')
            .eq('id', notificationId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Mark as read
        const { error: updateError } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (updateError) {
            console.error('Error updating notification:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to mark notification as read',
                error: updateError.message
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Error marking all as read:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to mark all notifications as read',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:notificationId', requireAuth, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.session.userId;

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting notification:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete notification',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted'
        });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

export default router;
