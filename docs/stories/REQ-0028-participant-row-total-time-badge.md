# REQ-0028: Participant Row Total Time Badge

**Status**: 🟨 Requirements created
**Priority**: Medium (Participant list detail)
**Dependencies**: REQ-0013, REQ-0020

---

## Overview

Add a right-aligned "Total: M:SS" badge to each participant row showing the cumulative speaking time. This should display for all participants without overtime styling.

---

## Acceptance Criteria

- [ ] Each participant row shows a "Total: M:SS" badge using `totalSpokeDurationSeconds`.
- [ ] The badge is right-aligned next to existing status chips.
- [ ] Format follows `M:SS` (e.g., `Total: 3:04`), defaulting to `0:00` when missing.
- [ ] No overtime styling is applied in the participant list.
- [ ] Layout remains readable on mobile.

---

## UX Notes

- Badge should be visually consistent with existing chips (border, background, or pill style).
- Keep the badge secondary to "Speaking" and "Hand Raised" indicators.

---

## Implementation Details

### Participant List UI

**File**: `components/ParticipantList.tsx`

**Changes**:
- Compute `totalSpokeDurationSeconds` per participant, default to 0.
- Format duration as `M:SS` via existing helper or a small local utility.
- Render a right-aligned badge labeled `Total: M:SS` alongside status chips.

### Formatting Helper

- If a duration formatter exists in `app/utils.tsx`, reuse it; otherwise add a small helper in `ParticipantList.tsx`.

---

## Testing Strategy

### Manual

1. Join a meeting with multiple participants and verify total badges render.
2. End at least one slot and confirm totals update in real time.
3. Check mobile layout for wrapping or overflow issues.

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `components/ParticipantList.tsx` | Modify | Add total time badge per row |
| `app/utils.tsx` | Modify (optional) | Reuse or add duration formatter |

---

## Completion Checklist

- [ ] Total time badge shown for every participant row.
- [ ] Format `Total: M:SS` verified.
- [ ] No overtime styling applied in list.
- [ ] `tasks.md` updated to ✅ when implemented.
