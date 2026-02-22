# REQ-0037: Percentage-Based Timer Warning/Critical Thresholds

**Status**: 🟨 Requirements created
**Priority**: Medium (Timer Logic)
**Dependencies**: REQ-0010, REQ-0009

---

## Overview

Update timer logic to compute warning and critical states based on percentage of remaining time instead of fixed seconds.

---

## Acceptance Criteria

- [ ] Warning threshold triggers at 25% time remaining.
- [ ] Critical threshold triggers at 12.5% time remaining, with a minimum of 5 seconds.
- [ ] Thresholds are computed from `slotDurationSeconds`.
- [ ] Timer UI reflects new states with existing color rules.
- [ ] Expired and over-time behavior remains unchanged.

---

## Implementation Details

### Timer State Calculation

**File**: `hooks/useTimer.ts`

**Changes**:
- Replace fixed values with computed thresholds:
  - `warningThreshold = Math.ceil(slotDuration * 0.25)`
  - `criticalThreshold = Math.max(Math.ceil(slotDuration * 0.125), 5)`
- Use computed values to determine `warning` and `critical` states.

### Timer UI

**File**: `components/Timer.tsx`

**Changes**:
- Ensure UI uses the updated state from `useTimer` without additional hard-coded thresholds.

---

## Testing Strategy

### Manual

1. Set a short duration (e.g., 60 seconds) and verify warning at 15s, critical at 8s (min 5s).
2. Set a longer duration (e.g., 180 seconds) and verify warning at 45s, critical at 23s.
3. Confirm expired and over-time visuals are unchanged.

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `hooks/useTimer.ts` | Modify | Compute thresholds by percentage |
| `components/Timer.tsx` | Modify | Consume updated state |

---

## Completion Checklist

- [ ] Percentage-based thresholds implemented.
- [ ] UI state transitions align with thresholds.
- [ ] No regressions in expired/over-time states.
- [ ] `tasks.md` updated to ✅ when implemented.
