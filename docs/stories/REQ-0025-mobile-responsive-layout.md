# REQ-0025: Mobile-Responsive Layout Adjustments

**Status**: 🟨 Requirements created  
**Priority**: Medium (UX polish)  
**Dependencies**: REQ-0005 through REQ-0024

---

## Overview

Ensure core pages and meeting UI components are readable and usable on small screens. This includes layout stacking, spacing, and tap targets for key controls.

---

## Acceptance Criteria

- [ ] Home page layout stacks vertically on small screens with comfortable spacing.
- [ ] Join page input and button fit within viewport without horizontal scrolling.
- [ ] Meeting lobby view stacks participant list and controls for mobile.
- [ ] Active meeting view keeps timer visible and controls reachable with one hand.
- [ ] Participant list rows wrap gracefully with icons and status indicators.
- [ ] All buttons have minimum tap target size of 44x44px.

---

## Implementation Details

### Layout Breakpoints

- Use Tailwind responsive utilities (e.g., `sm`, `md`, `lg`).
- Primary target: <= 640px width.

### Home and Join Pages

**Files**:
- `app/page.tsx`
- `app/join/[sessionId]/page.tsx`

**Adjustments**:
- Stack form fields with `flex-col` on mobile.
- Use full-width inputs and buttons with `w-full` and `max-w` wrappers.
- Keep share link and session ID readable (wrap text if needed).

### Meeting Page

**File**: `app/meeting/[sessionId]/page.tsx`

**Adjustments**:
- Use a single-column layout on mobile.
- Keep timer near the top with adequate spacing.
- Controls and speaker selector should be accessible without horizontal scrolling.

### Components

**Likely Files**:
- `components/ParticipantList.tsx`
- `components/ActiveSpeaker.tsx`
- `components/MeetingControls.tsx`
- `components/Timer.tsx`

**Adjustments**:
- Ensure participant list supports wrapping and truncation of long names.
- Keep icons aligned and avoid overflow by using `flex-wrap` or `min-w-0`.
- Increase button padding for mobile.

---

## UX Notes

- Avoid dense tables on mobile; use stacked rows or card-like layout.
- Maintain hierarchy: timer > active speaker > controls > list.
- Preserve visual distinction between lobby and active views.

---

## Testing Strategy

### Manual

1. Use browser responsive mode at 375px width.
2. Validate that all controls are visible without horizontal scroll.
3. Confirm buttons are easy to tap (44px min size).
4. Ensure timer and active speaker are prominent.

---

## Files to Modify (Expected)

| File | Action | Notes |
|------|--------|-------|
| `app/page.tsx` | Modify | Mobile form layout |
| `app/join/[sessionId]/page.tsx` | Modify | Mobile form layout |
| `app/meeting/[sessionId]/page.tsx` | Modify | Mobile meeting layout |
| `components/ParticipantList.tsx` | Modify | Wrapping, spacing |
| `components/ActiveSpeaker.tsx` | Modify | Responsive size |
| `components/MeetingControls.tsx` | Modify | Button layout |
| `components/Timer.tsx` | Modify | Responsive sizing |

---

## Common Pitfalls

- Hidden overflow causing horizontal scroll.
- Buttons too small on mobile.
- Timer shrinking too much on small screens.

---

## Completion Checklist

- [ ] No horizontal scrolling on mobile.
- [ ] Primary actions are reachable and readable.
- [ ] Participant list remains usable with many participants.
- [ ] `tasks.md` updated to ✅ when implemented.
