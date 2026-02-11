import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Create Channel
const createChannel = async (data: { name: string; description?: string; visibility: string; type: 'club' | 'event'; type_id: string }) => {
    const response = await axios.post(`${API_URL}/api/channels`, data, { withCredentials: true })
    return response.data
}

// Update Channel
const updateChannel = async ({ id, data }: { id: string; data: Partial<{ name: string; description?: string; visibility?: string }> }) => {
    const response = await axios.put(`${API_URL}/api/channels/${id}`, data, { withCredentials: true })
    return response.data;
};

// Delete Channel
const deleteChannel = async (id: string) => {
    const response = await axios.delete(`${API_URL}/api/channels/${id}`, { withCredentials: true })
    return response.data
}

export const useManageChannels = () => {
    const queryClient = useQueryClient()

    const createChannelMutation = useMutation({
        mutationFn: createChannel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channels'] })
        }
    })

    const updateChannelMutation = useMutation({
        mutationFn: updateChannel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channels'] })
        }
    })

    const deleteChannelMutation = useMutation({
        mutationFn: deleteChannel,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channels'] })
        }
    })

    return {
        createChannel: createChannelMutation,
        updateChannel: updateChannelMutation,
        deleteChannel: deleteChannelMutation
    }
}
