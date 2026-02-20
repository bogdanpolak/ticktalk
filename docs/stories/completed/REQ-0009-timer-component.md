# REQ-0009: Timer Component with Color States

**Status**: ✅ Completed  
**Priority**: High (MVP Feature)  
**Dependencies**: REQ-0007, REQ-0008, REQ-0010

---

## Overview

Implement the `Timer` component — the **dominant visual element** of the meeting page (per design system axiom #1). This is a large, central countdown display that shows the remaining time for the current speaker's slot.

The timer computes remaining time locally from the server-authoritative `slotEndsAt` timestamp, changing color as time runs low:
- **Normal** (> 15s) — default brand styling
- **Warning** (≤ 15s) — yellow/amber background
- **Critical** (≤ 5s) — red background
- **Expired** (0s) — red with "Time Expired" indicator

The timer does **NOT** auto-advance the speaker. It serves as a visual indicator only — the speaker manually ends their slot.

---

## Acceptance Criteria

- [ ] Component: `components/Timer.tsx` created
- [ ] Displays countdown in `MM:SS` format (e.g., `2:00`, `0:15`)
- [ ] Timer number uses Display typography (64px, weight 500 — per design system)
- [ ] Computes remaining time from `slotEndsAt` (Unix timestamp in ms)
- [ ] Updates every second via local `setInterval`
- [ ] Color states transition smoothly:
  - [ ] Default: normal text on elevated surface
  - [ ] Warning (≤ 15s): `--color-warning` (#F59E0B) background
  - [ ] Critical (≤ 5s): `--color-error` (#EF4444) background
  - [ ] Expired (0s): `--color-error` background + "Time Expired" text pulsing
- [ ] Timer stops at 0 (never goes negative)
- [ ] Shows "—:——" or idle state when no `slotEndsAt` is set (no active speaker)
- [ ] Integrates with `useTimer` hook (REQ-0010) for countdown logic
- [ ] Responsive sizing on mobile (timer number scales down)
- [ ] Accessible: timer has `role="timer"` and `aria-live="polite"` attributes

---

## Implementation Details

### Component: `components/Timer.tsx`

**Props**:

```tsx
interface TimerProps {
  slotEndsAt: number | null
  slotDurationSeconds: number
}
```

**Implementation**:

```tsx
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
  if (seconds < 0) seconds = 0
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
        {isActive ? formatTime(remaining) : '—:——'}
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
```

---

### Integration: Wire into `ActiveMeetingView`

Update the `ActiveMeetingView` in `app/meeting/[sessionId]/page.tsx` to include the Timer:

```tsx
import { Timer } from '@/components/Timer'

// Inside ActiveMeetingView, after ActiveSpeaker:
<div className="mt-6">
  <Timer
    slotEndsAt={session.slotEndsAt}
    slotDurationSeconds={session.slotDurationSeconds}
  />
</div>
```

---

## Color State Transitions

```
┌─────────────────────────────────────────────────────────┐
│  Timer starts (slotEndsAt set)                          │
│                                                         │
│  [2:00] ──── Normal (elevated bg) ─────── [0:16]       │
│  [0:15] ──── Warning (yellow bg)  ─────── [0:06]       │
│  [0:05] ──── Critical (red bg)    ─────── [0:01]       │
│  [0:00] ──── Expired (red bg + pulse) ────              │
│                                                         │
│  Speaker clicks "End My Slot" → Timer returns to idle   │
└─────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `components/Timer.tsx` | Create | Countdown timer with color states |
| `app/meeting/[sessionId]/page.tsx` | Modify | Wire Timer into ActiveMeetingView |

---

## Dependencies on Existing Code

| Module | Usage |
|--------|-------|
| `useTimer(slotEndsAt)` | Hook for countdown logic (REQ-0010) |
| `Session` type | `slotEndsAt` and `slotDurationSeconds` fields |

---

## Design Specifications

| Element | Design Token | Value |
|---------|-------------|-------|
| Timer number | Display typography | 64px, weight 500, line-height 1.2 |
| Timer container | `--color-surface-elevated` | `#1E293B` (idle/normal) |
| Warning background | `--color-warning` | `#F59E0B` |
| Critical/Expired background | `--color-error` | `#EF4444` |
| Container padding | xxl | 48px top/bottom, contextual |
| Container border-radius | lg | Rounded corners |
| Transition | `transition-colors` | 300ms ease for state changes |
| Tabular nums | `tabular-nums` | Prevents layout shift during countdown |

---

## Testing Notes

- Verify countdown matches server `slotEndsAt` timestamp accurately
- Verify color transitions at 15s and 5s boundaries
- Verify "Time Expired" indicator appears at 0 and pulses
- Verify timer never shows negative values
- Verify idle state when no speaker is active (`slotEndsAt === null`)
- Verify timer resets correctly when a new speaker starts
- Verify accessibility attributes (`role="timer"`, `aria-live`)
- Verify mobile responsive sizing
- Verify no memory leaks from `setInterval` cleanup
