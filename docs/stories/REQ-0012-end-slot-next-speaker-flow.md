# REQ-0012: End Slot + Select Next Speaker Flow

**Status**: ⬜ Not Started  
**Priority**: High (MVP Core Flow)  
**Dependencies**: REQ-0007, REQ-0011

---

## Overview

Implement the active-speaker handoff flow so the current speaker can end their slot and immediately choose the next eligible speaker in one clear UX path.

This requirement connects two existing session operations:
- `endCurrentSlot(sessionId)` to clear `activeSpeakerId` and `slotEndsAt`
- `selectNextSpeaker(sessionId, nextSpeakerId)` to atomically start the next speaker slot

The flow must preserve Firebase transaction safety, prevent invalid actions, and keep the UI synchronized through `useSession` realtime updates.

---

## Acceptance Criteria

- [ ] Current active speaker sees an `End My Slot` action in active meeting state
- [ ] Only current active speaker can use `End My Slot` (button hidden/disabled for others)
- [ ] Clicking `End My Slot` calls `endCurrentSlot(sessionId)`
- [ ] While ending slot, control is disabled and shows loading state
- [ ] After slot ends (`activeSpeakerId === null`), speaker selection UI is shown
- [ ] Eligible participants exclude users already in `spokenUserIds`
- [ ] Selecting next speaker calls `selectNextSpeaker(sessionId, nextSpeakerId)`
- [ ] Selection action is disabled while request is in progress
- [ ] Error feedback shown for failed end/select operations
- [ ] When next speaker is selected, timer restarts based on new `slotEndsAt`
- [ ] Flow supports first-speaker case (host selects when no active speaker)
- [ ] Flow works on mobile and desktop layouts
- [ ] Design system tokens/classes used (no hardcoded new colors)

---

## Implementation Details

### Component: `components/MeetingControls.tsx`

Create a focused controls component for slot handoff actions.

**Props**:

```tsx
interface MeetingControlsProps {
  sessionId: string
  currentUserId: string | null
  activeSpeakerId: string | null
  hostId: string
  hasEligibleCandidates: boolean
}
```

**Behavior**:

1. Compute permissions:
   - `isActiveSpeaker = currentUserId === activeSpeakerId`
   - `isHost = currentUserId === hostId`
   - `noActiveSpeaker = activeSpeakerId === null`
2. Show `End My Slot` only when `isActiveSpeaker` is true.
3. Trigger `endCurrentSlot(sessionId)` with guarded async handling.
4. After end succeeds, rely on realtime session update to reveal selector state.
5. If `noActiveSpeaker && !hasEligibleCandidates`, show waiting/round-reset helper text.

---

### Integration: `app/meeting/[sessionId]/page.tsx`

In `ActiveMeetingView`:

1. Render `MeetingControls` below `ActiveSpeaker` and `Timer`.
2. Render `SpeakerSelector` when:
   - user can select (current speaker OR host when no active speaker)
   - there are participants to choose from
3. Pass `spokenUserIds`, `participants`, and role context into selector.
4. Keep logic source-of-truth in session snapshot (avoid duplicated local state).

---

## User Flow

```
Active speaker currently talking
        ↓
Clicks "End My Slot"
        ↓
endCurrentSlot(sessionId)
  -> activeSpeakerId = null
  -> slotEndsAt = null
        ↓
Realtime update received by clients
        ↓
Speaker/Host sees SpeakerSelector
        ↓
selectNextSpeaker(sessionId, nextSpeakerId)
  -> activeSpeakerId = nextSpeakerId
  -> slotEndsAt = now + slotDuration
  -> spokenUserIds updated transactionally
        ↓
Timer and ActiveSpeaker UI update automatically
```

---

## Error Handling

- Failed `endCurrentSlot`:
  - show inline error message
  - keep controls enabled for retry
- Failed `selectNextSpeaker`:
  - show inline selector error
  - keep current no-speaker state
- Session missing or stale:
  - surface existing meeting page error state

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `components/MeetingControls.tsx` | Create | End-slot controls and action states |
| `app/meeting/[sessionId]/page.tsx` | Modify | Wire handoff flow in ActiveMeetingView |
| `components/SpeakerSelector.tsx` | Modify (if needed) | Ensure post-end selection flow UX |

---

## Testing Notes

- Verify non-speakers cannot end current slot
- Verify end slot clears active speaker and timer immediately
- Verify selector appears after end slot transition
- Verify selecting next speaker restarts timer and updates active speaker
- Verify round-reset path when all speakers already spoke
- Verify loading/error states do not lock UI permanently
