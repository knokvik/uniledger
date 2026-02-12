import { supabase } from '../config/supabase.js';

/**
 * Middleware to check authentication
 * Usage: router.get('/protected', requireAuth, (req, res) => { ... })
 */
export const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    next();
};

/**
 * Middleware to check if user is a college admin
 * Usage: router.get('/admin', requireAuth, requireAdmin, (req, res) => { ... })
 */
export const requireAdmin = async (req, res, next) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', req.session.userId)
            .single();

        if (error || !user) {
            return res.status(500).json({
                success: false,
                message: 'Failed to verify admin status',
                error: error?.message
            });
        }

        if (user.role !== 'college_admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Middleware to check if user has a specific role in a club
 * usage: router.post('/clubs/:clubId/events', requireAuth, requireClubRole('owner'), ...)
 * @param {string} requiredRole - Minimum role required ('owner', 'volunteer', 'member')
 * @param {string} paramName - Name of the route parameter containing club ID (default: 'clubId')
 */
export const requireClubRole = (requiredRole, paramName = 'clubId') => {
    return async (req, res, next) => {
        try {
            const clubId = req.params[paramName] || req.params.id; // Fallback to 'id' if 'clubId' missing
            const userId = req.session.userId;

            if (!clubId) {
                return res.status(400).json({
                    success: false,
                    message: 'Club ID parameter missing'
                });
            }

            const { data: member, error } = await supabase
                .from('club_members')
                .select('role')
                .eq('club_id', clubId)
                .eq('user_id', userId)
                .single();

            if (error || !member) {
                 return res.status(403).json({
                    success: false,
                    message: 'You are not a member of this club'
                });
            }

            // Role hierarchy: owner > volunteer > member
            const roles = ['member', 'volunteer', 'owner'];
            const userRoleLevel = roles.indexOf(member.role);
            const requiredRoleLevel = roles.indexOf(requiredRole);

            if (userRoleLevel < requiredRoleLevel) {
                return res.status(403).json({
                    success: false,
                    message: `Insufficient permissions. Required: ${requiredRole}`
                });
            }

            req.userClubRole = member.role; // Pass role to next handler
            next();
        } catch (error) {
            console.error('Club role verification error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error verifying club role',
                error: error.message
            });
        }
    };
};
