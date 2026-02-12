import { supabase } from '../config/supabase.js';

/**
 * Get system overview statistics for admin dashboard
 */
export const getSystemOverview = async () => {
    // Parallel queries for efficiency
    const [clubs, events, users, payments] = await Promise.all([
        supabase.from('clubs').select('id, status', { count: 'exact' }),
        supabase.from('events').select('id, status', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('event_payments').select('amount', { count: 'exact' }).eq('status', 'verified')
    ]);

    const totalRevenue = payments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

    return {
        totalClubs: clubs.count || 0,
        suspendedClubs: clubs.data?.filter(c => c.status === 'suspended').length || 0,
        pendingClubs: clubs.data?.filter(c => c.status === 'pending').length || 0,
        totalEvents: events.count || 0,
        pendingEvents: events.data?.filter(e => e.status === 'pending').length || 0,
        cancelledEvents: events.data?.filter(e => e.status === 'cancelled').length || 0,
        totalUsers: users.count || 0,
        totalRevenue: totalRevenue.toFixed(2)
    };
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
