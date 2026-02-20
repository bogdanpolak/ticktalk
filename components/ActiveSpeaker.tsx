'use client'

import { useState } from 'react'
import { endCurrentSlot, endMeeting } from '@/lib/session'

interface ActiveSpeakerProps {
  activeSpeakerId: string | null
  activeSpeakerName: string | null
  currentUserId: string | null
  isHost: boolean
  sessionId: string
  sessionStatus: 'lobby' | 'active' | 'finished'
}

export function ActiveSpeaker({
  activeSpeakerId,
  activeSpeakerName,
  currentUserId,
  isHost,
  sessionId,
  sessionStatus
}: ActiveSpeakerProps) {
  const [isEnding, setIsEnding] = useState(false)
  const isCurrentSpeaker = currentUserId === activeSpeakerId
  const hasSpeaker = activeSpeakerId !== null

  const handleEndSlot = async () => {
    setIsEnding(true)
    try {
      await endCurrentSlot(sessionId)
    } catch (err) {
      console.error('Failed to end slot:', err)
    } finally {
      setIsEnding(false)
    }
  }

  const handleEndMeeting = async () => {
    setIsEnding(true)
    try {
      await endMeeting(sessionId)
    } catch (err) {
      console.error('Failed to end meeting:', err)
    } finally {
      setIsEnding(false)
    }
  }

  if (!hasSpeaker) {
    return (
      <section className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[8px] p-[var(--spacing-xl)] text-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5),_0_2px_4px_-1px_rgba(0,0,0,0.3)]">
        <p className="text-[18px] font-medium leading-[1.4] text-[var(--color-text-muted)] mb-[var(--spacing-s)]">
          No active speaker
        </p>
        <p className="text-[14px] leading-[1.5] text-[var(--color-text-secondary)]">
          {isHost
            ? 'Select the first speaker to begin'
            : 'Waiting for speaker selection...'}
        </p>

        {isHost && sessionStatus === 'active' && (
          <button
            type="button"
            onClick={handleEndMeeting}
            disabled={isEnding}
            className="mt-[var(--spacing-l)] h-11 px-[var(--spacing-m)] bg-[var(--color-error)] text-[var(--color-surface)] text-[12px] font-medium rounded-[0px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
          >
            {isEnding ? 'Ending...' : 'End Meeting'}
          </button>
        )}
      </section>
    )
  }

  return (
    <section className="bg-[var(--color-surface-elevated)] border-2 border-[var(--color-brand)] rounded-[8px] p-[var(--spacing-xl)] text-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5),_0_2px_4px_-1px_rgba(0,0,0,0.3)]">
      <div className="text-[32px] mb-[var(--spacing-m)]">🎤</div>
      <h2 className="text-[24px] font-medium leading-[1.3] text-[var(--color-text-primary)] mb-[var(--spacing-s)]">
        {activeSpeakerName ?? 'Unknown'}
      </h2>
      <p className="text-[12px] font-medium text-[var(--color-brand)] mb-[var(--spacing-l)]">
        Currently Speaking
      </p>

      {isCurrentSpeaker && (
        <button
          type="button"
          onClick={handleEndSlot}
          disabled={isEnding}
          className="h-11 px-[var(--spacing-l)] bg-[var(--color-warning)] text-[var(--color-surface)] text-[12px] font-medium rounded-[0px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
        >
          {isEnding ? 'Ending...' : 'End My Slot'}
        </button>
      )}
    </section>
  )
}
