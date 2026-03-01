'use client'

import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useSession } from '@/hooks/useSession'
import { LoadingView } from '../../_components/meeting/LoadingView'
import { ErrorView } from '../../_components/meeting/ErrorView'
import { LobbyView } from '../../_components/meeting/LobbyView'
import { ActiveMeetingView } from '../../_components/meeting/ActiveMeetingView'
import { FinishedView } from '../../_components/meeting/FinishedView'

export default function MeetingPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const { userId, isLoading: authLoading } = useAuth()
  const { session, isLoading: sessionLoading, error: sessionError, speakerDisconnected } = useSession(sessionId, userId)

  if (authLoading || sessionLoading) return <LoadingView />
  if (sessionError || !session) return <ErrorView error={sessionError || 'Session not found'} />

  switch (session.status) {
    case 'lobby':
      return <LobbyView session={session} sessionId={sessionId} userId={userId} />
    case 'active':
      return <ActiveMeetingView session={session} sessionId={sessionId} userId={userId} speakerDisconnected={speakerDisconnected} />
    case 'finished':
      return <FinishedView session={session} userId={userId} />
    default:
      return <ErrorView error="Unknown session status" />
  }
}
