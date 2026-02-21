'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { useSession } from '@/app/hooks/useSession'
import { startMeeting } from '@/lib/session'
import { ActiveSpeaker } from '@/components/ActiveSpeaker'
import { Timer } from '@/components/Timer'
import { SpeakerSelector } from '@/components/SpeakerSelector'
import type { Session } from '@/lib/session'

export default function MeetingPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const { userId, isLoading: authLoading } = useAuth()
  const { session, isLoading: sessionLoading, error: sessionError } = useSession(sessionId)

  if (authLoading || sessionLoading) {
    return <LoadingView />
  }

  if (sessionError || !session) {
    return <ErrorView error={sessionError || 'Session not found'} />
  }

  switch (session.status) {
    case 'lobby':
      return (
        <LobbyView
          session={session}
          sessionId={sessionId}
          userId={userId}
        />
      )
    case 'active':
      return (
        <ActiveMeetingView
          session={session}
          sessionId={sessionId}
          userId={userId}
        />
      )
    case 'finished':
      return <FinishedView session={session} />
    default:
      return <ErrorView error="Unknown session status" />
  }
}

function LoadingView() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)]">Loading meeting...</p>
      </div>
    </main>
  )
}

function ErrorView({ error }: { error: string }) {
  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--color-surface-elevated)] rounded-lg p-8 border border-[var(--color-error)]">
        <h1 className="text-[32px] font-medium leading-[1.3] mb-4 text-[var(--color-error)]">Error</h1>
        <p className="text-[var(--color-text-secondary)] mb-6">{error}</p>
        <Link
          href="/"
          className="block text-center bg-[var(--color-brand)] text-white font-medium py-3 rounded-lg hover:bg-[var(--color-brand-hover)] transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </main>
  )
}

function LobbyView({
  session,
  sessionId,
  userId
}: {
  session: Session
  sessionId: string
  userId: string | null
}) {
  const [isCopied, setIsCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const isHost = userId === session.hostId

  const joinLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${sessionId}`
  const participants = Object.entries(session.participants)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const handleStartMeeting = async () => {
    setIsStarting(true)
    try {
      await startMeeting(sessionId)
    } catch (err) {
      console.error('Failed to start meeting:', err)
      setIsStarting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[32px] font-medium leading-[1.3] mb-6">Meeting Lobby</h1>

        {/* Session Info */}
        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-6 mb-6 border border-[var(--color-border)]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-1">
            Slot Duration
          </p>
          <p className="text-lg font-medium">
            {Math.floor(session.slotDurationSeconds / 60)} min per speaker
          </p>
        </div>

        {/* Share Link */}
        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-6 mb-6 border border-[var(--color-border)]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Share this link to invite participants:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-[var(--color-surface)] px-3 py-2 rounded text-sm font-mono break-all">
              {joinLink}
            </code>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-[var(--color-brand)] text-white rounded hover:bg-[var(--color-brand-hover)] transition-colors whitespace-nowrap"
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-6 mb-6 border border-[var(--color-border)]">
          <h2 className="text-lg font-medium mb-4">
            Participants ({participants.length})
          </h2>
          <ul className="space-y-2">
            {participants.map(([id, participant]) => (
              <li
                key={id}
                className="flex items-center gap-2 py-2 px-3 rounded bg-[var(--color-surface)]"
              >
                <span className="text-[var(--color-text-primary)]">
                  {participant.name}
                </span>
                {participant.role === 'host' && (
                  <span className="text-xs bg-[var(--color-brand)] text-white px-2 py-0.5 rounded">
                    Host
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Start Meeting or Waiting */}
        {isHost ? (
          <button
            onClick={handleStartMeeting}
            disabled={isStarting || participants.length < 2}
            className="w-full py-3 bg-[var(--color-success)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isStarting ? 'Starting...' : 'Start Meeting'}
          </button>
        ) : (
          <p className="text-center text-[var(--color-text-muted)] py-4">
            Waiting for host to start the meeting...
          </p>
        )}
      </div>
    </main>
  )
}

function FinishedView({ session }: { session: Session }) {
  const participants = Object.entries(session.participants)

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-[var(--color-surface-elevated)] rounded-lg p-8 border border-[var(--color-border)]">
        <h1 className="text-[32px] font-medium leading-[1.3] mb-4">Meeting Ended</h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Thanks for participating! Here&apos;s who joined:
        </p>
        <ul className="space-y-2 mb-8">
          {participants.map(([id, participant]) => (
            <li key={id} className="py-2 px-3 rounded bg-[var(--color-surface)]">
              {participant.name}
              {participant.role === 'host' && ' (Host)'}
            </li>
          ))}
        </ul>
        <Link
          href="/"
          className="block text-center bg-[var(--color-brand)] text-white font-medium py-3 rounded-lg hover:bg-[var(--color-brand-hover)] transition-colors"
        >
          Start a New Meeting
        </Link>
      </div>
    </main>
  )
}

function ActiveMeetingView({
  session,
  sessionId,
  userId
}: {
  session: Session
  sessionId: string
  userId: string | null
}): React.ReactNode {
  const isHost = userId === session.hostId
  const activeSpeakerName = session.activeSpeakerId
    ? session.participants[session.activeSpeakerId]?.name ?? 'Waiting for speaker'
    : null

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[18px] font-medium leading-[1.4] text-[var(--color-text-secondary)] mb-6">
          Tick-Talk Meeting
        </h1>

        <ActiveSpeaker
          activeSpeakerId={session.activeSpeakerId}
          activeSpeakerName={activeSpeakerName}
          currentUserId={userId}
          isHost={isHost}
          sessionId={sessionId}
          sessionStatus={session.status}
        />

        {/* Timer — REQ-0009 */}
        <div className="mt-6">
          <Timer
            slotEndsAt={session.slotEndsAt}
            slotDurationSeconds={session.slotDurationSeconds}
          />
        </div>

        {/* Participant List — REQ-0013 */}
        {/* Speaker Selector — REQ-0011 */}
        <div className="mt-6">
          <SpeakerSelector
            sessionId={sessionId}
            participants={session.participants}
            spokenUserIds={session.spokenUserIds || []}
            currentUserId={userId}
            activeSpeakerId={session.activeSpeakerId}
            isHost={isHost}
          />
        </div>
      </div>
    </main>
  )
}
