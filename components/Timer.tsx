'use client'

import { useTimer } from '@/app/hooks/useTimer'

type TimerState = 'idle' | 'normal' | 'warning' | 'critical' | 'expired'

function getTimerState(remaining: number, isActive: boolean): TimerState {
  if (!isActive) return 'idle'
  if (remaining <= 0) return 'expired'
  if (remaining <= 5) return 'critical'
  if (remaining <= 15) return 'warning'
  return 'normal'
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const stateStyles: Record<TimerState, string> = {
  idle: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]',
  normal: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]',
  warning: 'bg-[var(--color-warning)] text-[var(--color-surface)]',
  critical: 'bg-[var(--color-error)] text-white',
  expired: 'bg-[var(--color-error)] text-white'
}

interface TimerProps {
  slotEndsAt: number | null
  slotDurationSeconds: number
}

export function Timer({ slotEndsAt, slotDurationSeconds }: TimerProps) {
  const { remaining } = useTimer(slotEndsAt)
  const isActive = slotEndsAt !== null
  const timerState = getTimerState(remaining, isActive)

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={isActive ? `${remaining} seconds remaining` : 'Timer inactive'}
      className={`
        rounded-xl p-8 text-center transition-colors duration-300
        ${stateStyles[timerState]}
      `}
    >
      {/* Timer Display */}
      <div className="text-[64px] font-medium leading-[1.2] tabular-nums">
        {isActive ? (isNaN(remaining) ? '...' : formatTime(remaining)) : '—:——'}
      </div>

      {/* Status Label */}
      {timerState === 'expired' && (
        <p className="mt-2 text-lg font-medium animate-pulse">
          ⏰ Time Expired
        </p>
      )}

      {timerState === 'warning' && (
        <p className="mt-2 text-sm font-medium opacity-80">
          Wrapping up...
        </p>
      )}

      {timerState === 'idle' && (
        <p className="mt-2 text-sm">
          {Math.floor(slotDurationSeconds / 60)} min per speaker
        </p>
      )}
    </div>
  )
}
