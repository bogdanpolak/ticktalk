# REQ-0034: Pre-load Settings on Page Load (Home & Join)

**Status**: ✅ Completed
**Priority**: Medium (UX)
**Dependencies**: REQ-0033

---

## Overview

On page load, pre-populate the name and duration controls using persisted settings. This applies to both the Home and Join pages.

---

## Acceptance Criteria

- [x] Name input is pre-filled from local storage when available.
- [x] Duration selector reflects stored slot duration.
- [x] If stored duration was custom, selector shows "Custom..." and custom input is pre-filled.
- [x] If no stored settings exist, defaults are used (name empty, duration 120 seconds).
- [x] Behavior works on Home and Join pages.

---

## Implementation Details

### Settings Load

**Files**:
- `app/page.tsx`
- `app/join/[sessionId]/page.tsx`

**Changes**:
- Call `loadSettings()` on mount.
- Update state to reflect stored values.
- If `isCustomDuration` is true, set selector to "Custom..." and populate custom field.

---

## Testing Strategy

### Manual

1. Save settings by creating a session, then return to Home.
2. Verify name and duration are pre-filled correctly.
3. Save a custom duration and confirm it rehydrates with the custom input visible.
4. Repeat on the Join page.
5. Clear local storage and verify defaults.

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `app/page.tsx` | Modify | Load and apply settings on mount |
| `app/join/[sessionId]/page.tsx` | Modify | Load and apply settings on mount |

---

## Completion Checklist

- [x] Settings pre-load on Home and Join.
- [x] Custom duration state restored correctly.
- [x] Defaults apply when storage is empty.
- [x] `tasks.md` updated to ✅ when implemented.
