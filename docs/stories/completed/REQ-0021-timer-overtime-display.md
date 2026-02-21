# REQ-0021: Timer Over-Time Display Format

**Status**: ✅ Completed  
**Priority**: High (MVP UX Polish)  
**Dependencies**: REQ-0009, REQ-0010, REQ-0019

---

## Overview

Extend the timer component to display over-time in a `+M:SS` format (e.g., `+1:12`) when a speaker exceeds their allocated slot duration.

After the timer reaches zero and shows the "Time Expired" indicator, it must transition to tracking and displaying how much additional time the speaker has taken. This over-time display uses a distinct visual state (different from countdown and expired states) and provides clear feedback to all participants about how much extra time has been used.

This feature is critical for meeting transparency and helps hosts/participants understand actual speaking time vs allocated time.

---

## Acceptance Criteria

### Over-Time Display Format

- [ ] Timer switches to over-time mode when `slotEndsAt < Date.now()` and speaker hasn't ended slot
- [ ] Over-time format: `+M:SS` (e.g., `+0:15`, `+1:23`, `+10:45`)
- [ ] Minutes displayed without leading zero (e.g., `+1:30`, not `+01:30`)
- [ ] Seconds always displayed with two digits (e.g., `+0:05`, not `+0:5`)
- [ ] Over-time counter continues incrementing as long as speaker remains active
- [ ] Over-time display resets when speaker ends slot and new speaker begins

### Visual Distinction

- [ ] Over-time state has distinct background color (e.g., `bg-red-700` or darker red)
- [ ] Visual differentiation from expired state (e.g., solid vs pulsed, different shade)
- [ ] Text color provides high contrast (white on dark red)
- [ ] Font size appropriate for importance (large but readable)
- [ ] Label text: "Over Time" or "Time Over" (clear, concise)
- [ ] Timer remains prominent and immediately visible to all participants
- [ ] Mobile layout accommodates over-time display without text truncation

### Timer State Transitions

Three distinct visual states must exist:

1. **Countdown State** (remaining > 0):
   - Display: `M:SS`
   - Colors: Green → Yellow (≤15s) → Red (≤5s)
   - Label: "Time Remaining"

2. **Expired State** (remaining = 0, momentary):
   - Display: "Time Expired" message
   - Color: Bright red with pulse animation
   - Duration: Shown for ~1 second at exactly 0

3. **Over-Time State** (remaining < 0):
   - Display: `+M:SS`
   - Color: Dark red, solid (no pulse)
   - Label: "Over Time"

- [ ] Smooth transition between countdown → expired → over-time
- [ ] No flickering or visual glitches during transitions
- [ ] State transitions occur at precise time boundaries

### `useTimer` Hook Updates

- [ ] Hook computes both countdown and over-time values
- [ ] Returns `isOverTime` boolean flag
- [ ] Returns `overTimeSeconds` (absolute value of negative remaining time)
- [ ] Hook triggers re-render every second when in over-time state
- [ ] Efficient rendering (no unnecessary re-renders)
- [ ] Hook handles edge case: `slotEndsAt` is null (no timer active)

### Timer Component Integration

- [ ] `Timer.tsx` receives over-time props from `useTimer`
- [ ] Component conditionally renders countdown vs over-time display
- [ ] Correct format function applied based on state
- [ ] Design system colors used (no hardcoded color values)
- [ ] Component adapts to mobile and desktop layouts
- [ ] Accessible: screen readers announce over-time state

---

## Implementation Details

### Updated `useTimer` Hook

Extend `app/hooks/useTimer.ts` to compute over-time:

