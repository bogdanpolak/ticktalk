# REQ-0031: Custom Duration Selector with 10 Options

**Status**: ✅ Completed
**Priority**: High (Core UX)
**Dependencies**: REQ-0005

---

## Overview

Expand the session duration selector on the Home page to offer 9 fixed time options plus a "Custom..." option. The default selection should remain 120 seconds (2:00).

---

## Acceptance Criteria

- [x] Duration selector lists the 9 fixed options plus "Custom...".
- [x] Default selected value is 120 seconds (2:00).
- [x] Fixed options display human-readable labels (e.g., 75 seconds shown as 1:15).
- [x] Selecting a fixed option sets slot duration accordingly.
- [x] Selecting "Custom..." triggers the custom input field (handled in REQ-0032).
- [x] Existing layout and styling are preserved.

---

## UX Notes

- Keep option labels concise and consistent (e.g., "1:15", "2:30").
- The selector should continue to look and behave like a standard form control.

---

## Implementation Details

### Duration Options

**File**: `app/page.tsx`

**Changes**:
- Replace the current duration options array with the 10-option list.
- Use seconds as the underlying values.
- Keep 120 seconds as the default selection.

Suggested options:
- 60 (1:00)
- 75 (1:15)
- 90 (1:30)
- 105 (1:45)
- 120 (2:00) default
- 135 (2:15)
- 150 (2:30)
- 165 (2:45)
- 180 (3:00)
- Custom...

---

## Testing Strategy

### Manual

1. Open the Home page and verify the selector shows the full option list.
2. Confirm 120 seconds is selected by default.
3. Choose several fixed options and confirm the selected value updates.
4. Select "Custom..." and confirm the custom input appears (REQ-0032).

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `app/page.tsx` | Modify | Replace duration options list |

---

## Completion Checklist

- [x] Selector shows all required options.
- [x] Default is 120 seconds.
- [x] No layout regressions.
- [x] `tasks.md` updated to ✅ when implemented.
