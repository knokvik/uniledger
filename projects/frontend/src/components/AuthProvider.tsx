import React from 'react'
import { useAuth } from '../hooks/useAuth'

interface AuthProviderProps {
    children: React.ReactNode
}

/**
 * Ensures the useAuth hook is called at the app level
 * This triggers the session check on page load
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // Call useAuth here to trigger the session check on app mount
    useAuth()

    return <>{children}</>
}

export default AuthProvider
