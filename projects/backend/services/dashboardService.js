import { supabase } from '../config/supabase.js'

/**
 * Dashboard Service
 * Handles all dashboard-related database queries
 */

/**
 * Get clubs owned by the user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of clubs
 */
export const getUserClubs = async (userId) => {
    const { data, error } = await supabase
        .from('clubs')
        .select('id, name, banner_url, created_at')
        .eq('created_by', userId)

    if (error) {
        throw new Error(`Failed to fetch user clubs: ${error.message}`)
    }

    return data || []
}

/**
 * Get events owned by the user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of events
 */
export const getUserEvents = async (userId) => {
    const { data, error } = await supabase
        .from('events')
        .select(`
      id,
      title,
      banner_url,
      event_date,
      club_id,
      sponsor_name,
      created_at,
      clubs (
        id,
        name
      )
    `)
        .eq('created_by', userId)

    if (error) {
        throw new Error(`Failed to fetch user events: ${error.message}`)
    }

    // Format the response
    const formattedEvents = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        banner_url: event.banner_url,
        event_date: event.event_date,
        club_id: event.club_id,
        club_name: event.clubs?.name || null,
        sponsor_name: event.sponsor_name,
        created_at: event.created_at
    }))

    return formattedEvents
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
