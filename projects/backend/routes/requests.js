import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * POST /api/requests/club
 * Submit a request to create a new club
 */
router.post('/club', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { name, description, banner_url, logo_url } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Club name is required' });
        }

        console.log(`📝 New Club Request from ${userId}: ${name}`);

        // 1. Insert into club_creation_requests
        const { data: request, error: requestError } = await supabase
            .from('club_creation_requests')
            .insert({
                name,
                description,
                banner_url,
                logo_url,
                requested_by: userId,
                status: 'pending'
            })
            .select()
            .single();

        if (requestError) {
            console.error('❌ Supabase Insert Error (Club Request):', requestError);
            throw new Error(requestError.message);
        }

        console.log(`✅ Club Request Saved: ${request.id}`);

        // 2. Notify Admins
        const { data: admins } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'college_admin');

        if (admins && admins.length > 0) {
            const notifications = admins.map(admin => ({
                user_id: admin.id,
                type: 'club_request',
                title: 'New Club Request',
                message: `User requested to create club "${name}".`,
                related_id: request.id,
                related_type: 'club_request'
            }));

            const { error: notifyError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (notifyError) {
                console.error('⚠️ Notification Insert Error:', notifyError);
            } else {
                console.log(`🔔 Notified ${admins.length} admins.`);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Club request submitted successfully. Waiting for admin approval.',
            data: request
        });

    } catch (error) {
        console.error('❌ Club Request API Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/requests/event
 * Submit a request to create a new event
 */
router.post('/event', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;

        const { title, description, banner_url, ticket_price, event_date, location, club_id, sponsor_name, wallet_address, channels } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Event title is required' });
        }

        console.log(`📝 New Event Request from ${userId}: ${title}`);

        // 1. Insert into event_creation_requests
        const { data: request, error: requestError } = await supabase
            .from('event_creation_requests')
            .insert({
                title,
                description,
                banner_url,
                ticket_price,
                event_date,
                location,
                club_id, // Optional, if event belongs to a club
                sponsor_name,
                wallet_address,
                channels_json: channels, // Store channels as JSONB if applicable or handle separately
                requested_by: userId,
                status: 'pending'
            })
            .select()
            .single();

        if (requestError) {
            console.error('❌ Supabase Insert Error (Event Request):', requestError);
            throw new Error(requestError.message);
        }

        console.log(`✅ Event Request Saved: ${request.id}`);

        // 2. Notify Admins
        const { data: admins } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'college_admin');

        if (admins && admins.length > 0) {
            const notifications = admins.map(admin => ({
                user_id: admin.id,
                type: 'event_request',
                title: 'New Event Request',
                message: `User requested to create event "${title}".`,
                related_id: request.id,
                related_type: 'event_request'
            }));

            const { error: notifyError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (notifyError) {
                console.error('⚠️ Notification Insert Error:', notifyError);
            } else {
                console.log(`🔔 Notified ${admins.length} admins.`);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Event request submitted successfully. Waiting for admin approval.',
            data: request
        });

    } catch (error) {
        console.error('❌ Event Request API Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
