# REQ-0043: Unit Tests — Integrated Components

**Status**: ✅ Completed
**Priority**: Medium (Test Coverage)
**Dependencies**: None

---

## Overview

Create test files for 3 integrated components that interact with sessionService: SpeakerSelector, MeetingControls, HandRaiseButton. All accept injectable `sessionService` prop for clean testing. ~12 tests total.

---

## Acceptance Criteria

### SpeakerSelector (~5 tests)
- [ ] Returns null when user cannot select (not current speaker, not host at start)
- [ ] Renders eligible candidates (those not in spokenUserIds)
- [ ] Calls `selectNextSpeaker(sessionId, userId)` when candidate clicked
- [ ] Shows error message on selection failure
- [ ] Shows "All participants have spoken" when no eligible candidates

### MeetingControls (~4 tests)
- [ ] Returns null when `isVisible` is false
- [ ] "End My Slot" calls `endLastSlot(sessionId)` and triggers `onSlotEnded`
- [ ] "End Meeting" opens dialog when unspoken participants exist
- [ ] "End Meeting" calls `endMeeting(sessionId)` directly when all have spoken

### HandRaiseButton (~3 tests)
- [ ] Returns null when user is active speaker
- [ ] Shows "Raise Hand" / "Lower Hand" based on isHandRaised prop
- [ ] Calls `toggleHandRaise(sessionId, userId)` on click

---

## Implementation Details

### New Files

| File | Notes |
|------|-------|
| `tests/components/SpeakerSelector.test.tsx` | DI via sessionService prop |
| `tests/components/MeetingControls.test.tsx` | DI via sessionService prop, includes EndMeetingDialog integration |
| `tests/components/HandRaiseButton.test.tsx` | DI via sessionService prop |

### Testing Pattern

All components accept `sessionService` as a prop defaulting to the real service. Inject a mock:

```typescript
import { createMockSessionService, createMockParticipant } from '@/lib/__tests__/mocks'
import userEvent from '@testing-library/user-event'

const mockService = createMockSessionService()
const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

render(
  <SpeakerSelector
    sessionId="session-1"
    participants={participants}
    spokenUserIds={[]}
    currentUserId="user-1"
    activeSpeakerId="user-1"
    isHost={false}
    sessionService={mockService}
  />
)
```

### SpeakerSelector Details

Test `canSelect` logic:
- `canSelect = true` when `currentUserId === activeSpeakerId` — user just ended their slot
- `canSelect = true` when `isHost && !activeSpeakerId && spokenUserIds.length === 0` — first speaker selection
- `canSelect = false` otherwise → component returns null (nothing rendered)

Test eligible filtering:
- Participants in `spokenUserIds` are excluded from the candidate list
- Remaining candidates sorted: hand-raised first, then alphabetical

### MeetingControls Details

Test End Meeting dialog flow:
- Create participants where not all are in `spokenUserIds` → `unspokenCount > 0`
- Click "End Meeting" → dialog opens (check for "End Meeting Early?" text)
- Click "End Meeting" when all spoken (`unspokenCount === 0`) → directly calls `endMeeting`

Test End Slot:
- Set `isActiveSpeaker=true`, `isLastSpeaker=true` to show "End My Slot"
- Mock `endLastSlot` to resolve, verify `onSlotEnded` is called

### HandRaiseButton Details

Test hidden states:
- `isActiveSpeaker=true` → returns null (empty container)
- `currentUserId=null` → returns null

Test toggle:
- Render with `isHandRaised=false` → button says "Raise Hand"
- Render with `isHandRaised=true` → button says "Lower Hand"
- Click → calls `mockService.toggleHandRaise('session-1', 'user-1')`

### Async Testing

For components with async handlers, use `waitFor` or check post-async state:

```typescript
mockService.selectNextSpeaker = vi.fn(async () => {
  throw new Error('Network error')
})

await user.click(selectButton)
await waitFor(() => {
  expect(screen.getByText('Network error')).toBeInTheDocument()
})
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
| `tests/components/SpeakerSelector.test.tsx` | Create | 5 tests |
| `tests/components/MeetingControls.test.tsx` | Create | 4 tests |
| `tests/components/HandRaiseButton.test.tsx` | Create | 3 tests |

---

## Completion Checklist

- [ ] All 12 acceptance criteria tests passing
- [ ] Clean DI via sessionService prop (no module mocking)
- [ ] Lint passes (`npm run lint`)
- [ ] Build passes (`npm run build`)
- [ ] `tasks.md` updated to ✅
