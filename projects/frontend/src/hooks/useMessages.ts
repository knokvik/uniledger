import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Fetch Messages
const fetchMessages = async (channelId: string) => {
    const response = await axios.get(`${API_URL}/api/messages/${channelId}`, {
        withCredentials: true
    })
    return response.data.data
}

// Send Message
const sendMessage = async (data: { channelId: string; content: string }) => {
    const response = await axios.post(`${API_URL}/api/messages`, data, {
        withCredentials: true
    })
    return response.data.data
}

export const useMessages = (channelId: string | null) => {
    const queryClient = useQueryClient()

    const messagesQuery = useQuery({
        queryKey: ['messages', channelId],
        queryFn: () => fetchMessages(channelId!),
        enabled: !!channelId,
        refetchInterval: 3000, // Poll every 3 seconds for near real-time updates
    })

    const sendMessageMutation = useMutation({
        mutationFn: sendMessage,
        onSuccess: () => {
            // Invalidate queries to fetch new messages immediately
            queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
        }
    })

    return {
        messages: messagesQuery.data,
        isLoading: messagesQuery.isLoading,
        error: messagesQuery.error,
        sendMessage: sendMessageMutation
    }
}
