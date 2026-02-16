# REQ-0006: Join Page — Enter Name and Join

**Status**: ⬜ Not Started  
**Priority**: High (MVP Feature)  
**Dependencies**: REQ-0001, REQ-0002, REQ-0003, REQ-0004

---

## Overview

Implement the join page (`app/join/[sessionId]/page.tsx`) where participants can:
1. See the session ID they're joining
2. Enter their name
3. Click "Join" to add themselves to the session
4. Get redirected to the meeting page
5. Handle errors (session not found, already joined, etc.)

This is the entry point for participants who receive a session link.

---

## Acceptance Criteria

- [ ] Page accepts `sessionId` from URL params
- [ ] Form displays with name input field
- [ ] "Join" button adds participant to Firebase session
- [ ] Participant is created with correct structure: `{ name, role: 'participant', isHandRaised: false }`
- [ ] User is redirected to `/meeting/[sessionId]` after join
- [ ] Error handling: session not found (404-style message)
- [ ] Error handling: join fails (network/DB errors)
- [ ] Form validation: name is required and non-empty
- [ ] Loading state shown while joining
- [ ] Session ID displayed for user reference/confirmation
- [ ] Page is responsive and mobile-friendly

---

## Implementation Details

### Page: `app/join/[sessionId]/page.tsx`

**Structure**:
1. Accept `sessionId` from route params
2. Use `useSession()` to check if session exists
3. Use `useAuth()` to get current user ID
4. Set up local state for name input
5. Join handler that:
   - Validates name
   - Calls `joinSession()` to add participant to Firebase
   - Redirects to `/meeting/[sessionId]`
6. Render form with loading/error states

**Implementation**:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { useSession } from '@/app/hooks/useSession'
import { joinSession } from '@/lib/session'

interface PageProps {
  params: {
    sessionId: string
  }
}

