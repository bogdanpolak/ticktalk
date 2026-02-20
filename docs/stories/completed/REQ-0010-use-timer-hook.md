# REQ-0010: `useTimer` Hook (Local Countdown)

**Status**: ✅ Completed  
**Priority**: High (Foundation)  
**Dependencies**: REQ-0004

---

## Overview

Implement the `useTimer` hook that provides local countdown logic for the Timer component (REQ-0009). The hook takes a server-authoritative `slotEndsAt` timestamp and computes the remaining seconds locally, ticking every second via `setInterval`.

This is a pure client-side computation hook — it does not interact with Firebase directly. The authoritative time source is `slotEndsAt` (Unix timestamp in milliseconds) provided by the session data via `useSession`.

---

## Acceptance Criteria

- [ ] Hook: `app/hooks/useTimer.ts` created
- [ ] Accepts `slotEndsAt: number | null` as the input parameter
- [ ] Returns `{ remaining: number, isExpired: boolean, isActive: boolean }`
- [ ] `remaining` is the number of whole seconds left (ceiled), minimum 0
- [ ] `isExpired` is `true` when remaining reaches 0 and `slotEndsAt` is not null
- [ ] `isActive` is `true` when `slotEndsAt` is not null (timer is running)
- [ ] Ticks every 1000ms via `setInterval`
- [ ] Immediately recomputes `remaining` when `slotEndsAt` changes (new speaker starts)
- [ ] Cleans up interval on unmount (no memory leaks)
- [ ] Cleans up interval when `slotEndsAt` becomes null (speaker ends slot)
- [ ] Stops ticking when remaining reaches 0 (no unnecessary re-renders)
- [ ] Hook is exported from `app/hooks/index.ts`
- [ ] No negative values ever returned for `remaining`

---

## Implementation Details

### Hook: `app/hooks/useTimer.ts`

**Signature**:

```ts
interface TimerState {
  remaining: number    // seconds remaining, >= 0
  isExpired: boolean   // true when timer hit 0
  isActive: boolean    // true when slotEndsAt is not null
}

function useTimer(slotEndsAt: number | null): TimerState
```

**Implementation**:

```ts
'use client'

import { useEffect, useState, useCallback } from 'react'

interface TimerState {
  remaining: number
  isExpired: boolean
  isActive: boolean
}

function computeRemaining(slotEndsAt: number | null): number {
  if (slotEndsAt === null) return 0
  return Math.max(0, Math.ceil((slotEndsAt - Date.now()) / 1000))
}

export function useTimer(slotEndsAt: number | null): TimerState {
  const [remaining, setRemaining] = useState<number>(() =>
    computeRemaining(slotEndsAt)
  )

  useEffect(() => {
    // If no active timer, reset and bail
    if (slotEndsAt === null) {
      setRemaining(0)
      return
    }

    // Immediately compute on slotEndsAt change
    const initial = computeRemaining(slotEndsAt)
    setRemaining(initial)

    // If already expired, no need to tick
    if (initial <= 0) return

    const intervalId = setInterval(() => {
      const newRemaining = computeRemaining(slotEndsAt)
      setRemaining(newRemaining)

      // Stop ticking once expired
      if (newRemaining <= 0) {
        clearInterval(intervalId)
      }
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [slotEndsAt])

  const isActive = slotEndsAt !== null
  const isExpired = isActive && remaining <= 0

  return { remaining, isExpired, isActive }
}
```

**Behavior**:

1. **Initialization**: When `slotEndsAt` is provided, immediately compute initial remaining time using `Math.ceil((slotEndsAt - Date.now()) / 1000)`.

2. **Tick**: Every 1000ms, recalculate remaining time from `slotEndsAt`. This avoids drift — instead of decrementing a counter, we always recompute from the authoritative timestamp.

3. **Expiry**: When `remaining` reaches 0, the interval is cleared. No further re-renders.

4. **Reset**: When `slotEndsAt` changes to a new value (new speaker), the effect reruns — clearing the old interval and starting a new countdown.

5. **Deactivation**: When `slotEndsAt` becomes null (slot ended), remaining resets to 0 and no interval runs.

6. **Cleanup**: Interval is always cleared on unmount or when `slotEndsAt` changes.

---

### Update: `app/hooks/index.ts`

Add export for the new hook:

```ts
export { useAuth } from './useAuth'
export { useSession } from './useSession'
export { useTimer } from './useTimer'
```

---

## Timer Drift Handling

Per the plan (Section 4.6), timer drift across clients is handled by using the server-authoritative `slotEndsAt` timestamp:

```
Server:  slotEndsAt = 1708012800000 (Unix ms)
Client:  remaining  = ceil((slotEndsAt - Date.now()) / 1000)
```

This means:
- All clients compute the same remaining time (within ~1s of each other)
- No accumulated drift from `setInterval` inaccuracies
- If a client's clock is off, the timer will be off by the same amount — acceptable for MVP

---

## Usage Example

```tsx
import { useTimer } from '@/app/hooks/useTimer'

function TimerDisplay({ slotEndsAt }: { slotEndsAt: number | null }) {
  const { remaining, isExpired, isActive } = useTimer(slotEndsAt)

  if (!isActive) return <div>No active speaker</div>
  if (isExpired) return <div>Time Expired!</div>

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  return <div>{mins}:{secs.toString().padStart(2, '0')}</div>
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/hooks/useTimer.ts` | Create | Timer countdown hook |
| `app/hooks/index.ts` | Modify | Add `useTimer` export |

---

## Dependencies on Existing Code

| Module | Usage |
|--------|-------|
| `Session.slotEndsAt` | Unix timestamp (ms) from session data |
| React `useState`, `useEffect` | Core React hooks |

---

## Edge Cases

| Case | Handling |
|------|----------|
| `slotEndsAt` is in the past | `remaining` immediately computes to 0, `isExpired` is true |
| `slotEndsAt` changes mid-countdown | Effect reruns, old interval cleared, new countdown starts |
| `slotEndsAt` becomes null | `remaining` resets to 0, `isActive` is false, no interval |
| Component unmounts while ticking | Cleanup function clears interval |
| `slotEndsAt` is null on mount | `remaining` is 0, `isActive` is false, no interval created |
| Multiple rapid `slotEndsAt` changes | Each change triggers cleanup → reinit (React effect behavior) |

---

## Testing Notes

- Verify countdown decrements by 1 each second
- Verify remaining never goes below 0
- Verify `isExpired` flips to true at exactly 0
- Verify cleanup: no intervals running after unmount
- Verify immediate recompute when `slotEndsAt` changes
- Verify idle state when `slotEndsAt` is null
- Verify no state updates after unmount (no React warnings)
- Consider using `jest.useFakeTimers()` for deterministic testing
