'use client'

import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Session } from '@/lib/session'

interface SessionState {
  session: Session | null
  isLoading: boolean
  error?: string
}

export function useSession(sessionId: string | null): SessionState {
  const [state, setState] = useState<SessionState>({
    session: null,
    isLoading: true,
    error: undefined
  })

  useEffect(() => {
    // If no sessionId provided, reset state and early return
    if (!sessionId) {
      return
    }

    const sessionRef = ref(db, `sessions/${sessionId}`)

    let isCurrentSubscription = true

    const unsubscribe = onValue(
      sessionRef,
      snapshot => {
        if (!isCurrentSubscription) return

        if (snapshot.exists()) {
          setState({
            session: snapshot.val() as Session,
            isLoading: false
          })
        } else {
          setState({
            session: null,
            isLoading: false,
            error: 'Session not found'
          })
        }
      },
      error => {
        if (!isCurrentSubscription) return

        setState({
          session: null,
          isLoading: false,
          error: error.message
        })
      }
    )

    // Cleanup listener on unmount or sessionId change
    return () => {
      isCurrentSubscription = false
      unsubscribe()
    }
  }, [sessionId])

  return state
}
