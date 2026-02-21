# REQ-0027: Remove Active Speaker Panel

**Status**: ✅ Completed
**Priority**: Medium (UI simplification)
**Dependencies**: REQ-0008, REQ-0013

---

## Overview

Remove the Active Speaker panel from the meeting view. The participant list "Speaking" indicator becomes the sole active-speaker signal. Ensure the meeting view still handles the no-active-speaker state gracefully.

---

## Acceptance Criteria

- [ ] Active Speaker panel is not rendered in any meeting state.
- [ ] The meeting page relies on the participant list "Speaking" badge only.
- [ ] No layout gaps remain where the panel previously appeared.
- [ ] Empty-speaker state is still communicated (e.g., no errors, no blank card).

---

## UX Notes

- Keep the layout visually balanced after removing the panel.
- If the panel removed a section header or card, adjust spacing so remaining sections feel intentional.

---

## Implementation Details

### Meeting Page Integration

**File**: `app/meeting/[sessionId]/page.tsx`

**Changes**:
- Remove the `ActiveSpeaker` component import and rendering.
- Remove any wrapper or section title specific to the panel.
- Ensure conditional rendering still works when `activeSpeakerId` is null.

### Component Usage

- Keep the `ActiveSpeaker` component file unless explicitly instructed to delete it.

---

## Testing Strategy

### Manual

1. Join a meeting with no active speaker and confirm UI is stable.
2. Start a speaker slot and verify the "Speaking" badge updates in the participant list.
3. End the slot and confirm UI returns to idle state without gaps.

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `app/meeting/[sessionId]/page.tsx` | Modify | Remove ActiveSpeaker usage |

---

## Completion Checklist

- [ ] Active Speaker panel removed from the meeting view.
- [ ] Participant list remains the sole active-speaker indicator.
- [ ] Layout remains clean and balanced.
- [ ] `tasks.md` updated to ✅ when implemented.
