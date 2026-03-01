'use client'

import { useState } from 'react'
import { startMeeting } from '@/lib/session'
import type { Session } from '@/lib/session'

export function LobbyView({
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
