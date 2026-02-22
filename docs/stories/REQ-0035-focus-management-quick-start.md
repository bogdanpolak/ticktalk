# REQ-0035: Focus Management for Quick Start UX

**Status**: 🟨 Requirements created
**Priority**: Medium (UX)
**Dependencies**: REQ-0034

---

## Overview

Improve quick-start UX by focusing the correct element after settings are loaded. First-time users focus the name input; returning users focus the primary action button.

---

## Acceptance Criteria

- [ ] If no stored name, focus the name input on load.
- [ ] If stored name exists, focus the primary button (Create or Join).
- [ ] Focus occurs after settings load, without visible flicker.
- [ ] Works on both Home and Join pages.

---

## Implementation Details

### Local Storage Hook

**File**: `hooks/useLocalStorage.ts` (new)

**Changes**:
- Create a hook to load settings and expose a signal when ready.
- The hook should return stored name/duration values and a `hasStoredName` flag.

### Focus Management

**Files**:
- `app/page.tsx`
- `app/join/[sessionId]/page.tsx`

**Changes**:
- Add `useRef` for name input and action button.
- In `useEffect`, after settings load, call `.focus()` based on `hasStoredName`.

---

## Testing Strategy

### Manual

1. Clear local storage and open Home page; name input is focused.
2. Enter a name, create a session, return to Home; Create button is focused.
3. Repeat for Join page with and without stored name.

---

## Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `hooks/useLocalStorage.ts` | Create | Settings + focus helper hook |
| `app/page.tsx` | Modify | Apply focus rules |
| `app/join/[sessionId]/page.tsx` | Modify | Apply focus rules |

---

## Completion Checklist

- [ ] Focus logic works on Home and Join.
- [ ] Focus respects stored name presence.
- [ ] No UI flicker from late focus.
- [ ] `tasks.md` updated to ✅ when implemented.