```ts
import { useEffect, useState } from 'react'

interface TimerState {
  remaining: number        // Seconds remaining (can be negative)
  isActive: boolean        // Is timer running
  isExpired: boolean       // Has timer reached 0
  isOverTime: boolean      // Is speaker over their allocated time
  overTimeSeconds: number  // Absolute seconds over time
}

export function useTimer(
  slotEndsAt: number | null,
  activeSpeakerId: string | null
): TimerState {
  const [now, setNow] = useState(Date.now())
  
  useEffect(() => {
    if (!slotEndsAt || !activeSpeakerId) {
      return
    }
    
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 100) // Update 10x per second for smooth countdown
    
    return () => clearInterval(interval)
  }, [slotEndsAt, activeSpeakerId])
  
  if (!slotEndsAt || !activeSpeakerId) {
    return {
      remaining: 0,
      isActive: false,
      isExpired: false,
      isOverTime: false,
      overTimeSeconds: 0
    }
  }
  
  const remainingMs = slotEndsAt - now
  const remainingSeconds = Math.ceil(remainingMs / 1000)
  
  const isExpired = remainingSeconds <= 0
  const isOverTime = remainingSeconds < 0
  const overTimeSeconds = isOverTime ? Math.abs(remainingSeconds) : 0
  
  return {
    remaining: remainingSeconds,
    isActive: true,
    isExpired: isExpired,
    isOverTime: isOverTime,
    overTimeSeconds: overTimeSeconds
  }
}
```

---

### Updated Timer Component

Extend `components/Timer.tsx` to handle over-time display:

```tsx
interface TimerProps {
  remaining: number
  duration: number
  isActive: boolean
  isExpired: boolean
  isOverTime: boolean
  overTimeSeconds: number
}

export function Timer({
  remaining,
  duration,
  isActive,
  isExpired,
  isOverTime,
  overTimeSeconds
}: TimerProps) {
  // Determine visual state
  const state = getTimerState(remaining, isExpired, isOverTime)
  
  return (
    <div
      className={`
        relative flex flex-col items-center justify-center rounded-lg p-6
        text-center transition-all duration-300
        ${state.backgroundColor} ${state.textColor}
        ${state.animate ? 'animate-pulse' : ''}
      `}
    >
      <div className="text-xs uppercase tracking-widest opacity-75">
        {state.label}
      </div>
      <div className="mt-2 text-5xl font-bold tabular-nums">
        {state.displayValue}
      </div>
      {state.hint && (
        <div className="mt-2 text-xs opacity-90">
          {state.hint}
        </div>
      )}
    </div>
  )
}

function getTimerState(
  remaining: number,
  isExpired: boolean,
  isOverTime: boolean
) {
  // Over-time state (speaker exceeded allocated time)
  if (isOverTime) {
    return {
      label: 'Over Time',
      displayValue: formatOverTime(Math.abs(remaining)),
      backgroundColor: 'bg-red-700',
      textColor: 'text-white',
      animate: false,
      hint: null
    }
  }
  
  // Expired state (exactly at zero)
  if (isExpired && remaining === 0) {
    return {
      label: 'Time Expired',
      displayValue: '⏰',
      backgroundColor: 'bg-red-600',
      textColor: 'text-white',
      animate: true,
      hint: 'Please end your slot to continue'
    }
  }
  
  // Countdown states
  const isWarningRed = remaining > 0 && remaining <= 5
  const isWarningYellow = remaining > 0 && remaining <= 15
  
  if (isWarningRed) {
    return {
      label: 'Time Remaining',
      displayValue: formatCountdown(remaining),
      backgroundColor: 'bg-red-500',
      textColor: 'text-white',
      animate: false,
      hint: null
    }
  }
  
  if (isWarningYellow) {
    return {
      label: 'Time Remaining',
      displayValue: formatCountdown(remaining),
      backgroundColor: 'bg-yellow-400',
      textColor: 'text-gray-900',
      animate: false,
      hint: null
    }
  }
  
  // Default countdown state
  return {
    label: 'Time Remaining',
    displayValue: formatCountdown(remaining),
    backgroundColor: 'bg-blue-500',
    textColor: 'text-white',
    animate: false,
    hint: null
  }
}

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

function formatOverTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `+${mins}:${secs < 10 ? '0' : ''}${secs}`
}
```

---

### Integration in Meeting Page

Update `app/meeting/[sessionId]/page.tsx` to pass new timer props:

```tsx
function ActiveMeetingView({ session, currentUserId }: Props) {
  const timerState = useTimer(session.slotEndsAt, session.activeSpeakerId)
  
  return (
    <div className="space-y-6">
      {/* Active Speaker Display */}
      <ActiveSpeaker
        speakerName={session.participants[session.activeSpeakerId]?.name}
      />
      
      {/* Timer with Over-Time Support */}
      <Timer
        remaining={timerState.remaining}
        duration={session.slotDurationSeconds}
        isActive={timerState.isActive}
        isExpired={timerState.isExpired}
        isOverTime={timerState.isOverTime}
        overTimeSeconds={timerState.overTimeSeconds}
      />
      
      {/* Rest of meeting UI */}
    </div>
  )
}
```

