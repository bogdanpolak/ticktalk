'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { selectNextSpeaker } from '@/lib/session'
import type { Participant } from '@/lib/session'

interface SpeakerSelectorProps {
  sessionId: string
  participants: Record<string, Participant>
  spokenUserIds: string[]
  currentUserId: string | null
  activeSpeakerId: string | null
  isHost: boolean
}

interface CandidateEntry {
  userId: string
  name: string
  isHandRaised: boolean
  hasSpoken: boolean
}

export function SpeakerSelector({
  sessionId,
  participants,
  spokenUserIds,
  currentUserId,
  activeSpeakerId,
  isHost
}: SpeakerSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastActiveSpeakerId = useRef<string | null>(null)

  useEffect(() => {
    if (activeSpeakerId) {
      lastActiveSpeakerId.current = activeSpeakerId
    }
  }, [activeSpeakerId])

  const isCurrentSpeaker = currentUserId === activeSpeakerId
  const noActiveSpeaker = !activeSpeakerId
  const canSelect =
    isCurrentSpeaker ||
    (noActiveSpeaker && (isHost || currentUserId === lastActiveSpeakerId.current))

  const candidates = useMemo<CandidateEntry[]>(() => {
    return Object.entries(participants)
      .filter(([id]) => id !== currentUserId)
      .map(([userId, participant]) => ({
        userId,
        name: participant.name,
        isHandRaised: participant.isHandRaised,
        hasSpoken: spokenUserIds.includes(userId)
      }))
      .sort((a, b) => {
        if (a.isHandRaised && !b.isHandRaised) return -1
        if (!a.isHandRaised && b.isHandRaised) return 1
        return a.name.localeCompare(b.name)
      })
  }, [participants, currentUserId, spokenUserIds])

  if (!canSelect) {
    return null
  }

  const eligibleCandidates = candidates.filter(candidate => !candidate.hasSpoken)
  const eligibleCount = eligibleCandidates.length

  const handleSelect = async (nextSpeakerId: string) => {
    setError(null)
    setIsSelecting(true)

    try {
      await selectNextSpeaker(sessionId, nextSpeakerId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select speaker')
      setIsSelecting(false)
    }
  }

  return (
    <section className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[8px] p-[var(--spacing-l)]">
      <h2 className="text-[18px] leading-[1.4] font-medium text-[var(--color-text-primary)]">
        Select Next Speaker
      </h2>
      <p className="mt-[var(--spacing-xs)] text-[14px] leading-normal text-[var(--color-text-secondary)]">
        {eligibleCount} participant{eligibleCount !== 1 ? 's' : ''} remaining in this round
      </p>

      {error && (
        <div className="mt-[var(--spacing-m)] border border-[var(--color-error)] bg-[var(--color-error)]/10 rounded-[4px] p-[var(--spacing-s)] text-[14px] leading-normal text-[var(--color-error)]">
          {error}
        </div>
      )}

      {eligibleCandidates.length === 0 ? (
        <p className="mt-[var(--spacing-m)] text-[14px] leading-normal text-[var(--color-text-muted)]">
          {candidates.length === 0
            ? 'No other participants in the session'
            : 'No eligible participants remaining in this round'}
        </p>
      ) : (
        <ul className="mt-[var(--spacing-m)] space-y-[var(--spacing-s)]">
          {eligibleCandidates.map(candidate => {
            return (
              <li key={candidate.userId}>
                <button
                  onClick={() => handleSelect(candidate.userId)}
                  disabled={isSelecting}
                  className={[
                    'w-full min-h-11 px-[var(--spacing-m)] py-[var(--spacing-s)] flex items-center justify-between text-left rounded-[8px] border transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0',
                    'bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] border-[var(--color-border)] cursor-pointer',
                    candidate.isHandRaised ? 'border-[var(--color-warning)]' : ''
                  ].join(' ')}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[18px] leading-[1.4]" aria-hidden="true">
                      {candidate.isHandRaised ? '✋' : '👤'}
                    </span>
                    <span
                      className={[
                        'text-[14px] leading-normal font-normal text-[var(--color-text-primary)]'
                      ].join(' ')}
                    >
                      {candidate.name}
                    </span>
                  </span>

                  <span className="text-[11px] leading-[1.4] text-[var(--color-text-muted)]">
                    {isSelecting ? 'Selecting...' : 'Tap to select'}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
