import { supabase } from '../config/supabase.js'

/**
 * Dashboard Service
 * Handles all dashboard-related database queries with role-based access control
 */

/**
 * Get user's clubs with their role and member count
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of clubs with user role
 */
export const getUserClubs = async (userId) => {
    // Get clubs where user is a member (any role)
    const { data: memberships, error: memberError } = await supabase
        .from('club_members')
        .select(`
      role,
      joined_at,
      clubs (
        id,
        name,
        description,
        banner_url,
        logo_url,
        owner_id,
        created_at
      )
    `)
        .eq('user_id', userId)

    if (memberError) {
        throw new Error(`Failed to fetch user clubs: ${memberError.message}`)
    }

    // Get member counts for each club
    const clubsWithDetails = await Promise.all(
        (memberships || []).map(async (membership) => {
            const club = membership.clubs

            // Get total member count
            const { count: memberCount } = await supabase
                .from('club_members')
                .select('*', { count: 'exact', head: true })
                .eq('club_id', club.id)

            // Get channel count
            const { count: channelCount } = await supabase
                .from('channels')
                .select('*', { count: 'exact', head: true })
                .eq('club_id', club.id)

            return {
                id: club.id,
                name: club.name,
                description: club.description,
                banner_url: club.banner_url,
                logo_url: club.logo_url,
                owner_id: club.owner_id,
                user_role: membership.role, // 'owner', 'volunteer', or 'member'
                member_count: memberCount || 0,
                channel_count: channelCount || 0,
                joined_at: membership.joined_at,
                created_at: club.created_at
            }
        })
    )

    return clubsWithDetails
}

/**
 * Get user's events with their role and participant count
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of events with user role
 */
export const getUserEvents = async (userId) => {
    // 1. Get events where user is a participant (member)
    const { data: memberships, error: memberError } = await supabase
        .from('event_members')
        .select(`
      role,
      joined_at,
      events (
        id,
        title,
        description,
        banner_url,
        event_date,
        location,
        club_id,
        sponsor_name,
        ticket_price,
        wallet_address,
        owner_id,
        created_at,
        clubs (
          id,
          name
        )
      )
    `)
        .eq('user_id', userId)

    if (memberError) {
        throw new Error(`Failed to fetch user events: ${memberError.message}`)
    }

    // 2. Get events owned by the user (in case they are not in members table yet)
    const { data: ownedEvents, error: ownerError } = await supabase
        .from('events')
        .select(`
        id,
        title,
        description,
        banner_url,
        event_date,
        location,
        club_id,
        sponsor_name,
        ticket_price,
        wallet_address,
        owner_id,
        created_at,
        clubs (
          id,
          name
        )
    `)
        .eq('owner_id', userId)

    if (ownerError) {
        throw new Error(`Failed to fetch owned events: ${ownerError.message}`)
    }

    // 3. Combine and Deduplicate
    const eventMap = new Map()

    // Add memberships first
    if (memberships) {
        memberships.forEach(m => {
            if (m.events) {
                eventMap.set(m.events.id, {
                    ...m.events,
                    user_role: m.role,
                    joined_at: m.joined_at,
                    club_name: m.events.clubs?.name || null
                })
            }
        })
    }

    // Add owned events (override if needed, or just ensure they exist)
    if (ownedEvents) {
        ownedEvents.forEach(e => {
            if (!eventMap.has(e.id)) {
                eventMap.set(e.id, {
                    ...e,
                    user_role: 'owner', // Implicit owner role
                    joined_at: e.created_at,
                    club_name: e.clubs?.name || null
                })
            }
        })
    }

    // 4. Enrich with counts
    const eventsWithDetails = await Promise.all(
        Array.from(eventMap.values()).map(async (event) => {
            // Get total participant count
            const { count: participantCount } = await supabase
                .from('event_members')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event.id)

            // Get channel count
            const { count: channelCount } = await supabase
                .from('channels')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', event.id)

            return {
                id: event.id,
                title: event.title,
                description: event.description,
                banner_url: event.banner_url,
                event_date: event.event_date,
                location: event.location,
                club_id: event.club_id,
                club_name: event.club_name,
                sponsor_name: event.sponsor_name,
                ticket_price: event.ticket_price,
                wallet_address: event.wallet_address,
                owner_id: event.owner_id,
                user_role: event.user_role,
                participant_count: participantCount || 0,
                channel_count: channelCount || 0,
                joined_at: event.joined_at,
                created_at: event.created_at
            }
        })
    )

    return eventsWithDetails
}

/**
 * Get complete dashboard data for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Dashboard data with clubs and events
 */
export const getDashboardData = async (userId) => {
    try {
        const [clubs, events] = await Promise.all([
            getUserClubs(userId),
            getUserEvents(userId)
        ])

        return {
            clubs,
            events
        }
    } catch (error) {
        throw new Error(`Failed to fetch dashboard data: ${error.message}`)
    }
}

/**
 * Get user's accessible channels for a club or event
 * Based on user role: owner sees all, volunteer sees public + volunteer, member sees public only
 * @param {string} userId - User ID
 * @param {string} clubId - Club ID (optional)
 * @param {string} eventId - Event ID (optional)
 * @returns {Promise<Array>} Array of accessible channels
 */
export const getUserChannels = async (userId, clubId = null, eventId = null) => {
    if (!clubId && !eventId) {
        throw new Error('Either clubId or eventId must be provided')
    }

    // Get user's role
    let userRole = 'member' // default

    if (clubId) {
        // First check if user is the creator (owner) of the club
        const { data: club } = await supabase
            .from('clubs')
            .select('owner_id')
            .eq('id', clubId)
            .single()

        if (club && club.owner_id === userId) {
            userRole = 'owner'
        } else {
            // Check membership role
            const { data: membership } = await supabase
                .from('club_members')
                .select('role')
                .eq('club_id', clubId)
                .eq('user_id', userId)
                .single()

            userRole = membership?.role || 'member'
        }
    } else if (eventId) {
        // First check if user is the creator (owner) of the event
        const { data: event } = await supabase
            .from('events')
            .select('owner_id')
            .eq('id', eventId)
            .single()

        if (event && event.owner_id === userId) {
            userRole = 'owner'
        } else {
            // Check membership role
            const { data: membership } = await supabase
                .from('event_members')
                .select('role')
                .eq('event_id', eventId)
                .eq('user_id', userId)
                .single()

            userRole = membership?.role || 'member'
        }
    }

    // Build query based on role
    let query = supabase
        .from('channels')
        .select('*')

    if (clubId) {
        query = query.eq('club_id', clubId)
    } else {
        query = query.eq('event_id', eventId)
    }

    // Filter by visibility based on role
    if (userRole === 'owner') {
        // Owners see all channels
    } else if (userRole === 'volunteer') {
        // Volunteers see public and volunteer channels
        query = query.in('visibility', ['public', 'volunteer'])
    } else {
        // Members see only public channels
        query = query.eq('visibility', 'public')
    }

    const { data: channels, error } = await query.order('created_at', { ascending: true })

    if (error) {
        throw new Error(`Failed to fetch channels: ${error.message}`)
    }

    return channels || []
}
