interface ActiveSpeakerProps {
  activeSpeakerId: string | null
  activeSpeakerName: string | null
  currentUserId: string | null
}

export function ActiveSpeaker({
  activeSpeakerId,
  activeSpeakerName,
  currentUserId
}: ActiveSpeakerProps) {
  const isCurrentSpeaker = currentUserId === activeSpeakerId
  const hasSpeaker = activeSpeakerId !== null

  if (!hasSpeaker) {
    return (
      <section className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[8px] p-[var(--spacing-xl)] text-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5),_0_2px_4px_-1px_rgba(0,0,0,0.3)]">
        <p className="text-[18px] font-medium leading-[1.4] text-[var(--color-text-muted)] mb-[var(--spacing-s)]">
          No active speaker
        </p>
        <p className="text-[14px] leading-[1.5] text-[var(--color-text-secondary)]">
          {isCurrentSpeaker ? 'You are next to pick a speaker.' : 'Waiting for speaker selection...'}
        </p>
      </section>
    )
  }

  return (
    <section className="bg-[var(--color-surface-elevated)] border-2 border-[var(--color-brand)] rounded-[8px] p-[var(--spacing-xl)] text-center shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5),_0_2px_4px_-1px_rgba(0,0,0,0.3)]">
      <div className="text-[32px] mb-[var(--spacing-m)]">🎤</div>
      <h2 className="text-[24px] font-medium leading-[1.3] text-[var(--color-text-primary)] mb-[var(--spacing-s)]">
        {activeSpeakerName ?? 'Waiting for speaker'}
      </h2>
      <p className="text-[12px] font-medium text-[var(--color-brand)] mb-[var(--spacing-l)]">
        Currently Speaking
      </p>
    </section>
  )
}
