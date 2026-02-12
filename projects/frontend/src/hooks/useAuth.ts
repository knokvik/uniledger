import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authAPI, LoginCredentials, RegisterCredentials } from '../api/auth'
import { useAppDispatch } from '../store/hooks'
import { setUser, clearUser, setLoading } from '../store/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export const useAuth = () => {
    const dispatch = useAppDispatch()
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    // Get current user on mount - with retry on first load
    const { data: currentUser, isLoading, error: currentUserError } = useQuery({
        queryKey: ['currentUser'],
        queryFn: authAPI.getCurrentUser,
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    // Sync the query loading state to Redux
    useEffect(() => {
        dispatch(setLoading(isLoading))
    }, [isLoading, dispatch])

    // Handle current user data
    useEffect(() => {
        if (currentUser?.success && currentUser.user) {
            dispatch(setUser(currentUser.user))
        } else if (!isLoading && (currentUserError || !currentUser)) {
            // Only clear when loading is done and there's an error or no data
            dispatch(clearUser())
        }
    }, [currentUser, currentUserError, isLoading, dispatch])

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: (credentials: LoginCredentials) => authAPI.login(credentials),
    })

    // Handle login success
    useEffect(() => {
        if (loginMutation.isSuccess && loginMutation.data?.success && loginMutation.data.user) {
            dispatch(setUser(loginMutation.data.user))
            queryClient.setQueryData(['currentUser'], loginMutation.data)
            navigate('/')
        }
    }, [loginMutation.isSuccess, loginMutation.data, dispatch, queryClient, navigate])

    // Register mutation
    const registerMutation = useMutation({
        mutationFn: (credentials: RegisterCredentials) => authAPI.register(credentials),
    })

    // Handle register success
    useEffect(() => {
        if (registerMutation.isSuccess && registerMutation.data?.success && registerMutation.data.user) {
            dispatch(setUser(registerMutation.data.user))
            queryClient.setQueryData(['currentUser'], registerMutation.data)
            navigate('/')
        }
    }, [registerMutation.isSuccess, registerMutation.data, dispatch, queryClient, navigate])

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: authAPI.logout,
    })

    // Handle logout success
    useEffect(() => {
        if (logoutMutation.isSuccess) {
            dispatch(clearUser())
            queryClient.clear()
            navigate('/login')
        }
    }, [logoutMutation.isSuccess, dispatch, queryClient, navigate])

    return {
        login: loginMutation.mutate,
        register: registerMutation.mutate,
        logout: logoutMutation.mutate,
        isLoginLoading: loginMutation.isPending,
        isRegisterLoading: registerMutation.isPending,
        isLogoutLoading: logoutMutation.isPending,
        loginError: loginMutation.error,
        registerError: registerMutation.error,
        isAuthLoading: isLoading,
        user: currentUser?.user,
        isAuthenticated: !!currentUser?.user
    }
}
