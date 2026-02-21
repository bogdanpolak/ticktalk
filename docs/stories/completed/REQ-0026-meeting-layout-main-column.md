# REQ-0026: Meeting Layout - Participant List in Main Column

**Status**: ✅ Completed
**Priority**: Medium (Layout)
**Dependencies**: REQ-0007, REQ-0013, REQ-0025

---

## Overview

Adjust the meeting page layout so the participant list lives in the main column above the timer on all breakpoints. Remove the right-side aside layout on large screens while preserving existing spacing and card styles.

---

## Acceptance Criteria

- [ ] The meeting page no longer renders a right-side aside panel on large screens.
- [ ] Participant list renders above the timer in the main column for all breakpoints.
- [ ] Existing spacing, card styling, and section headers remain consistent with current design.
- [ ] Lobby and finished states are unaffected, aside from layout consistency.
- [ ] Mobile layout remains readable and does not regress.

---

## UX Notes

- Keep the vertical rhythm consistent with current spacing tokens.
- If the layout uses a grid, collapse it into a single-column stack for all viewport widths.
- Maintain a clear visual hierarchy: Participants -> Timer -> Controls.

---

## Implementation Details

### Meeting Page Layout

**File**: `app/meeting/[sessionId]/page.tsx`

**Changes**:
- Replace multi-column or aside layout with a single main column stack.
- Ensure `ParticipantList` is rendered directly above `Timer` in the active state.
- Keep the same container width and padding used elsewhere in the meeting page.

### Styling

- If Tailwind grid or flex utilities are used for a two-column layout, remove the secondary column classes.
- Preserve existing card wrapper styles so components look unchanged.

---

## Testing Strategy

### Manual

1. Open an active meeting and confirm the participant list is above the timer at desktop widths.
2. Resize to tablet and mobile widths; ensure stacking remains consistent.
3. Verify lobby and finished states still render correctly.

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `app/meeting/[sessionId]/page.tsx` | Modify | Replace two-column layout with single column |

---

## Completion Checklist

- [ ] Participant list appears above timer for all breakpoints.
- [ ] No right-side aside is rendered.
- [ ] Spacing and card styles preserved.
- [ ] `tasks.md` updated to ✅ when implemented.
