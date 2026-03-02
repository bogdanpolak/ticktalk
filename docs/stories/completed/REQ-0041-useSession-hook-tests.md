# REQ-0041: Unit Tests — useSession Hook

**Status**: ✅ Completed
**Priority**: High (Test Infrastructure)
**Dependencies**: None

---

## Overview

Create `tests/hooks/useSession.test.ts` with ~10 tests covering all behaviors of the `useSession` hook. The hook accepts `sessionService` via options parameter, enabling clean DI testing without module mocking.

---

## Acceptance Criteria

- [ ] Returns initial loading state (`isLoading: true, session: null`)
- [ ] Calls `monitorPresence(sessionId, userId)` when both provided
- [ ] Returns session data after `subscribeSession` callback fires
- [ ] Updates state when session data changes
- [ ] Detects `speakerDisconnected` when active speaker has no presence
- [ ] Sets error "Session not found" when `onData` receives null
- [ ] Sets error from `onError` callback
- [ ] Calls unsubscribe on unmount
- [ ] Resubscribes when sessionId changes
- [ ] Skips subscription when sessionId is null

---

## Implementation Details

### New File

**File**: `tests/hooks/useSession.test.ts`

### Test Approach

Use `renderHook()` from `@testing-library/react` with `createMockSessionService()` injected via options. The mock's `subscribeSession` and `monitorPresence` need to capture their callbacks so tests can simulate Firebase events.

### Test Structure

```typescript
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useSession } from '@/hooks/useSession'
import { createMockSession, createMockSessionService } from '@/lib/__tests__/mocks'
import type { Session } from '@/lib/services/sessionService'

// Helper: create a mock service that captures subscribeSession callbacks
function createTestSessionService() {
  let onDataCb: ((session: Session | null) => void) | null = null
  let onErrorCb: ((error: Error) => void) | null = null
  const unsubscribe = vi.fn()
  const presenceCleanup = vi.fn()

  const service = createMockSessionService({
    subscribeSession: vi.fn((sessionId, onData, onError) => {
      onDataCb = onData
      onErrorCb = onError ?? null
      return unsubscribe
    }),
    monitorPresence: vi.fn(() => presenceCleanup)
  })

  return {
    service,
    fireData: (session: Session | null) => { onDataCb?.(session) },
    fireError: (error: Error) => { onErrorCb?.(error) },
    unsubscribe,
    presenceCleanup
  }
}

describe('useSession', () => {
  // Test structure:
  // - Initial loading state
  // - Calls monitorPresence
  // - Session data after subscribe
  // - Session update
  // - Speaker disconnected detection
  // - Session not found
  // - Firebase error
  // - Cleanup on unmount
  // - Resubscribe on sessionId change
  // - Skip when sessionId null
})
```

### Key Testing Patterns

1. **Capture callbacks**: Mock `subscribeSession` to capture `onData`/`onError` callbacks, then invoke them in `act()` to simulate Firebase events
2. **Presence cleanup**: Mock `monitorPresence` to return a cleanup fn, verify it's called on unmount
3. **Rerender**: Use `renderHook`'s `rerender` with new sessionId to test resubscription
4. **Wrap state updates in `act()`**: All callback invocations that update state must be wrapped in `act()`

### Speaker Disconnected Detection Logic

The hook checks:
```typescript
if (activeSpeakerId && session.presence) {
  const speakerPresence = session.presence[activeSpeakerId]
  speakerDisconnected = !speakerPresence || speakerPresence.status === 'offline'
}
```

Test with a session that has `activeSpeakerId: 'user-1'` and either missing presence or `status: 'offline'`.

---

## Testing Strategy

This IS the test implementation. Run with:
```bash
npm test -- tests/hooks/useSession.test.ts
```

---

## Files to Create

| File | Action | Notes |
|------|--------|-------|
| `tests/hooks/useSession.test.ts` | Create | ~10 tests covering all hook behaviors |

---

## Completion Checklist

- [ ] All 10 acceptance criteria tests passing
- [ ] Hook fully tested with injected mock service (no module mocking)
- [ ] Lint passes (`npm run lint`)
- [ ] Build passes (`npm run build`)
- [ ] `tasks.md` updated to ✅
