'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@/lib/session'
import {
  sessionService as defaultSessionService,
  type SessionService
} from '@/lib/services/sessionService'

interface SessionState {
  session: Session | null
  isLoading: boolean
  error?: string
  speakerDisconnected: boolean
}

interface UseSessionOptions {
  sessionService?: SessionService
}

export function useSession(
  sessionId: string | null,
  userId: string | null = null,
  options: UseSessionOptions = {}
): SessionState {
  const sessionService = options.sessionService ?? defaultSessionService
  const [state, setState] = useState<SessionState>({
    session: null,
    isLoading: true,
    error: undefined,
    speakerDisconnected: false
  })

  useEffect(() => {
    if (!sessionId || !userId) return

    const cleanup = sessionService.monitorPresence(sessionId, userId)
    return cleanup
  }, [sessionId, userId, sessionService])

  useEffect(() => {
    if (!sessionId) {
      return
    }

    let isCurrentSubscription = true
    let prevHostId: string | null = null

    const unsubscribe = sessionService.subscribeSession(
      sessionId,
      session => {
        if (!isCurrentSubscription) return

        if (!session) {
          setState({
            session: null,
            isLoading: false,
            error: 'Session not found',
            speakerDisconnected: false
          })
          return
        }

        if (prevHostId !== null && prevHostId !== session.hostId) {
          console.log('Host changed from', prevHostId, 'to', session.hostId)
        }
        prevHostId = session.hostId

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

    return () => {
      isCurrentSubscription = false
      unsubscribe()
    }
  }, [sessionId, sessionService])

  return state
}
