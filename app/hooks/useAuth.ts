'use client'

import { useEffect, useState } from 'react'
import { signInAnonymously } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthState {
  userId: string | null
  isLoading: boolean
  error?: string
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    userId: null,
    isLoading: true,
    error: undefined
  })

  useEffect(() => {
    let isMounted = true

    const authenticate = async () => {
      try {
        // Check if user already authenticated
        if (auth.currentUser) {
          if (isMounted) {
            setState({
              userId: auth.currentUser.uid,
              isLoading: false
            })
          }
          return
        }

        // Sign in anonymously
        const userCredential = await signInAnonymously(auth)
        if (isMounted) {
          setState({
            userId: userCredential.user.uid,
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
  }, [])

  return state
}
