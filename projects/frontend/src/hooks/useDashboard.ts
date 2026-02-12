import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Fetch dashboard data (clubs and events for the logged-in user)
 */
const fetchUserClubs = async () => {
    const response = await axios.get(`${API_URL}/api/dashboard/clubs`, {
        withCredentials: true
    })
    return response.data.data
}

const fetchUserEvents = async () => {
    const response = await axios.get(`${API_URL}/api/dashboard/events`, {
        withCredentials: true
    })
    return response.data.data
}

export const useClubs = () => {
    return useQuery({
        queryKey: ['clubs'],
        queryFn: fetchUserClubs,
        staleTime: 5 * 60 * 1000,
        retry: 1
    })
}

export const useEvents = () => {
    return useQuery({
        queryKey: ['events'],
        queryFn: fetchUserEvents,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1
    })
}

/**
 * Legacy hook for backward compatibility (simulates full dashboard response)
 */
export const useDashboardData = () => {
    const clubsQuery = useClubs()
    const eventsQuery = useEvents()

    return {
        data: {
            clubs: clubsQuery.data || [],
            events: eventsQuery.data || []
        },
        isLoading: clubsQuery.isLoading || eventsQuery.isLoading,
        isFetching: clubsQuery.isFetching || eventsQuery.isFetching,
        error: clubsQuery.error || eventsQuery.error,
        refetch: async () => {
            await Promise.all([clubsQuery.refetch(), eventsQuery.refetch()])
        }
    }
}

/**
 * Custom hook to delete a club
 */


export const useDeleteClub = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (clubId: string) => {
            const response = await axios.delete(`${API_URL}/api/clubs/${clubId}`, {
                withCredentials: true
            })
            return response.data
        },
        onSuccess: () => {
            // Refetch dashboard data after deletion
            queryClient.invalidateQueries({ queryKey: ['clubs'] })
            queryClient.invalidateQueries({ queryKey: ['events'] })
        }
    })
}

export const useDeleteEvent = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (eventId: string) => {
            const response = await axios.delete(`${API_URL}/api/events/${eventId}`, {
                withCredentials: true
            })
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] })
        }
    })
}
