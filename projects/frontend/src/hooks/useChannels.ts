import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Fetch channels for a club or event
 * @param type - 'club' or 'event'
 * @param id - club_id or event_id
 */
const fetchChannels = async (type: string, id: string) => {
    const response = await axios.get(`${API_URL}/api/channels/${type}/${id}`, {
        withCredentials: true
    })
    return response.data.data
}

/**
 * Hook to fetch channels for a club or event
 * Automatically filters based on user's role
 */
export const useChannels = (type: 'club' | 'event' | null, id: string | null) => {
    return useQuery({
        queryKey: ['channels', type, id],
        queryFn: () => fetchChannels(type!, id!),
        enabled: !!type && !!id, // Only fetch if type and id are provided
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: 1
    })
}

/**
 * Fetch members for a club or event
 * @param type - 'club' or 'event'
 * @param id - club_id or event_id
 */
const fetchMembers = async (type: string, id: string) => {
    const response = await axios.get(`${API_URL}/api/members/${type}/${id}`, {
        withCredentials: true
    })
    return response.data.data
}

/**
 * Hook to fetch members for a club or event
 * Automatically filters based on user's role
 */
export const useMembers = (type: 'club' | 'event' | null, id: string | null) => {
    return useQuery({
        queryKey: ['members', type, id],
        queryFn: () => fetchMembers(type!, id!),
        enabled: !!type && !!id, // Only fetch if type and id are provided
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: 1
    })
}
