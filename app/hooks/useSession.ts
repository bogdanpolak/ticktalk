'use client'

import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Session, monitorPresence } from '@/lib/session'

interface SessionState {
  session: Session | null
  isLoading: boolean
  error?: string
  speakerDisconnected: boolean
}

export function useSession(sessionId: string | null, userId: string | null = null): SessionState {
  const [state, setState] = useState<SessionState>({
    session: null,
    isLoading: true,
    error: undefined,
    speakerDisconnected: false
  })

  // Set up presence monitoring for current user
  useEffect(() => {
    if (!sessionId || !userId) return

    const cleanup = monitorPresence(sessionId, userId)
    return cleanup
  }, [sessionId, userId])

  useEffect(() => {
    // If no sessionId provided, reset state and early return
    if (!sessionId) {
      return
    }

    const sessionRef = ref(db, `sessions/${sessionId}`)

    let isCurrentSubscription = true
    let prevHostId: string | null = null

    const unsubscribe = onValue(
      sessionRef,
      snapshot => {
        if (!isCurrentSubscription) return

        if (snapshot.exists()) {
          const session = snapshot.val() as Session
          
          // Check for host change (disconnect scenario)
          if (prevHostId !== null && prevHostId !== session.hostId) {
            // Host has changed - previous host likely disconnected
            console.log('Host changed from', prevHostId, 'to', session.hostId)
          }
          prevHostId = session.hostId

          // Check speaker presence
          const activeSpeakerId = session.activeSpeakerId
          let speakerDisconnected = false
          
          if (activeSpeakerId && session.presence) {
            const speakerPresence = session.presence[activeSpeakerId]
            speakerDisconnected = !speakerPresence || speakerPresence.status === 'offline'
          }

          setState({
            session,
            isLoading: false,
            speakerDisconnected
          })
        } else {
          setState({
            session: null,
            isLoading: false,
            error: 'Session not found',
            speakerDisconnected: false
          })
        }
      },
      error => {
        if (!isCurrentSubscription) return

        setState({
          session: null,
          isLoading: false,
          error: error.message,
          speakerDisconnected: false
        })
      }
    )

    // Cleanup listener on unmount or sessionId change
    return () => {
      isCurrentSubscription = false
      unsubscribe()
    }
  }, [sessionId, userId])

  return state
}
