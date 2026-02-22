'use client'

import { useState } from 'react'
import { endCurrentSlot, endMeeting } from '@/lib/session'
import { EndMeetingDialog } from '@/components/EndMeetingDialog'
import type { Session } from '@/lib/session'

interface MeetingControlsProps {
  sessionId: string
  currentUserId: string | null
  activeSpeakerId: string | null
  isHost: boolean
  isActiveSpeaker: boolean
  isVisible: boolean
  hasEligibleCandidates: boolean
  participants: Session['participants']
  spokenUserIds: string[]
  onSlotEnded?: (speakerId: string | null) => void
}

export function MeetingControls({
  sessionId,
  currentUserId,
  activeSpeakerId,
  isHost,
  isActiveSpeaker,
  isVisible,
  hasEligibleCandidates,
  participants,
  spokenUserIds,
  onSlotEnded
}: MeetingControlsProps) {
  const [isEndingSlot, setIsEndingSlot] = useState(false)
  const [slotError, setSlotError] = useState<string | null>(null)
  const [isEndingMeeting, setIsEndingMeeting] = useState(false)
  const [meetingError, setMeetingError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const noActiveSpeaker = activeSpeakerId === null
  const unspokenCount = Object.keys(participants).filter(
    participantId => !spokenUserIds.includes(participantId)
  ).length

  const handleEndSlot = async () => {
    setSlotError(null)
    setIsEndingSlot(true)

    try {
      await endCurrentSlot(sessionId)
      onSlotEnded?.(currentUserId)
    } catch (err) {
      setSlotError(err instanceof Error ? err.message : 'Failed to end slot')
      setIsEndingSlot(false)
    }
  }

  const handleEndMeeting = async () => {
    setMeetingError(null)
    setIsEndingMeeting(true)
    try {
      await endMeeting(sessionId)
      setIsDialogOpen(false)
    } catch (err) {
      setMeetingError(err instanceof Error ? err.message : 'Failed to end meeting')
      setIsEndingMeeting(false)
    }
  }

  const handleEndMeetingClick = () => {
    if (unspokenCount > 0) {
      setIsDialogOpen(true)
      return
    }

    void handleEndMeeting()
  }

  if (!isVisible) {
    return null
  }

  return (
    <section className="mt-[var(--spacing-m)] sm:mt-[var(--spacing-l)] bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[8px] p-[var(--spacing-m)] sm:p-[var(--spacing-l)]">
      <div className="flex flex-col gap-[var(--spacing-m)]">
        {isActiveSpeaker && (
          <div className="flex flex-col gap-[var(--spacing-s)]">
            <p className="text-[13px] sm:text-[14px] leading-[1.5] text-[var(--color-text-secondary)]">
              Ready to pass the floor to the next speaker?
            </p>
            <button
              type="button"
              onClick={handleEndSlot}
              disabled={isEndingSlot}
              className="w-full h-11 px-[var(--spacing-m)] bg-[var(--color-brand)] text-[var(--color-surface)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
            >
              {isEndingSlot ? 'Ending...' : 'End My Slot'}
            </button>
          </div>
        )}

        {isHost && (
          <div className="flex flex-col gap-[var(--spacing-s)]">
            <button
              type="button"
              onClick={handleEndMeetingClick}
              disabled={isEndingMeeting}
              className="h-11 px-[var(--spacing-m)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-[12px] font-medium rounded-[0px] hover:bg-[var(--color-surface-subtle)] active:bg-[var(--color-surface-subtle)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] focus-visible:outline-offset-0"
            >
              {isEndingMeeting ? 'Ending...' : activeSpeakerId ? 'End Meeting (Speaker Active)' : 'End Meeting'}
            </button>

            {noActiveSpeaker && !hasEligibleCandidates && (
              <p className="text-[13px] sm:text-[14px] leading-[1.5] text-[var(--color-text-muted)]">
                Everyone has spoken this round. Waiting for the next round.
              </p>
            )}

            {meetingError && (
              <p className="text-[12px] leading-[1.4] text-[var(--color-error)]">
                {meetingError}
              </p>
            )}
          </div>
        )}

        {slotError && (
          <div className="border border-[var(--color-error)] bg-[var(--color-error)]/10 rounded-[4px] p-[var(--spacing-s)] text-[12px] sm:text-[14px] leading-[1.5] text-[var(--color-error)]">
            {slotError}
          </div>
        )}
      </div>

      <EndMeetingDialog
        isOpen={isDialogOpen}
        unspokenCount={unspokenCount}
        onCancel={() => setIsDialogOpen(false)}
        onConfirm={handleEndMeeting}
        isConfirming={isEndingMeeting}
      />
    </section>
  )
}
