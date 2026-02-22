# REQ-0033: Local Storage Persistence for Settings

**Status**: 🟨 Requirements created
**Priority**: Medium (Persistence)
**Dependencies**: REQ-0005, REQ-0006

---

## Overview

Persist the user's name and slot duration settings in local storage. Settings should be saved only after a successful session create or join.

---

## Acceptance Criteria

- [ ] Local storage keys match the specified names.
- [ ] `saveSettings(name, duration, isCustom)` stores values correctly.
- [ ] `loadSettings()` returns the stored values or sensible defaults.
- [ ] Save occurs only on successful create/join.
- [ ] Storage works for both Home and Join flows.

---

## Implementation Details

### Storage Helpers

**File**: `lib/storage.ts` (new)

**Functions**:
- `saveSettings(name: string, duration: number, isCustom: boolean)`
- `loadSettings(): { userName: string; slotDuration: number; isCustomDuration: boolean }`

**Storage keys**:
- `ticktalk_userName`
- `ticktalk_slotDuration`
- `ticktalk_isCustomDuration`

### Integration

**Files**:
- `app/page.tsx`
- `app/join/[sessionId]/page.tsx`

**Changes**:
- Call `saveSettings(...)` after successful create/join.
- Use `loadSettings()` for initial state (REQ-0034 expands behavior).

---

## Testing Strategy

### Manual

1. Create a session with a name and duration.
2. Reload the page and confirm values persist (REQ-0034).
3. Join a session with a different name and confirm storage updates.
4. Clear local storage and verify defaults are used.

---

## Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `lib/storage.ts` | Create | Add storage helpers |
| `app/page.tsx` | Modify | Save settings after create |
| `app/join/[sessionId]/page.tsx` | Modify | Save settings after join |

---

## Completion Checklist

- [ ] Storage helpers implemented and used.
- [ ] Settings saved only on success.
- [ ] Keys match spec.
- [ ] `tasks.md` updated to ✅ when implemented.
