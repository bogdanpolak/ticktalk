# REQ-0023: Meeting Summary with Speaking Times

**Status**: ✅ Completed  
**Priority**: Medium (Post-meeting)  
**Dependencies**: REQ-0020, REQ-0021

---

## Overview

Add a finished-state summary view that displays speaking metrics for all participants once a meeting ends. The summary appears when `session.status` is `finished` and should provide a concise overview of participation and time compliance.

---

## Acceptance Criteria

- [ ] When `session.status === 'finished'`, the meeting page renders a summary view instead of lobby/active views.
- [ ] Summary lists all participants with:
  - [ ] Name
  - [ ] Total time spoken (from `totalSpokeDurationSeconds`)
  - [ ] Number of turns (from `speakingHistory.length`)
  - [ ] Over-time flag if any turn exceeded `slotDurationSeconds`
- [ ] Participants with any over-time turn are visually highlighted (red or equivalent warning state).
- [ ] Summary view is responsive and readable on mobile.
- [ ] Summary has a host-only action to close summary and return to meeting view (if desired in product flow).

---

## UX Notes

- Use a compact table or stacked list on mobile.
- Over-time highlight should be noticeable but not overpowering (e.g., border + subtle background).
- If no speaking history exists, show `0 turns` and `0:00` total.

---

## Implementation Details

### New Component

**File**: `components/MeetingSummary.tsx`

**Responsibilities**:
- Accept `session` as prop.
- Build a participant list from `session.participants`.
- For each participant:
  - Compute `totalSpokeDurationSeconds` (default 0).
  - Compute `turnCount = speakingHistory?.length ?? 0`.
  - Compute `hasOvertime` by checking if any `speakingHistory.durationSeconds > slotDurationSeconds`.
- Render a list or table with name, total time, turns, and a badge for overtime.

### Meeting Page Integration

**File**: `app/meeting/[sessionId]/page.tsx`

**Logic**:
- If `session.status === 'finished'`, render `MeetingSummary`.
- Ensure that active/lobby views are not visible when finished.

### Formatting Helpers

- Add a small helper for duration formatting in `app/utils.tsx` or local to component.
- Format total time as `M:SS` (or `H:MM:SS` if exceeding 1 hour).

---

## Data Requirements

- Use `participants[participantId].totalSpokeDurationSeconds`.
- Use `participants[participantId].speakingHistory`.
- Use `session.slotDurationSeconds` for overtime checks.

---

## Testing Strategy

### Manual

1. End a meeting with multiple participants and confirm summary appears.
2. Verify total time equals sum of speaking history durations.
3. Confirm overtime highlight on participants who exceeded slot duration.
4. Verify mobile layout at <= 640px width.

### Suggested Unit Tests (Optional)

- Overtime detection logic when any turn exceeds slot duration.
- Duration formatting for totals > 59 minutes.

---

## Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `components/MeetingSummary.tsx` | Create | Summary UI and computation |
| `app/meeting/[sessionId]/page.tsx` | Modify | Render summary when finished |
| `app/utils.tsx` | Modify | Optional duration formatting helper |

---

## Common Pitfalls

- Forgetting to handle undefined `speakingHistory` arrays.
- Not handling `totalSpokeDurationSeconds` missing on older sessions.
- Rendering summary alongside active view (should be exclusive).

---

## Completion Checklist

- [ ] Summary renders only in finished state.
- [ ] All participant rows show name, total time, turns.
- [ ] Overtime flag logic verified.
- [ ] Mobile layout verified.
- [ ] `tasks.md` updated to ✅ when implemented.
