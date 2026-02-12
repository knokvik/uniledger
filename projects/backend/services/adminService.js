import { supabase } from '../config/supabase.js';

/**
 * Get system overview statistics for admin dashboard
 */
/**
 * Get system overview statistics for admin dashboard
 */
export const getSystemOverview = async () => {
    // Parallel queries for efficiency
    const [clubs, events, users, payments, clubRequests, eventRequests] = await Promise.all([
        supabase.from('clubs').select('id, status', { count: 'exact' }),
        supabase.from('events').select('id, status', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('event_payments').select('amount', { count: 'exact' }).eq('status', 'verified'),
        supabase.from('club_creation_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('event_creation_requests').select('id', { count: 'exact' }).eq('status', 'pending')
    ]);

    const totalRevenue = payments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    return {
        totalClubs: clubs.count || 0,
        suspendedClubs: clubs.data?.filter(c => c.status === 'suspended').length || 0,
        pendingClubs: (clubRequests.count || 0), // Now using requests table
        totalEvents: events.count || 0,
        pendingEvents: (eventRequests.count || 0), // Now using requests table
        cancelledEvents: events.data?.filter(e => e.status === 'cancelled').length || 0,
        totalUsers: users.count || 0,
        totalRevenue: totalRevenue.toFixed(2)
    };
};

/**
 * Get pending creation requests
 */
export const getCreationRequests = async (type = 'club') => {
    const table = type === 'club' ? 'club_creation_requests' : 'event_creation_requests';
    const relation = type === 'club'
        ? 'users!club_creation_requests_requested_by_fkey'
        : 'users!event_creation_requests_requested_by_fkey';

    const { data, error } = await supabase
        .from(table)
        .select(`*, requested_by:${relation}(id, name, email)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Normalize data structure for frontend (optional, since alias works)
    return data;
};

/**
 * Process Club Request (Approve/Reject)
 */
export const processClubRequest = async (requestId, action, adminId) => {
    if (!['approve', 'reject'].includes(action)) throw new Error('Invalid action');

    // 1. Fetch Request
    const { data: request, error: fetchError } = await supabase
        .from('club_creation_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (fetchError || !request) throw new Error('Request not found');
    if (request.status !== 'pending') throw new Error('Request already processed');

    if (action === 'approve') {
        // 2a. Create Club
        const { data: club, error: createError } = await supabase
            .from('clubs')
            .insert({
                name: request.name,
                description: request.description,
                banner_url: request.banner_url,
                logo_url: request.logo_url,
                owner_id: request.requested_by,
                status: 'active'
            })
            .select()
            .single();

        if (createError) throw createError;

        // 2b. Add Owner as Member
        await supabase.from('club_members').insert({
            club_id: club.id,
            user_id: request.requested_by,
            role: 'owner'
        });

        // 2c. Create Default Channels
        const channels = [
            { name: 'general', description: 'General discussion', visibility: 'public' },
            { name: 'announcements', description: 'Important announcements', visibility: 'public' },
            { name: 'volunteers', description: 'Volunteer coordination', visibility: 'volunteer' }
        ];
        await supabase.from('channels').insert(
            channels.map(ch => ({ ...ch, club_id: club.id, created_by: request.requested_by }))
        );

        // 3. Update Request Status
        await supabase
            .from('club_creation_requests')
            .update({ status: 'approved', reviewed_by: adminId, reviewed_at: new Date() })
            .eq('id', requestId);

        // 4. Notify User
        await supabase.from('notifications').insert({
            user_id: request.requested_by,
            type: 'request_approved',
            title: 'Club Approved!',
            message: `Your club "${request.name}" has been approved.`,
            related_id: club.id,
            related_type: 'club'
        });

        return club;
    } else {
        // Reject Logic
        await supabase
            .from('club_creation_requests')
            .update({ status: 'rejected', reviewed_by: adminId, reviewed_at: new Date() })
            .eq('id', requestId);

        await supabase.from('notifications').insert({
            user_id: request.requested_by,
            type: 'request_rejected',
            title: 'Club Request Rejected',
            message: `Your request for club "${request.name}" was rejected.`,
            related_id: requestId,
            related_type: 'club_request'
        });

        return { status: 'rejected' };
    }
};

/**
 * Process Event Request (Approve/Reject)
 */
export const processEventRequest = async (requestId, action, adminId) => {
    if (!['approve', 'reject'].includes(action)) throw new Error('Invalid action');

    const { data: request, error: fetchError } = await supabase
        .from('event_creation_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (fetchError || !request) throw new Error('Request not found');

    if (action === 'approve') {
        const { data: event, error: createError } = await supabase
            .from('events')
            .insert({
                title: request.title,
                description: request.description,
                banner_url: request.banner_url,
                event_date: request.event_date,
                location: request.location,
                ticket_price: request.ticket_price,
                club_id: request.club_id,
                owner_id: request.requested_by, // Or club owner? Assuming requester is owner for now.
                status: 'active'
            })
            .select()
            .single();

        if (createError) throw createError;

        await supabase
            .from('event_creation_requests')
            .update({ status: 'approved', reviewed_by: adminId, reviewed_at: new Date() })
            .eq('id', requestId);

        await supabase.from('notifications').insert({
            user_id: request.requested_by,
            type: 'request_approved',
            title: 'Event Approved!',
            message: `Your event "${request.title}" has been approved.`,
            related_id: event.id,
            related_type: 'event'
        });

        return event;
    } else {
        await supabase
            .from('event_creation_requests')
            .update({ status: 'rejected', reviewed_by: adminId, reviewed_at: new Date() })
            .eq('id', requestId);

        await supabase.from('notifications').insert({
            user_id: request.requested_by,
            type: 'request_rejected',
            title: 'Event Request Rejected',
            message: `Your request for event "${request.title}" was rejected.`,
            related_id: requestId,
            related_type: 'event_request'
        });

        return { status: 'rejected' };
    }
};

/**
 * Get all clubs with pagination and optional status filter
 */
export const getAllClubs = async (page = 1, limit = 10, status = null) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('clubs')
        .select(`*, owner:users(id, name, email) `, { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data, count, page, limit };
};

/**
 * Update club status (approve/suspend/reactivate)
 */
export const updateClubStatus = async (clubId, status) => {
    if (!['active', 'suspended', 'pending'].includes(status)) {
        throw new Error('Invalid status. Must be active, suspended or pending');
    }

    const { data, error } = await supabase
        .from('clubs')
        .update({ status })
        .eq('id', clubId)
        .select('*, owner_id, name')
        .single();

    if (error) throw error;

    // NOTIFY OWNER
    if (data.owner_id && status !== 'pending') {
        await supabase.from('notifications').insert({
            user_id: data.owner_id,
            type: 'status_update',
            title: `Club ${status === 'active' ? 'Approved' : 'Status Updated'}`,
            message: `Your club "${data.name}" is now ${status}.`,
            related_id: clubId,
            related_type: 'club'
        });
    }

    return data;
};

/**
 * Update event status (approve/cancel/reactivate)
 */
export const updateEventStatus = async (eventId, status) => {
    if (!['active', 'cancelled', 'pending'].includes(status)) {
        throw new Error('Invalid status. Must be active, cancelled or pending');
    }

    const { data, error } = await supabase
        .from('events')
        .update({ status })
        .eq('id', eventId)
        .select('*, owner_id, title')
        .single();

    if (error) throw error;

    // NOTIFY OWNER
    if (data.owner_id && status !== 'pending') {
        await supabase.from('notifications').insert({
            user_id: data.owner_id,
            type: 'status_update',
            title: `Event ${status === 'active' ? 'Approved' : 'Status Updated'}`,
            message: `Your event "${data.title}" is now ${status}.`,
            related_id: eventId,
            related_type: 'event'
        });
    }

    return data;
};