export default function JoinPage({ params }: PageProps) {
  const router = useRouter()
  const { sessionId } = params
  const { userId, isLoading: authLoading } = useAuth()
  const { session, isLoading: sessionLoading, error: sessionError } = useSession(sessionId)

  const [name, setName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (!userId) {
      setError('Authentication failed. Please refresh the page.')
      return
    }

    if (!session) {
      setError('Session not found. Please check the link.')
      return
    }

    // Check if session is still accepting participants
    if (session.status === 'finished') {
      setError('This meeting has ended.')
      return
    }

    try {
      setIsJoining(true)
      await joinSession({
        sessionId,
        userId,
        participantName: name
      })

      // Redirect to meeting page
      router.push(`/meeting/${sessionId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session')
      setIsJoining(false)
    }
  }

  // Loading state: checking auth and session
  if (authLoading || sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  // Error state: session not found
  if (sessionError || !session) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Not Found</h1>
          <p className="text-gray-600 mb-6">
            The session you're trying to join doesn't exist or has expired.
          </p>
          <a
            href="/"
            className="block text-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Create a New Session
          </a>
        </div>
      </main>
    )
  }

  // Error state: session finished
  if (session.status === 'finished') {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Meeting Ended</h1>
          <p className="text-gray-600 mb-6">
            This meeting has already ended. You can't join anymore.
          </p>
          <a
            href="/"
            className="block text-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Start a New Meeting
          </a>
        </div>
      </main>
    )
  }

  // Normal form state
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tick-Talk</h1>
        <p className="text-gray-600 mb-8">Join a speaking meeting</p>

        {/* Session Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-xs text-gray-600 mb-1">Session ID:</p>
          <p className="text-lg font-mono font-semibold text-gray-900 break-all">{sessionId}</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isJoining}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              required
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Join Button */}
          <button
            type="submit"
            disabled={isJoining || !name.trim()}
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
          >
            {isJoining ? 'Joining...' : 'Join Session'}
          </button>
        </form>

        {/* Info */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            You'll enter the meeting as soon as you provide your name.
          </p>
        </div>
      </div>
    </main>
  )
}
```

---

### Helper Function: `joinSession()`

**File**: `lib/session.ts`

Must implement or enhance this function:

```ts
import { ref, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Participant } from '@/lib/session'

interface JoinSessionInput {
  sessionId: string
  userId: string
  participantName: string
}

export async function joinSession(input: JoinSessionInput): Promise<void> {
  try {
    const participantRef = ref(
      db,
      `sessions/${input.sessionId}/participants/${input.userId}`
    )

    const participant: Participant = {
      name: input.participantName,
      role: 'participant',
      isHandRaised: false
    }

    await set(participantRef, participant)
  } catch (error) {
    throw new Error(`Failed to join session: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
```

---

## UI/UX Details

### Form Elements

| Element | Type | Details |
|---------|------|---------|
| Session ID Display | Text (read-only) | Shows in blue box, monospace, break-all on mobile |
| Name Input | Text | Placeholder: "Enter your name", required, auto-focus |
| Join Button | Submit | Disabled during join and if name empty |

### States

**Loading**:
- Page shows "Loading..." spinner
- No form visible

**Session Not Found**:
- Error message displayed
- Link to home page to create new session
- No input form

**Session Finished**:
- Different error message
- Link to home page to start new meeting
- No input form

**Idle**:
- Form fully interactive
- Name field auto-focused
- Join button enabled if name not empty

**Joining**:
- Form fields disabled
- Button shows "Joining..."
- No error message

**Error**:
- Fields re-enabled
- Error message displayed in red box
- Button text returns to "Join Session"

**Success**:
- User redirected to `/meeting/[sessionId]`

### Responsive Design

- Mobile (< 640px): Full-width form, session ID wraps, smaller text
- Tablet/Desktop: Centered form, max-width 400px

### Styling (Tailwind)

- Gradient background: `from-blue-50 to-indigo-100` (normal), `from-red-50 to-orange-100` (error)
- Card: White background, shadow, rounded corners
- Session ID: Blue background box, monospace font
- Button: Indigo primary, hover state, disabled state
- Input: Gray border, indigo focus ring
- Error: Red background and text

---

## Data Flow

```
User receives join link: /join/[sessionId]
        ↓
Page mounts, loads auth + session
        ↓
If session not found:
  → Show error → Link to home
        ↓ (else)
If session finished:
  → Show error → Link to home
        ↓ (else)
User enters name and clicks "Join"
        ↓
Validate inputs (name required)
        ↓
Call joinSession(sessionId, userId, participantName)
        ↓
joinSession writes to Firebase:
  sessions/{sessionId}/participants/{userId} = {
    name: participantName,
    role: 'participant',
    isHandRaised: false
  }
        ↓
Return
        ↓
Router pushes to /meeting/{sessionId}
        ↓
Meeting page loads and subscribes to session
```

---

## Error Handling

| Error | Cause | User Message | Action |
|-------|-------|--------------|--------|
| Session not found | Invalid/expired link | "Session not found" | Show error page, link to home |
| Session finished | Meeting already ended | "This meeting has ended" | Show error page, link to home |
| Empty name | User didn't enter name | "Name is required" | Disable button, show message |
| Auth not loaded | `userId` is null | "Authentication failed" | Show message, suggest refresh |
| Firebase write fails | Network error, DB unavailable | "Failed to join session" | Re-enable form, show message |

---

## Route Configuration

**File**: `app/join/[sessionId]/page.tsx`

- Route: `/join/[sessionId]`
- Dynamic segment: `sessionId` (string)
- Can come from:
  - Email/message with link: `https://Tick-Talk.vercel.app/join/abc123`
  - QR code pointing to same URL
  - Manually typed if user knows ID

---

## Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `app/join/[sessionId]/page.tsx` | Create | New join page with dynamic route |
| `lib/session.ts` | Enhance | Implement `joinSession()` function |

---

## Related Files

These should already exist from previous tasks:
- `app/hooks/useAuth.ts` — Provides user authentication
- `app/hooks/useSession.ts` — Provides session data
- `lib/firebase.ts` — Firebase initialization
- `lib/auth.ts` — Auth helpers

---

## Testing Strategy

### Manual Testing

1. **Happy Path**:
   - Navigate to `/join/[sessionId]` where sessionId is from a real session
   - Enter name
   - Click "Join"
   - Should redirect to `/meeting/[sessionId]`
   - Should appear in participant list in Firebase

2. **Invalid Session ID**:
   - Navigate to `/join/invalid-id-xyz`
   - Should show "Session Not Found" error
   - Should show link to home page

3. **Finished Session**:
   - Create session, set `status: "finished"` in Firebase Console
   - Try to join
   - Should show "Meeting Ended" error

4. **Validation**:
   - Try clicking "Join" without name
   - Button should stay disabled
   - No error message (just disabled state)

5. **Real-time Participation**:
   - Have two browsers open
   - One creates session (home page)
   - Copy link to other browser
   - Other browser joins session
   - First browser should see new participant appear in real-time

### Firebase Console Verification

1. Create a session via home page (gets sessionId)
2. Navigate to `/join/[sessionId]` in another browser/incognito
3. Join with a name
4. In Firebase Console, verify:
   - New entry in `sessions/{sessionId}/participants/{userId}`
   - Correct structure: `{ name, role: 'participant', isHandRaised: false }`
   - `userId` matches authenticated user

---

## Completion Checklist

- [ ] Join page route created at `app/join/[sessionId]/page.tsx`
- [ ] Page loads and checks session existence
- [ ] Form validation prevents empty names
- [ ] `joinSession()` writes correct participant structure to Firebase
- [ ] Redirect to meeting page works after join
- [ ] Loading state shown while auth/session loading
- [ ] Error states (not found, finished) display properly
- [ ] Session ID displayed for user confirmation
- [ ] Mobile layout is responsive
- [ ] Firebase writes verified in console
- [ ] No console errors
- [ ] Code reviewed for accessibility
- [ ] Update `tasks.md` with ✅ status
