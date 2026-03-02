# REQ-0042: Unit Tests — Presentation Components

**Status**: ✅ Completed
**Priority**: Medium (Test Coverage)
**Dependencies**: None

---

## Overview

Create test files for 5 presentation components: ActiveSpeaker, ParticipantList, Timer, MeetingSummary, EndMeetingDialog. These are pure or near-pure components with minimal/no side effects. ~18 tests total.

---

## Acceptance Criteria

### ActiveSpeaker (~3 tests)
- [ ] Renders "No active speaker" when no activeSpeakerId
- [ ] Renders speaker name and "Currently Speaking" when active speaker present
- [ ] Renders "Waiting for speaker" when activeSpeakerName is null

### ParticipantList (~5 tests)
- [ ] Renders all participants with count header
- [ ] Shows "🎤 Speaking" badge for active speaker
- [ ] Shows "✋ Hand raised" badge for hand-raised participants
- [ ] Shows "✅ Spoke" badge for spoken participants
- [ ] Shows "No participants yet." for empty list

### Timer (~4 tests)
- [ ] Shows "—:——" in idle state (slotEndsAt=null)
- [ ] Shows countdown in normal state
- [ ] Shows "⏰ Time Expired" in expired state
- [ ] Shows "+M:SS" in overtime state

### MeetingSummary (~3 tests)
- [ ] Renders heading and participant count
- [ ] Shows participant name and total time
- [ ] Shows overtime indicator for entries exceeding slot duration

### EndMeetingDialog (~3 tests)
- [ ] Returns null when isOpen is false
- [ ] Shows dialog content when isOpen is true
- [ ] Calls onCancel and onConfirm when buttons clicked

---

## Implementation Details

### New Files

| File | Notes |
|------|-------|
| `tests/components/ActiveSpeaker.test.tsx` | Pure render tests |
| `tests/components/ParticipantList.test.tsx` | Pure render + sort verification |
| `tests/components/Timer.test.tsx` | Mock `useTimer` hook |
| `tests/components/MeetingSummary.test.tsx` | Uses `createMockSession()` |
| `tests/components/EndMeetingDialog.test.tsx` | Interaction tests with `userEvent` |

### Timer Hook Mocking Pattern

Timer.tsx internally uses `useTimer`. Mock it entirely:

```typescript
import { vi } from 'vitest'

const mockUseTimer = vi.fn()
vi.mock('@/hooks/useTimer', () => ({
  useTimer: (...args: unknown[]) => mockUseTimer(...args)
}))

// Then in each test:
mockUseTimer.mockReturnValue({
  remaining: 30,
  isExpired: false,
  isOverTime: false,
  overTimeSeconds: 0,
  isWarning: false,
  isCritical: false
})
```

### ParticipantList Testing

Use `createMockParticipant()` to build test data:
```typescript
const participants = {
  'user-1': createMockParticipant({ name: 'Alice', isHandRaised: true }),
  'user-2': createMockParticipant({ name: 'Bob' })
}
```

### MeetingSummary Testing

Use `createMockSession()` with customized participants and speakingHistory:
```typescript
const session = createMockSession({
  slotDurationSeconds: 60,
  participants: {
    'user-1': createMockParticipant({
      name: 'Alice',
      totalSpokeDurationSeconds: 45,
      speakingHistory: [{ startTime: 0, endTime: 45000, durationSeconds: 45 }]
    })
  }
})
```

### EndMeetingDialog Interaction Testing

Use `@testing-library/user-event`:
```typescript
import userEvent from '@testing-library/user-event'

const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
await user.click(screen.getByRole('button', { name: /cancel/i }))
expect(onCancel).toHaveBeenCalled()
```

---

## Testing Strategy

This IS the test implementation. Run with:
```bash
npm test -- tests/components/
```

---

## Files to Create

| File | Action | Notes |
|------|--------|-------|
| `tests/components/ActiveSpeaker.test.tsx` | Create | 3 tests |
| `tests/components/ParticipantList.test.tsx` | Create | 5 tests |
| `tests/components/Timer.test.tsx` | Create | 4 tests |
| `tests/components/MeetingSummary.test.tsx` | Create | 3 tests |
| `tests/components/EndMeetingDialog.test.tsx` | Create | 3 tests |

---

## Completion Checklist

- [ ] All 18 acceptance criteria tests passing
- [ ] No module mocking except `useTimer` for Timer tests
- [ ] Lint passes (`npm run lint`)
- [ ] Build passes (`npm run build`)
- [ ] `tasks.md` updated to ✅
