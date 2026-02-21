'use client'

import { useTimer } from '@/app/hooks/useTimer'

type TimerState = 'idle' | 'normal' | 'warning' | 'critical' | 'expired' | 'overtime'

function getTimerState(
  remaining: number,
  isActive: boolean,
  isExpired: boolean,
  isOverTime: boolean
): TimerState {
  if (!isActive) return 'idle'
  if (isOverTime) return 'overtime'
  if (isExpired || remaining === 0) return 'expired'
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

function formatOverTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `+${mins}:${secs.toString().padStart(2, '0')}`
}

const stateStyles: Record<TimerState, string> = {
  idle: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]',
  normal: 'bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]',
  warning: 'bg-[var(--color-warning)] text-[var(--color-surface)]',
  critical: 'bg-[var(--color-error)] text-white',
  expired: 'bg-[var(--color-error)] text-white',
  overtime: 'bg-[var(--color-surface-elevated)] border-2 border-[var(--color-error)] text-[var(--color-error)]'
}

interface TimerProps {
  slotEndsAt: number | null
  slotDurationSeconds: number
}

export function Timer({ slotEndsAt, slotDurationSeconds }: TimerProps) {
  const { remaining, isExpired, isOverTime, overTimeSeconds } = useTimer(slotEndsAt)
  const isActive = slotEndsAt !== null
  const timerState = getTimerState(remaining, isActive, isExpired, isOverTime)

  const ariaLabel = isActive
    ? timerState === 'overtime'
      ? `${overTimeSeconds} seconds over time`
      : `${Math.max(remaining, 0)} seconds remaining`
    : 'Timer inactive'

  return (
    <div
      role="timer"
      aria-live="polite"
      aria-label={ariaLabel}
      className={`
        rounded-xl p-4 sm:p-8 text-center transition-colors duration-300
        ${stateStyles[timerState]}
        ${timerState === 'expired' ? 'animate-pulse' : ''}
      `}
      style={timerState === 'expired' ? { animationIterationCount: 'infinite' } : undefined}
    >
      {/* Expired State */}
      {timerState === 'expired' ? (
        <div>
          <div className="text-[16px] sm:text-[18px] font-medium leading-[1.4] uppercase tracking-wide">
            ⏰ Time Expired
          </div>
          <div className="mt-[var(--spacing-s)] text-[11px] sm:text-[12px] leading-[1.4] opacity-90">
            Please end your slot to continue
          </div>
        </div>
      ) : timerState === 'overtime' ? (
        <div>
          <div className="text-[11px] sm:text-[12px] font-medium leading-[1.4] uppercase tracking-wide">
            Over Time
          </div>
          <div className="mt-[var(--spacing-s)] text-[48px] sm:text-[64px] font-medium leading-[1.2] tabular-nums">
            {formatOverTime(overTimeSeconds)}
          </div>
        </div>
      ) : (
        <>
          {/* Timer Display */}
          <div className="text-[48px] sm:text-[64px] font-medium leading-[1.2] tabular-nums">
            {isActive ? (isNaN(remaining) ? '...' : formatTime(remaining)) : '—:——'}
          </div>

          {/* Status Label */}
          {timerState === 'warning' && (
            <p className="mt-2 text-[12px] sm:text-sm font-medium opacity-80">
              Wrapping up...
            </p>
          )}

          {timerState === 'idle' && (
            <p className="mt-2 text-sm">
              {Math.floor(slotDurationSeconds / 60)} min per speaker
            </p>
          )}
        </>
      )}
    </div>
  )
}
