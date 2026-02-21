import type { Participant } from '@/lib/session'

interface ParticipantRow {
  userId: string
  name: string
  role: 'host' | 'participant'
  isHandRaised: boolean
  isActiveSpeaker: boolean
  hasSpoken: boolean
}

interface ParticipantListProps {
  participants: Record<string, Participant>
  activeSpeakerId: string | null
  spokenUserIds: string[]
  hostId: string
}

export function ParticipantList({
  participants,
  activeSpeakerId,
  spokenUserIds,
  hostId
}: ParticipantListProps) {
  const rows: ParticipantRow[] = Object.entries(participants).map(([userId, participant]) => ({
    userId,
    name: participant.name,
    role: userId === hostId ? 'host' : 'participant',
    isHandRaised: participant.isHandRaised,
    isActiveSpeaker: activeSpeakerId === userId,
    hasSpoken: spokenUserIds.includes(userId)
  }))

  const sortedRows = rows.sort((a, b) => {
    if (a.isActiveSpeaker !== b.isActiveSpeaker) {
      return a.isActiveSpeaker ? -1 : 1
    }
    if (a.isHandRaised !== b.isHandRaised) {
      return a.isHandRaised ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })

  return (
    <section className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[8px] p-[var(--spacing-m)] sm:p-[var(--spacing-l)]">
      <div className="flex items-center justify-between mb-[var(--spacing-m)]">
        <h2 className="text-[16px] sm:text-[18px] leading-[1.4] font-medium text-[var(--color-text-primary)]">
          Participants ({rows.length})
        </h2>
      </div>

      {rows.length === 0 ? (
        <p className="text-[13px] sm:text-[14px] leading-[1.5] text-[var(--color-text-muted)]">
          No participants yet.
        </p>
      ) : (
        <ul className="space-y-[var(--spacing-m)]">
          {sortedRows.map(row => {
            const rowStyles = row.isActiveSpeaker
              ? 'border-2 border-[var(--color-brand)] shadow-[0_1px_2px_0_rgba(0,0,0,0.5)]'
              : row.isHandRaised
                ? 'border-2 border-[var(--color-warning)]'
                : row.hasSpoken
                  ? 'border border-[var(--color-success)]'
                  : 'border border-[var(--color-border)]'

            return (
              <li
                key={row.userId}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[var(--spacing-s)] p-[var(--spacing-s)] sm:p-[var(--spacing-m)] min-h-[auto] sm:min-h-[56px] bg-[var(--color-surface-elevated)] rounded-[8px] ${rowStyles}`}
              >
                <div className="flex items-center gap-[var(--spacing-s)] min-w-0">
                  <span className="text-[13px] sm:text-[14px] leading-[1.5] text-[var(--color-text-primary)] truncate">
                    {row.name}
                  </span>
                  {row.role === 'host' && (
                    <span className="text-[10px] sm:text-[11px] font-medium leading-[1.4] px-[var(--spacing-s)] py-[var(--spacing-xs)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand)] rounded-[4px] whitespace-nowrap">
                      Host
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-[var(--spacing-xs)] sm:gap-[var(--spacing-s)] justify-start sm:justify-end">
                  {row.isActiveSpeaker && (
                    <span className="inline-flex items-center gap-[var(--spacing-xs)] px-[var(--spacing-s)] py-[var(--spacing-xs)] bg-[var(--color-brand-subtle)] text-[var(--color-brand)] border border-[var(--color-brand)] rounded-[4px] text-[11px] sm:text-[12px] font-medium whitespace-nowrap">
                      🎤 Speaking
                    </span>
                  )}
                  {row.isHandRaised && (
                    <span className="inline-flex items-center gap-[var(--spacing-xs)] px-[var(--spacing-s)] py-[var(--spacing-xs)] bg-[var(--color-warning)] text-[#000000] rounded-[4px] text-[11px] sm:text-[12px] font-medium whitespace-nowrap">
                      ✋ Hand raised
                    </span>
                  )}
                  {row.hasSpoken && (
                    <span className="inline-flex items-center gap-[var(--spacing-xs)] px-[var(--spacing-s)] py-[var(--spacing-xs)] border border-[var(--color-success)] text-[var(--color-success)] rounded-[4px] text-[11px] sm:text-[12px] font-medium whitespace-nowrap">
                      ✅ Spoke
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
