'use client'

import { useMemo, useState } from 'react'
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

  const isCurrentSpeaker = currentUserId === activeSpeakerId
  const noActiveSpeaker = activeSpeakerId === null
  const canSelect = isCurrentSpeaker || (isHost && noActiveSpeaker)

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
        if (!a.hasSpoken && b.hasSpoken) return -1
        if (a.hasSpoken && !b.hasSpoken) return 1
        return a.name.localeCompare(b.name)
      })
  }, [participants, currentUserId, spokenUserIds])

  if (!canSelect) {
    return null
  }

  const eligibleCount = candidates.filter(candidate => !candidate.hasSpoken).length

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
    <section className="bg-(--color-surface-elevated) border border-(--color-border) rounded-lg p-4 sm:p-6">
      <h2 className="text-[18px] leading-[1.4] font-medium text-(--color-text-primary)">
        Select Next Speaker
      </h2>
      <p className="mt-1 text-[14px] leading-normal text-(--color-text-secondary)">
        {eligibleCount} participant{eligibleCount !== 1 ? 's' : ''} remaining in this round
      </p>

      {error && (
        <div className="mt-4 border border-(--color-error) bg-(--color-error)/10 rounded-sm p-3 text-[14px] leading-normal text-(--color-error)">
          {error}
        </div>
      )}

      {candidates.length === 0 ? (
        <p className="mt-4 text-[14px] leading-normal text-(--color-text-muted)">
          No other participants in the session
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {candidates.map(candidate => {
            const isEligible = !candidate.hasSpoken

            return (
              <li key={candidate.userId}>
                <button
                  onClick={() => handleSelect(candidate.userId)}
                  disabled={!isEligible || isSelecting}
                  className={[
                    'w-full min-h-11 px-4 py-3 flex items-center justify-between text-left rounded-lg border transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-(--color-focus-ring) focus-visible:outline-offset-0',
                    isEligible
                      ? 'bg-(--color-surface) hover:bg-(--color-surface-subtle) border-(--color-border) cursor-pointer'
                      : 'bg-(--color-surface) border-(--color-border) opacity-50 cursor-not-allowed',
                    candidate.isHandRaised && isEligible ? 'border-(--color-warning)' : ''
                  ].join(' ')}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[18px] leading-[1.4]" aria-hidden="true">
                      {candidate.hasSpoken ? '✅' : candidate.isHandRaised ? '✋' : '👤'}
                    </span>
                    <span
                      className={[
                        'text-[14px] leading-normal font-normal',
                        isEligible ? 'text-(--color-text-primary)' : 'text-(--color-text-muted)'
                      ].join(' ')}
                    >
                      {candidate.name}
                    </span>
                  </span>

                  <span className="text-[11px] leading-[1.4] text-(--color-text-muted)">
                    {candidate.hasSpoken
                      ? 'Already spoken'
                      : isSelecting
                        ? 'Selecting...'
                        : 'Tap to select'}
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
