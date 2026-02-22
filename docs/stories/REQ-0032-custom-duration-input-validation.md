# REQ-0032: Custom Duration Input Field with Validation

**Status**: 🟨 Requirements created
**Priority**: High (Core UX)
**Dependencies**: REQ-0031

---

## Overview

Add a custom duration input that appears only when the duration selector is set to "Custom...". Validate the input range on submit and provide clear guidance and error messaging.

---

## Acceptance Criteria

- [ ] Custom input is only visible when "Custom..." is selected.
- [ ] Input is pre-populated with 120 seconds or last custom value from local storage.
- [ ] Helper text appears below the input: "Enter custom duration in seconds (30-3600)".
- [ ] Validation runs on submit and blocks invalid values.
- [ ] Valid range: 30 to 3600 seconds inclusive.
- [ ] Error message is shown for invalid values and cleared when valid.

---

## UX Notes

- Use a numeric input control with clear min/max behavior.
- Keep error messaging concise and near the input.

---

## Implementation Details

### Custom Input Rendering

**File**: `app/page.tsx`

**Changes**:
- Conditionally render the numeric input when the "Custom..." option is selected.
- Display helper text under the input.
- Track custom value in local component state.

### Validation

- On submit, if custom is selected, validate the input range.
- If invalid, prevent submission and show error text.
- If valid, proceed with session creation using the custom value.

---

## Testing Strategy

### Manual

1. Select "Custom..." and confirm the input appears with helper text.
2. Enter a value below 30 and submit; verify an error appears.
3. Enter a value above 3600 and submit; verify an error appears.
4. Enter a valid value (e.g., 120) and submit; verify success.
5. Switch back to a fixed option; input and error text should be hidden.

---

## Files to Modify

| File | Action | Notes |
|------|--------|-------|
| `app/page.tsx` | Modify | Add custom input, helper text, and validation |

---

## Completion Checklist

- [ ] Custom input only appears for "Custom...".
- [ ] Helper and error text display correctly.
- [ ] Validation blocks out-of-range values.
- [ ] `tasks.md` updated to ✅ when implemented.
