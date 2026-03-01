'use client'

import { useEffect, useState } from 'react'
import { authService as defaultAuthService, type AuthService } from '@/lib/services/authService'

interface AuthState {
  userId: string | null
  isLoading: boolean
  error?: string
}

interface UseAuthOptions {
  authService?: AuthService
}

export function useAuth(options: UseAuthOptions = {}): AuthState {
  const authService = options.authService ?? defaultAuthService
  const [state, setState] = useState<AuthState>({
    userId: null,
    isLoading: true,
    error: undefined
  })

  useEffect(() => {
    let isMounted = true

    const authenticate = async () => {
      try {
        const userId = await authService.getCurrentUserId()

        if (isMounted) {
          setState({
            userId,
            isLoading: false
          })
        }
      } catch (error) {
        if (isMounted) {
          setState({
            userId: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    authenticate()

    return () => {
      isMounted = false
    }
  }, [authService])

  return state
}
