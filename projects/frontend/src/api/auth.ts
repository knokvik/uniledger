import axiosInstance from './axios'

export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterCredentials {
    email: string
    password: string
    name?: string
}

export interface AuthResponse {
    success: boolean
    message: string
    user?: {
        id: string
        email: string
        name?: string
    }
}

export const authAPI = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const { data } = await axiosInstance.post('/auth/login', credentials)
        return data
    },

    register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
        const { data } = await axiosInstance.post('/auth/signup', credentials)
        return data
    },

    logout: async (): Promise<AuthResponse> => {
        const { data } = await axiosInstance.post('/auth/logout')
        return data
    },

    getCurrentUser: async (): Promise<AuthResponse> => {
        const { data } = await axiosInstance.get('/auth/me')
        return data
    },
}
