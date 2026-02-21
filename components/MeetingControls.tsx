'use client'

import { useState } from 'react'
import { endCurrentSlot } from '@/lib/session'

interface MeetingControlsProps {
  sessionId: string
  currentUserId: string | null
  activeSpeakerId: string | null
  hostId: string
  hasEligibleCandidates: boolean
  onSlotEnded?: (speakerId: string | null) => void
}

export function MeetingControls({
  sessionId,
  currentUserId,
  activeSpeakerId,
  hostId,
  hasEligibleCandidates,
  onSlotEnded
}: MeetingControlsProps) {
  const [isEnding, setIsEnding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isActiveSpeaker = currentUserId === activeSpeakerId
  const isHost = currentUserId === hostId
  const noActiveSpeaker = activeSpeakerId === null

  const handleEndSlot = async () => {
    setError(null)
    setIsEnding(true)

    try {
      await endCurrentSlot(sessionId)
      onSlotEnded?.(currentUserId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end slot')
      setIsEnding(false)
    }
  }

  if (!isActiveSpeaker && !(noActiveSpeaker && isHost && !hasEligibleCandidates)) {
    return null
  }

  return (
    <section className="mt-[var(--spacing-l)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[8px] p-[var(--spacing-l)]">
      <div className="flex flex-col gap-[var(--spacing-m)]">
        {isActiveSpeaker && (
          <div className="flex flex-col gap-[var(--spacing-s)]">
            <p className="text-[14px] leading-[1.5] text-[var(--color-text-secondary)]">
              Ready to pass the floor to the next speaker?
            </p>
            <button
              type="button"
              onClick={handleEndSlot}
              disabled={isEnding}
              className="h-11 px-[var(--spacing-m)] bg-[var(--color-brand)] text-[var(--color-surface)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
            >
              {isEnding ? 'Ending...' : 'End My Slot'}
            </button>
          </div>
        )}

        {noActiveSpeaker && isHost && !hasEligibleCandidates && (
          <p className="text-[14px] leading-[1.5] text-[var(--color-text-muted)]">
            Everyone has spoken this round. Waiting for the next round.
          </p>
        )}

        {error && (
          <div className="border border-[var(--color-error)] bg-[var(--color-error)]/10 rounded-[4px] p-[var(--spacing-s)] text-[14px] leading-[1.5] text-[var(--color-error)]">
            {error}
          </div>
        )}
      </div>
    </section>
  )
}
