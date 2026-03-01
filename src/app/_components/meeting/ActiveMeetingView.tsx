'use client'

import { useState, useEffect, useRef } from 'react'
import { Timer } from '@/components/Timer'
import { MeetingControls } from '@/components/MeetingControls'
import { ParticipantList } from '@/components/ParticipantList'
import { SpeakerSelector } from '@/components/SpeakerSelector'
import { HandRaiseButton } from '@/components/HandRaiseButton'
import type { Session } from '@/lib/session'

export function ActiveMeetingView({
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
  const numberOfParticipants = Object.keys(session.participants || {}).length
  const isLastSpeaker = numberOfParticipants === session.spokenUserIds?.length
  const isActiveLastSpeaker = userId === session.activeSpeakerId && isLastSpeaker
  const showMeetingControls = isHost || isActiveLastSpeaker

  // Monitor for host changes
  useEffect(() => {
    const prevHostId = prevHostIdRef.current
    if (prevHostId !== session.hostId) {
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
            isActiveSpeaker={isActiveLastSpeaker}
            isLastSpeaker={isLastSpeaker}
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
            isActiveSpeaker={isActiveLastSpeaker}
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
