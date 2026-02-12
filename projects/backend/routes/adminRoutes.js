import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/authMiddleware.js';
import * as adminService from '../services/adminService.js';
import { supabase } from '../config/supabase.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Role Check
        if (user.role !== 'college_admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        // Set Session
        req.session.userId = user.id;
        req.session.userRole = user.role;

        res.json({
            success: true,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, message: 'Server error', details: error.message });
    }
});

// Dashboard Overview
router.get('/overview', requireAuth, requireAdmin, async (req, res) => {
    try {
        const stats = await adminService.getSystemOverview();
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching overview', details: error.message });
    }
});

// Manage Clubs
// --- Creation Requests ---

/**
 * GET /api/admin/creation-requests/:type
 * type: 'club' or 'event'
 */
router.get('/creation-requests/:type', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { type } = req.params;
        if (!['club', 'event'].includes(type)) return res.status(400).json({ success: false, error: 'Invalid type' });

        const requests = await adminService.getCreationRequests(type);
        res.json({ success: true, data: requests });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/admin/creation-requests/:type/:id
 * Process request (approve/reject)
 */
router.post('/creation-requests/:type/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { type, id } = req.params;
        const { action } = req.body;
        const adminId = req.session.userId;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, error: 'Invalid action' });
        }

        let result;
        if (type === 'club') {
            result = await adminService.processClubRequest(id, action, adminId);
        } else if (type === 'event') {
            result = await adminService.processEventRequest(id, action, adminId);
        } else {
            return res.status(400).json({ success: false, error: 'Invalid type' });
        }

        res.json({ success: true, message: `Request ${action}ed successfully`, data: result });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- Legacy Club Management (Active/Suspended) ---
router.get('/clubs', requireAuth, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const status = req.query.status || null;
        const result = await adminService.getAllClubs(page, 10, status);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching clubs', details: error.message });
    }
});

router.patch('/clubs/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
        const result = await adminService.updateClubStatus(req.params.id, req.body.status);
        res.json({ success: true, message: 'Club status updated', data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating status', details: error.message });
    }
});

// Manage Events
router.get('/events', requireAuth, requireAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const status = req.query.status || null;
        const result = await adminService.getAllEvents(page, 10, status);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching events', details: error.message });
    }
});

router.patch('/events/:id/status', requireAuth, requireAdmin, async (req, res) => {
    try {
        const result = await adminService.updateEventStatus(req.params.id, req.body.status);
        res.json({ success: true, message: 'Event status updated', data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating status', details: error.message });
    }
});

export default router;
