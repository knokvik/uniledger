import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Fetch dashboard data (clubs and events for the logged-in user)
 */
const fetchDashboardData = async () => {
    const response = await axios.get(`${API_URL}/api/dashboard`, {
        withCredentials: true
    })
    return response.data.data
}

/**
 * Custom hook to fetch dashboard data
 * @returns {Object} Query result with clubs and events data
 */
export const useDashboardData = () => {
    return useQuery({
        queryKey: ['dashboard'],
        queryFn: fetchDashboardData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1
    })
}
