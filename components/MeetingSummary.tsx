import type { Session } from '@/lib/session'
import { formatDuration } from '@/app/utils'

interface MeetingSummaryRow {
  userId: string
  name: string
  totalSpokeDurationSeconds: number
  turnCount: number
  hasOvertime: boolean
}

interface MeetingSummaryProps {
  session: Session
}

function buildRows(session: Session): MeetingSummaryRow[] {
  return Object.entries(session.participants)
    .map(([userId, participant]) => {
      const speakingHistory = participant.speakingHistory ?? []
      const totalFromHistory = speakingHistory.reduce(
        (total, entry) => total + entry.durationSeconds,
        0
      )
      const totalSpokeDurationSeconds =
        participant.totalSpokeDurationSeconds ?? totalFromHistory
      const turnCount = speakingHistory.length
      const hasOvertime = speakingHistory.some(
        entry => entry.durationSeconds > session.slotDurationSeconds
      )

      return {
        userId,
        name: participant.name,
        totalSpokeDurationSeconds,
        turnCount,
        hasOvertime
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function MeetingSummary({ session }: MeetingSummaryProps) {
  const rows = buildRows(session)

  return (
    <section className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-[8px] p-[var(--spacing-l)]">
      <div className="flex flex-col gap-[var(--spacing-xs)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[24px] font-medium leading-[1.3] text-[var(--color-text-primary)]">
            Meeting Summary
          </h2>
          <p className="text-[14px] leading-[1.5] text-[var(--color-text-secondary)]">
            Speaking totals and turn counts for this session.
          </p>
        </div>
        <div className="text-[12px] font-medium text-[var(--color-text-muted)]">
          {rows.length} participant{rows.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="mt-[var(--spacing-l)]">
        <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] sm:gap-[var(--spacing-s)] text-[12px] font-medium text-[var(--color-text-muted)] mb-[var(--spacing-s)]">
          <span>Name</span>
          <span>Total Time</span>
          <span>Turns</span>
          <span>Overtime</span>
        </div>

        <ul className="space-y-[var(--spacing-s)]">
          {rows.map(row => {
            return (
              <li
                key={row.userId}
                className="min-h-[56px] rounded-[8px] p-[var(--spacing-m)] border border-[var(--color-border)] bg-[var(--color-surface)]"
              >
                <div className="grid gap-[var(--spacing-s)] sm:grid-cols-[2fr_1fr_1fr_1fr] sm:items-center">
                  <div>
                    <p className="text-[14px] leading-[1.5] text-[var(--color-text-primary)]">
                      {row.name}
                    </p>
                    <p className="text-[11px] leading-[1.4] text-[var(--color-text-muted)] sm:hidden">
                      Total {formatDuration(row.totalSpokeDurationSeconds)} · {row.turnCount} turn{row.turnCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="hidden sm:block text-[14px] leading-[1.5] text-[var(--color-text-primary)]">
                    {formatDuration(row.totalSpokeDurationSeconds)}
                  </div>
                  <div className="hidden sm:block text-[14px] leading-[1.5] text-[var(--color-text-primary)]">
                    {row.turnCount}
                  </div>
                  <div className="hidden sm:block">
                    {row.hasOvertime ? (
                      <span className="text-[12px] text-[var(--color-text-muted)]">
                        Yes
                      </span>
                    ) : (
                      <span className="text-[12px] text-[var(--color-text-muted)]">—</span>
                    )}
                  </div>

                  <div className="sm:hidden">
                    {row.hasOvertime && (
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        Overtime
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
