import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Update Club Function
const updateClub = async ({ id, data }: { id: string; data: any }) => {
    const response = await axios.put(`${API_URL}/api/clubs/${id}`, data, {
        withCredentials: true
    })
    return response.data
}

// Update Event Function
const updateEvent = async ({ id, data }: { id: string; data: any }) => {
    const response = await axios.put(`${API_URL}/api/events/${id}`, data, {
        withCredentials: true
    })
    return response.data
}

// Hook
export const useUpdateEntity = () => {
    const queryClient = useQueryClient()

    const updateClubMutation = useMutation({
        mutationFn: updateClub,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
        }
    })

    const updateEventMutation = useMutation({
        mutationFn: updateEvent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboardData'] })
        }
    })

    return {
        updateClub: updateClubMutation,
        updateEvent: updateEventMutation
    }
}
