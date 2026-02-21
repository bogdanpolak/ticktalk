# REQ-0024: End Meeting Warning for Unspoken Users

**Status**: 🟨 Requirements created  
**Priority**: Medium (Host control)  
**Dependencies**: REQ-0014, REQ-0017

---

## Overview

Add a confirmation dialog when the host attempts to end a meeting while some participants have not spoken in the current round. This prevents accidental early termination while still allowing the host to proceed.

---

## Acceptance Criteria

- [ ] Host "End Meeting" button is always enabled (even during an active speaker slot).
- [ ] On click, if any participants are unspoken, show a modal:
  - [ ] Message: "X participant(s) haven't spoken yet. End meeting anyway?"
  - [ ] Buttons: "Cancel" and "End Meeting"
- [ ] "Cancel" closes the dialog and keeps meeting active.
- [ ] "End Meeting" updates session status to `finished` and clears active speaker fields.
- [ ] If everyone has spoken, no dialog is shown and meeting ends immediately.

---

## Implementation Details

### New Component

**File**: `components/EndMeetingDialog.tsx`

**Props**:
- `isOpen: boolean`
- `unspokenCount: number`
- `onCancel: () => void`
- `onConfirm: () => void`

**Behavior**:
- Render modal overlay only when `isOpen` is true.
- Display `unspokenCount` in message.
- Ensure focus trap or close on overlay click is optional (keep simple).

### Meeting Controls Integration

**File**: `components/MeetingControls.tsx`

**Logic**:
- Compute unspoken IDs from `session.participants` and `session.spokenUserIds`.
- If `unspokenCount > 0`, open dialog instead of ending immediately.
- If `unspokenCount === 0`, call `endMeeting()` directly.

### End Meeting Update

**File**: `lib/session.ts` (or current end meeting helper)

**Update**:
- Ensure end meeting clears:
  - `status: 'finished'`
  - `activeSpeakerId: null`
  - `slotEndsAt: null`
  - `slotStartedAt: null`

---

## UX Notes

- Use a clear, neutral warning tone (not destructive).
- Keep button hierarchy: primary for "End Meeting", secondary for "Cancel".
- The dialog should match existing component styling.

---

## Testing Strategy

### Manual

1. Start meeting with 2+ participants.
2. End meeting before all have spoken: dialog should appear.
3. Cancel: meeting continues, no state change.
4. Confirm: meeting ends, summary appears.
5. End meeting after all have spoken: no dialog.

### Suggested Unit Tests (Optional)

- Unspoken count calculation when `spokenUserIds` is empty or missing.
- Dialog renders only for host.

---

## Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `components/EndMeetingDialog.tsx` | Create | Confirmation modal |
| `components/MeetingControls.tsx` | Modify | Show dialog conditionally |
| `lib/session.ts` | Modify | End meeting helper cleanup |

---

## Common Pitfalls

- Forgetting to include `slotStartedAt` in end meeting cleanup.
- Dialog showing for non-hosts.
- Miscounting unspoken participants when `spokenUserIds` resets.

---

## Completion Checklist

- [ ] Dialog appears only when unspoken participants exist.
- [ ] End Meeting always enabled for host.
- [ ] Confirm ends meeting and clears slot fields.
- [ ] Cancel leaves session unchanged.
- [ ] `tasks.md` updated to ✅ when implemented.
