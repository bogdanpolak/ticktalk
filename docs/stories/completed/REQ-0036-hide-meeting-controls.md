# REQ-0036: Hide MeetingControls for Non-Active Participants

**Status**: ✅ Completed
**Priority**: Medium (Meeting UX)
**Dependencies**: REQ-0014, REQ-0012

---

## Overview

Hide the `MeetingControls` component for participants who are neither the active speaker nor the host. Hosts should always see meeting controls; active speakers should see "End My Slot".

---

## Acceptance Criteria

- [x] Host always sees MeetingControls (including End Meeting).
- [x] Active speaker sees MeetingControls (End My Slot).
- [x] Non-active, non-host participants do not see MeetingControls at all.
- [x] No placeholder or empty container is rendered when hidden.
- [x] Behavior is consistent across desktop and mobile.

---

## Implementation Details

### Meeting Controls Visibility

**File**: `components/MeetingControls.tsx`

**Changes**:
- Add explicit visibility props (e.g., `showControls` or role flags).
- Ensure the component renders null when not visible.

### Meeting Page Integration

**File**: `app/meeting/[sessionId]/page.tsx`

**Changes**:
- Derive visibility based on `isHost` or `isActiveSpeaker`.
- Pass visibility props to `MeetingControls`.

---

## Testing Strategy

### Manual

1. Join as host and verify MeetingControls always visible.
2. Join as participant and confirm controls are hidden until selected as speaker.
3. When active speaker ends their slot, controls disappear for that user.
4. Verify layout does not leave empty gaps.

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `components/MeetingControls.tsx` | Modify | Add visibility logic |
| `app/meeting/[sessionId]/page.tsx` | Modify | Pass visibility props |

---

## Completion Checklist

- [x] Controls hidden for non-active, non-host participants.
- [x] Host and active speaker visibility works.
- [x] No layout gaps.
- [x] `tasks.md` updated to ✅ when implemented.
