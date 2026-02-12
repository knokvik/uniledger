import { supabase } from '../config/supabase.js';

/**
 * Get system overview statistics for admin dashboard
 */
export const getSystemOverview = async () => {
    // Parallel queries for efficiency
    const [clubs, events, users, payments] = await Promise.all([
        supabase.from('clubs').select('id, status'),
        supabase.from('events').select('id, status'),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('event_payments').select('amount').eq('status', 'verified')
    ]);

    const totalRevenue = payments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    const clubData = clubs.data || [];
    const eventData = events.data || [];

    return {
        totalClubs: clubData.length,
        activeClubs: clubData.filter(c => c.status === 'active').length,
        suspendedClubs: clubData.filter(c => c.status === 'suspended').length,
        pendingClubs: clubData.filter(c => c.status === 'pending').length,

        totalEvents: eventData.length,
        activeEvents: eventData.filter(e => e.status === 'active').length,
        pendingEvents: eventData.filter(e => e.status === 'pending').length,
        cancelledEvents: eventData.filter(e => e.status === 'cancelled').length,

        totalUsers: users.count || 0,
        totalRevenue: totalRevenue.toFixed(2)
    };
};

/**
 * Get pending creation requests
 */
export const getCreationRequests = async (type = 'club') => {
    const table = type === 'club' ? 'clubs' : 'events';
    const relation = type === 'club'
        ? 'owner:users!clubs_owner_id_fkey' // Check foreign key name in DB, usually implicit if named owner_id
        : 'owner:users!events_owner_id_fkey';

    // Note: If explicit FK name is needed, find it. Otherwise, Supabase usually infers from 'owner_id' -> 'users.id'
    // For safety, assuming standard naming. If error, we might need just 'users'
    const joinQuery = type === 'club'
        ? '*, owner:users(id, name, email)'
        : '*, owner:users(id, name, email)';

    const { data, error } = await supabase
        .from(table)
        .select(joinQuery)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Process Club Request (Approve/Reject)
 */
export const processClubRequest = async (id, action, adminId) => {
    if (!['approve', 'reject'].includes(action)) throw new Error('Invalid action');

    const status = action === 'approve' ? 'active' : 'rejected';

    // Update Status
    const { data: club, error } = await supabase
        .from('clubs')
        .update({
            status,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*, owner_id, name')
        .single();

    if (error) throw error;

    // Send Notification
    await supabase.from('notifications').insert({
        user_id: club.owner_id,
        type: action === 'approve' ? 'request_approved' : 'request_rejected',
        title: action === 'approve' ? 'Club Approved!' : 'Club Request Rejected',
        message: action === 'approve'
            ? `Your club "${club.name}" has been approved.`
            : `Your request for club "${club.name}" was rejected.`,
        related_id: club.id,
        related_type: 'club'
    });

    return club;
};

/**
 * Process Event Request (Approve/Reject)
 */
export const processEventRequest = async (id, action, adminId) => {
    if (!['approve', 'reject'].includes(action)) throw new Error('Invalid action');

    const status = action === 'approve' ? 'active' : 'rejected';

    // Update Status
    const { data: event, error } = await supabase
        .from('events')
        .update({
            status,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*, owner_id, title')
        .single();

    if (error) throw error;

    // Send Notification
    await supabase.from('notifications').insert({
        user_id: event.owner_id,
        type: action === 'approve' ? 'request_approved' : 'request_rejected',
        title: action === 'approve' ? 'Event Approved!' : 'Event Request Rejected',
        message: action === 'approve'
            ? `Your event "${event.title}" has been approved.`
            : `Your request for event "${event.title}" was rejected.`,
        related_id: event.id,
        related_type: 'event'
    });

    return event;
};

/**
 * Get all users with pagination
 */
export const getAllUsers = async (page = 1, limit = 10) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, count, page, limit };
};

/**
 * Get all clubs with pagination and optional status filter
 */
export const getAllClubs = async (page = 1, limit = 10, status = null) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('clubs')
        .select('*, owner:users(id, name, email)', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Fetch member counts for each club separately
    const dataWithCounts = await Promise.all(
        (data || []).map(async (club) => {
            const { count: memberCount } = await supabase
                .from('club_members')
                .select('*', { count: 'exact', head: true })
                .eq('club_id', club.id);

            return {
                ...club,
                member_count: memberCount || 0
            };
        })
    );

    return { data: dataWithCounts, count, page, limit };
};

/**
 * Get all events with pagination and optional status filter
 */
export const getAllEvents = async (page = 1, limit = 10, status = null) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from('events')
        .select('*, owner:users(id, name, email), club:clubs(name)', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Fetch participant counts for each event separately
    const dataWithCounts = await Promise.all(
        data.map(async (event) => {
            const { count: participantCount } = await supabase
                .from('event_participants')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event.id);

            return {
                ...event,
                participant_count: participantCount || 0
            };
        })
    );

    return { data: dataWithCounts, count, page, limit };
};

/**
 * Update club status (suspend/reactivate)
 */
export const updateClubStatus = async (clubId, status) => {
    if (!['active', 'suspended', 'pending'].includes(status)) {
        throw new Error('Invalid status');
    }

    const { data, error } = await supabase
        .from('clubs')
        .update({ status })
        .eq('id', clubId)
        .select('*, owner_id, name')
        .single();

    if (error) throw error;

    if (data.owner_id) {
        await supabase.from('notifications').insert({
            user_id: data.owner_id,
            type: 'status_update',
            title: 'Club Status Updated',
            message: `Your club "${data.name}" is now ${status}.`,
            related_id: clubId,
            related_type: 'club'
        });
    }

    return data;
};

/**
 * Update event status (suspend/reactivate)
 */
export const updateEventStatus = async (eventId, status) => {
    if (!['active', 'cancelled', 'pending'].includes(status)) {
        throw new Error('Invalid status');
    }

    const { data, error } = await supabase
        .from('events')
        .update({ status })
        .eq('id', eventId)
        .select('*, owner_id, title')
        .single();

    if (error) throw error;

    if (data.owner_id) {
        await supabase.from('notifications').insert({
            user_id: data.owner_id,
            type: 'status_update',
            title: 'Event Status Updated',
            message: `Your event "${data.title}" is now ${status}.`,
            related_id: eventId,
            related_type: 'event'
        });
    }

    return data;
};

/**
 * Get detailed club view
 */
export const getClubDetails = async (id) => {
    const { data, error } = await supabase
        .from('clubs')
        .select(`
            *,
            owner:users(id, name, email),
            members:club_members(
                joined_at,
                user:users(id, name, email)
            ),
            channels(id, name, type),
            events(id, title, start_date, status)
        `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get detailed event view
 */
export const getEventDetails = async (id) => {
    const { data, error } = await supabase
        .from('events')
        .select(`
            *,
            owner:users(id, name, email),
            club:clubs(name),
            participants:event_participants(
                status,
                user:users(id, name, email)
            )
        `)
        .eq('id', id)
        .single();

    if (error) throw error;

    // Fetch aggregated payments or detailed if needed
    const { data: payments } = await supabase
        .from('event_payments')
        .select('*')
        .eq('event_id', id);

    return { ...data, payments: payments || [] };
};
