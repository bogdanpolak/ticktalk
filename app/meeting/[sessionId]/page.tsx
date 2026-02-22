'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { useSession } from '@/app/hooks/useSession'
import { startMeeting } from '@/lib/session'
import { Timer } from '@/components/Timer'
import { MeetingControls } from '@/components/MeetingControls'
import { ParticipantList } from '@/components/ParticipantList'
import { SpeakerSelector } from '@/components/SpeakerSelector'
import { HandRaiseButton } from '@/components/HandRaiseButton'
import { MeetingSummary } from '@/components/MeetingSummary'
import type { Session } from '@/lib/session'

export default function MeetingPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const { userId, isLoading: authLoading } = useAuth()
  const { session, isLoading: sessionLoading, error: sessionError, speakerDisconnected } = useSession(sessionId, userId)

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
          speakerDisconnected={speakerDisconnected}
        />
      )
    case 'finished':
      return (
        <FinishedView
          session={session}
          userId={userId}
        />
      )
    default:
      return <ErrorView error="Unknown session status" />
  }
}

function LoadingView() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] flex items-center justify-center p-[var(--spacing-m)]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[var(--color-border)] border-t-[var(--color-brand)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)]">Loading meeting...</p>
      </div>
    </main>
  )
}

function ErrorView({ error }: { error: string }) {
  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] flex items-center justify-center p-[var(--spacing-m)]">
      <div className="w-full max-w-[400px] bg-[var(--color-surface-elevated)] rounded-lg p-[clamp(var(--spacing-l),5vw,var(--spacing-xl))] border border-[var(--color-error)]">
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
  const [startError, setStartError] = useState<string | null>(null)
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
    setStartError(null)
    setIsStarting(true)
    try {
      await startMeeting(sessionId)
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Failed to start meeting')
      setIsStarting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-[var(--spacing-m)]">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[24px] sm:text-[32px] font-medium leading-[1.3] mb-[var(--spacing-m)] sm:mb-[var(--spacing-l)]">Meeting Lobby</h1>

        {/* Session Info */}
        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-[var(--spacing-m)] sm:p-[var(--spacing-l)] mb-[var(--spacing-m)] sm:mb-[var(--spacing-l)] border border-[var(--color-border)]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-1">
            Slot Duration
          </p>
          <p className="text-lg font-medium">
            {Math.floor(session.slotDurationSeconds / 60)} min per speaker
          </p>
        </div>

        {/* Share Link */}
        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-[var(--spacing-m)] sm:p-[var(--spacing-l)] mb-[var(--spacing-m)] sm:mb-[var(--spacing-l)] border border-[var(--color-border)]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Share this link to invite participants:</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <code className="flex-1 bg-[var(--color-surface)] px-3 py-2 rounded text-[12px] sm:text-sm font-mono break-all order-2 sm:order-1">
              {joinLink}
            </code>
            <button
              onClick={handleCopyLink}
              className="h-11 px-4 sm:px-6 bg-[var(--color-brand)] text-white rounded hover:bg-[var(--color-brand-hover)] transition-colors font-medium text-sm order-1 sm:order-2 sm:whitespace-nowrap"
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-[var(--spacing-m)] sm:p-[var(--spacing-l)] mb-[var(--spacing-m)] sm:mb-[var(--spacing-l)] border border-[var(--color-border)]">
          <h2 className="text-lg font-medium mb-4">
            Participants ({participants.length})
          </h2>
          <ul className="space-y-2">
            {participants.map(([id, participant]) => (
              <li
                key={id}
                className="flex items-center gap-2 py-2 px-3 rounded bg-[var(--color-surface)]"
              >
                <span className="text-[14px] leading-[1.5] text-[var(--color-text-primary)] truncate">
                  {participant.name}
                </span>
                {participant.role === 'host' && (
                  <span className="text-xs bg-[var(--color-brand)] text-white px-2 py-0.5 rounded whitespace-nowrap">
                    Host
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Start Meeting or Waiting */}
        {isHost ? (
          <div className="flex flex-col gap-[var(--spacing-s)]">
            <button
              onClick={handleStartMeeting}
              disabled={isStarting}
              className="w-full h-11 px-[var(--spacing-m)] bg-[var(--color-brand)] text-[var(--color-surface)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
            >
              {isStarting ? 'Starting...' : 'Start Meeting'}
            </button>
            {startError && (
              <p className="text-[12px] leading-[1.4] text-[var(--color-error)]">
                {startError}
              </p>
            )}
          </div>
        ) : (
          <p className="text-center text-[var(--color-text-muted)] py-4">
            Waiting for host to start the meeting...
          </p>
        )}
      </div>
    </main>
  )
}

function FinishedView({
  session,
  userId
}: {
  session: Session
  userId: string | null
}) {
  const participants = Object.entries(session.participants)
  const isHost = userId === session.hostId
  const [showSummary, setShowSummary] = useState(true)

  if (showSummary) {
    return (
      <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-[var(--spacing-m)]">
        <div className="max-w-2xl mx-auto">
          <MeetingSummary session={session} />

          <div className="mt-[var(--spacing-l)] flex flex-col sm:flex-row gap-[var(--spacing-s)] sm:items-center sm:justify-between">
            {isHost && (
              <button
                type="button"
                onClick={() => setShowSummary(false)}
                className="h-11 px-[var(--spacing-m)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-surface-subtle)] active:bg-[var(--color-surface-subtle)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
              >
                Close Summary
              </button>
            )}

            <Link
              href="/"
              className="h-11 px-[var(--spacing-m)] inline-flex items-center justify-center bg-[var(--color-brand)] text-[var(--color-surface)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
            >
              Start a New Meeting
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-[var(--spacing-m)] flex items-center justify-center">
      <div className="w-full max-w-[400px] bg-[var(--color-surface-elevated)] rounded-lg p-[clamp(var(--spacing-l),5vw,var(--spacing-xl))] border border-[var(--color-border)]">
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
        <div className="flex flex-col gap-[var(--spacing-s)]">
          {isHost && (
            <button
              type="button"
              onClick={() => setShowSummary(true)}
              className="h-11 px-[var(--spacing-m)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-surface-subtle)] active:bg-[var(--color-surface-subtle)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
            >
              View Summary
            </button>
          )}
          <Link
            href="/"
            className="h-11 px-[var(--spacing-m)] inline-flex items-center justify-center bg-[var(--color-brand)] text-[var(--color-surface)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
          >
            Start a New Meeting
          </Link>
        </div>
      </div>
    </main>
  )
}

function ActiveMeetingView({
  session,
  sessionId,
  userId,
  speakerDisconnected
}: {
  session: Session
  sessionId: string
  userId: string | null
  speakerDisconnected: boolean
}): React.ReactNode {
  const [lastEndedSpeakerId, setLastEndedSpeakerId] = useState<string | null>(null)
  const [showHostPromotion, setShowHostPromotion] = useState(false)
  const prevHostIdRef = useRef<string>(session.hostId)
  
  const isHost = userId === session.hostId
  const currentParticipant = session.participants?.[userId || '']
  const isHandRaised = currentParticipant?.isHandRaised ?? false
  const isActiveSpeaker = userId === session.activeSpeakerId
  const showMeetingControls = isHost || isActiveSpeaker

  // Monitor for host changes
  useEffect(() => {
    const prevHostId = prevHostIdRef.current
    if (prevHostId !== session.hostId) {
      // Host changed, show notification
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowHostPromotion(true)
      const timer = setTimeout(() => setShowHostPromotion(false), 10000)
      prevHostIdRef.current = session.hostId
      return () => clearTimeout(timer)
    }
  }, [session.hostId])

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-[var(--spacing-m)]">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[18px] font-medium leading-[1.4] text-[var(--color-text-secondary)] mb-[var(--spacing-m)] sm:mb-[var(--spacing-l)]">
          Tick-Talk Meeting
        </h1>

        {/* Speaker Disconnect Warning */}
        {speakerDisconnected && isHost && session.activeSpeakerId && (
          <div className="mb-[var(--spacing-l)] rounded-[8px] border-l-4 border-[var(--color-error)] bg-[var(--color-error)]/10 p-[var(--spacing-l)]">
            <h3 className="text-[14px] leading-normal font-medium text-[var(--color-text-primary)]">
              Active Speaker Disconnected
            </h3>
            <p className="mt-[var(--spacing-xs)] text-[12px] leading-[1.4] text-[var(--color-text-secondary)]">
              {session.participants[session.activeSpeakerId]?.name || 'Speaker'} has lost connection. Please select a replacement speaker from the list below.
            </p>
          </div>
        )}

        {/* Host Role Change Notification */}
        {showHostPromotion && (
          <div className="mb-[var(--spacing-l)] rounded-[8px] border-l-4 border-[var(--color-brand)] bg-[var(--color-brand)]/10 p-[var(--spacing-l)]">
            <p className="text-[12px] leading-[1.4] text-[var(--color-text-secondary)]">
              <strong className="text-[var(--color-text-primary)]">{session.participants[session.hostId]?.name || 'A participant'}</strong> is now the host. The previous host has disconnected.
            </p>
          </div>
        )}

        <div className="space-y-[var(--spacing-l)]">
          <ParticipantList
            participants={session.participants}
            activeSpeakerId={session.activeSpeakerId ?? null}
            spokenUserIds={session.spokenUserIds || []}
            hostId={session.hostId}
          />

          <Timer
            slotEndsAt={session.slotEndsAt ?? null}
            slotDurationSeconds={session.slotDurationSeconds}
          />

          <MeetingControls
            sessionId={sessionId}
            currentUserId={userId}
            activeSpeakerId={session.activeSpeakerId ?? null}
            isHost={isHost}
            isActiveSpeaker={isActiveSpeaker}
            isVisible={showMeetingControls}
            hasEligibleCandidates={Object.entries(session.participants).some(
              ([participantId]) =>
                !(session.spokenUserIds || []).includes(participantId)
            )}
            participants={session.participants}
            spokenUserIds={session.spokenUserIds || []}
            onSlotEnded={setLastEndedSpeakerId}
          />

          <HandRaiseButton
            sessionId={sessionId}
            currentUserId={userId}
            isActiveSpeaker={isActiveSpeaker}
            isHandRaised={isHandRaised}
          />

          <SpeakerSelector
            sessionId={sessionId}
            participants={session.participants}
            spokenUserIds={session.spokenUserIds || []}
            currentUserId={userId}
            activeSpeakerId={session.activeSpeakerId ?? null}
            isHost={isHost}
            lastEndedSpeakerId={lastEndedSpeakerId}
          />

        </div>
      </div>
    </main>
  )
}
