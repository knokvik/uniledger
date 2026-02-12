import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Create Club Function
const createClub = async (clubData: any) => {
    const response = await axios.post(`${API_URL}/api/requests/club`, clubData, {
        withCredentials: true
    })
    return response.data
}

// Create Event Function
const createEvent = async (eventData: any) => {
    const response = await axios.post(`${API_URL}/api/requests/event`, eventData, {
        withCredentials: true
    })
    return response.data
}

// Hook
export const useCreateEntity = () => {
    const queryClient = useQueryClient()

    const createClubMutation = useMutation({
        mutationFn: createClub,
        onSuccess: () => {
            // Invalidate dashboard data to refresh list
            queryClient.invalidateQueries({ queryKey: ['clubs'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
    })

    const createEventMutation = useMutation({
        mutationFn: createEvent,
        onSuccess: () => {
            // Invalidate dashboard data to refresh list
            queryClient.invalidateQueries({ queryKey: ['events'] })
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
    })

    return {
        createClub: createClubMutation,
        createEvent: createEventMutation
    }
}