---

## User Flow

```
Speaker's slot begins
        ↓
Timer shows countdown: 2:00, 1:59, 1:58...
  (Green background)
        ↓
Timer reaches 15 seconds
  → Background changes to yellow
        ↓
Timer reaches 5 seconds
  → Background changes to red
        ↓
Timer reaches 0:00
  → Shows "Time Expired" with pulse animation
  → Sound notification plays (from REQ-0019)
        ↓
1 second passes
        ↓
Timer switches to over-time mode: +0:01, +0:02...
  → Background: dark red (solid, no pulse)
  → Label: "Over Time"
  → Format: +M:SS
        ↓
Speaker continues talking (over-time increments)
        ↓
Speaker eventually clicks "End My Slot"
        ↓
Timer resets for next speaker
```

---

## Visual Design Specifications

### Color Progression

| State | Background | Text | Border | Animation |
|-------|-----------|------|--------|-----------|
| Countdown (>15s) | `bg-blue-500` | `text-white` | None | None |
| Warning Yellow (≤15s) | `bg-yellow-400` | `text-gray-900` | None | None |
| Warning Red (≤5s) | `bg-red-500` | `text-white` | None | None |
| Expired (=0) | `bg-red-600` | `text-white` | None | Pulse |
| Over-Time (<0) | `bg-red-700` | `text-white` | None | None |

### Typography

- Label: `text-xs uppercase tracking-widest opacity-75`
- Time Display: `text-5xl font-bold tabular-nums`
- Hint Text: `text-xs opacity-90`

### Spacing

- Container: `p-6`
- Label-to-Time: `mt-2`
- Time-to-Hint: `mt-2`

---

## Edge Cases

- **Speaker ends slot at exactly 0 seconds**: Should show expired state briefly before clearing
- **Slow network delays state update**: Over-time continues until Firebase confirms slot end
- **Browser tab inactive**: Timer re-syncs when tab becomes active (already handled by realtime subscription)
- **Very long over-time (>10 minutes)**: Format still works (`+10:23`, `+15:07`, etc.)
- **Multiple participants view same over-time**: All see same over-time value (computed from same `slotEndsAt`)
- **Speaker ends slot during over-time**: Timer immediately clears, no flicker

---

## Error Handling

- **Missing `slotEndsAt`**: Timer shows inactive state (no countdown or over-time)
- **Invalid timestamp**: Treat as inactive timer, log warning
- **Negative `slotDurationSeconds`**: Clamp to 0, show as expired immediately
- **Clock skew between client/server**: Over-time based on client time (acceptable for MVP)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/hooks/useTimer.ts` | Modify | Add over-time computation logic |
| `components/Timer.tsx` | Modify | Add over-time display rendering |
| `app/meeting/[sessionId]/page.tsx` | Modify | Pass new timer props to Timer component |

---

## Testing Notes

- Verify timer switches to over-time at exactly 0 seconds
- Verify over-time format displays correctly (`+M:SS`)
- Verify over-time increments smoothly (no jumps or skips)
- Test with short slot duration (30 seconds) to quickly reach over-time
- Verify visual distinction between expired and over-time states
- Test long over-time (simulate 10+ minutes)
- Verify all participants see synchronized over-time value
- Test rapid speaker changes (ensure no lingering over-time display)
- Verify mobile layout accommodates over-time format
- Test with accessibility tools (screen reader announces over-time state)

---

## Accessibility Considerations

- [ ] Over-time state announced by screen readers
- [ ] Color is not the only indicator (label text provides context)
- [ ] High contrast ratios maintained (white on dark red = WCAG AA compliant)
- [ ] Font size large enough for low-vision users
- [ ] Timer updates smoothly without causing motion sickness

---

## Success Criteria

At completion:

- Timer seamlessly transitions from countdown → expired → over-time
- Over-time format (`+M:SS`) is clear and consistent
- Visual distinction between all timer states is obvious
- All participants see accurate, synchronized over-time values
- Timer supports very long over-time durations without breaking
- Mobile and desktop layouts both work correctly
- No performance issues from frequent timer updates
- Implementation aligns with design system and existing Timer component architecture
