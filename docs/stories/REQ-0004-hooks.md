# REQ-0004: `useSession` and `useAuth` Hooks

**Status**: ⬜ Not Started  
**Priority**: High (Foundation)  
**Dependencies**: REQ-0001, REQ-0002, REQ-0003

---

## Overview

Implement two critical React hooks that provide real-time Firebase data and authentication state to components:

1. **`useAuth`** — Manages current user identity (Firebase Anonymous Auth)
2. **`useSession`** — Subscribes to a session document and returns real-time updates

These hooks are foundational for all subsequent component development.

---

## Acceptance Criteria

- [ ] `useAuth` hook returns `{ userId: string, isLoading: boolean, error?: string }`
- [ ] `useSession` hook accepts `sessionId` and returns `{ session: Session | null, isLoading: boolean, error?: string }`
- [ ] Both hooks properly manage subscriptions/listeners
- [ ] Listeners are cleaned up on unmount to prevent memory leaks
- [ ] Error states are properly captured and surfaced
- [ ] Types are properly exported from `lib/` for use in components

---

## Implementation Details

### Hook: `useAuth`

**File**: `app/hooks/useAuth.ts`

**Purpose**: Authenticate user on client-side and provide stable identity across sessions.

**Implementation**:

```ts
import { useEffect, useState } from 'react'
import { signInAnonymously } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthState {
  userId: string | null
  isLoading: boolean
  error?: string
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    userId: null,
    isLoading: true,
    error: undefined
  })

  useEffect(() => {
    let isMounted = true

    // Check if user already authenticated
    if (auth.currentUser) {
      if (isMounted) {
        setState({
          userId: auth.currentUser.uid,
          isLoading: false
        })
      }
      return
    }

    // Sign in anonymously
    signInAnonymously(auth)
      .then(userCredential => {
        if (isMounted) {
          setState({
            userId: userCredential.user.uid,
            isLoading: false
          })
        }
      })
      .catch(error => {
        if (isMounted) {
          setState({
            userId: null,
            isLoading: false,
            error: error.message
          })
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return state
}
```

**Behavior**:
- On first mount, checks if user already authenticated via `auth.currentUser`
- If authenticated, returns immediately with `userId` and `isLoading: false`
- If not, calls `signInAnonymously()` to create a new anonymous user
- Updates state with `userId` once auth completes
- Handles errors gracefully
- Prevents state updates after unmount via `isMounted` flag

**Usage**:
```ts
const { userId, isLoading, error } = useAuth()

if (isLoading) return <div>Authenticating...</div>
if (error) return <div>Auth failed: {error}</div>
if (!userId) return null

// Safe to use userId in component
```

---

### Hook: `useSession`

**File**: `app/hooks/useSession.ts`

**Purpose**: Real-time subscription to a specific session document in Firebase.

**Implementation**:

```ts
import { useEffect, useState } from 'react'
import { ref, onValue, off } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Session } from '@/lib/session'

interface SessionState {
  session: Session | null
  isLoading: boolean
  error?: string
}

export function useSession(sessionId: string | null): SessionState {
  const [state, setState] = useState<SessionState>({
    session: null,
    isLoading: true,
    error: undefined
  })

  useEffect(() => {
    // If no sessionId provided, reset state
    if (!sessionId) {
      setState({
        session: null,
        isLoading: false,
        error: undefined
      })
      return
    }

    setState(prev => ({ ...prev, isLoading: true }))

    const sessionRef = ref(db, `sessions/${sessionId}`)

    const unsubscribe = onValue(
      sessionRef,
      snapshot => {
        if (snapshot.exists()) {
          setState({
            session: snapshot.val() as Session,
            isLoading: false
          })
        } else {
          setState({
            session: null,
            isLoading: false,
            error: 'Session not found'
          })
        }
      },
      error => {
        setState({
          session: null,
          isLoading: false,
          error: error.message
        })
      }
    )

    // Cleanup listener on unmount or sessionId change
    return () => {
      off(sessionRef)
    }
  }, [sessionId])

  return state
}
```

**Behavior**:
- Accepts `sessionId` (nullable for initial loading states)
- If `sessionId` is null, resets state immediately
- On `sessionId` change, sets `isLoading: true` and fetches fresh data
- Sets up real-time listener via `onValue()` 
- Updates state whenever session data changes in Firebase
- Captures session-not-found errors separately
- Cleans up listener via `off()` when unmounting or `sessionId` changes
- Returns typed `Session` object or null

**Usage**:
```ts
const { session, isLoading, error } = useSession(sessionId)

if (isLoading) return <div>Loading session...</div>
if (error) return <div>Error: {error}</div>
if (!session) return null

// Safe to use session data
console.log(session.status, session.activeSpeakerId)
```

---

## Type Definitions

Ensure these types are exported from `lib/session.ts`:

```ts
export interface Participant {
  name: string
  role: 'host' | 'participant'
  isHandRaised: boolean
}

export interface Session {
  hostId: string
  slotDurationSeconds: number
  status: 'lobby' | 'active' | 'finished'
  activeSpeakerId: string | null
  slotEndsAt: number | null
  spokenUserIds: string[]
  participants: Record<string, Participant>
}
```

---

## Testing Strategy

### Unit Tests (Optional but recommended)

**Test: `useAuth` completes authentication**
```ts
// Mock firebase auth
// Verify useState calls with userId
// Verify cleanup on unmount
```

**Test: `useSession` subscribes to data**
```ts
// Mock onValue callback
// Verify listener is set up with correct ref
// Verify state updates on snapshot
// Verify cleanup with off()
```

### Manual Testing

1. **In Home page**: Verify `useAuth` authenticates and provides stable `userId`
2. **In Meeting page**: Verify `useSession` loads session data and updates in real-time
3. **In browser DevTools**: Check Firebase listeners are cleaned up (no console warnings)
4. **Navigate away**: Verify no memory leaks or stale updates after unmount

---

## Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `app/hooks/useAuth.ts` | Create | New hook for auth state |
| `app/hooks/useSession.ts` | Create | New hook for session subscription |
| `lib/session.ts` | Modify | Export `Session` and `Participant` types |
| `tsconfig.json` | Verify | Ensure `@/` paths work correctly |

---

## Common Pitfalls

- ❌ Not cleaning up Firebase listeners → memory leaks
- ❌ Calling `signInAnonymously()` multiple times → duplicate users
- ❌ Not handling null `sessionId` → subscription errors
- ❌ State updates after unmount → React warnings
- ❌ Not exporting types → TypeScript errors downstream

---

## Completion Checklist

- [ ] Both hooks created in `app/hooks/`
- [ ] Types properly defined in `lib/session.ts`
- [ ] Console shows no Firebase warnings
- [ ] Can navigate between pages without memory leaks
- [ ] Manual test: auth persists across page reloads
- [ ] Manual test: session updates real-time in Firebase console
- [ ] Code reviewed for React best practices
- [ ] Update `tasks.md` with ✅ status
