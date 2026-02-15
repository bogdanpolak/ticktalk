# REQ-0005: Home Page — Create Session Flow

**Status**: ⬜ Not Started  
**Priority**: High (MVP Feature)  
**Dependencies**: REQ-0001, REQ-0002, REQ-0003, REQ-0004

---

## Overview

Implement the home page (`app/page.tsx`) where users can:
1. Enter their name
2. Select slot duration (default: 2 minutes)
3. Create a new session in Firebase
4. Receive a shareable session link
5. Redirect to the meeting page

This is the primary entry point for hosting a new meeting.

---

## Acceptance Criteria

- [ ] Home page renders form with name input
- [ ] Form has slot duration selector (dropdown or buttons) with default 2 minutes
- [ ] "Create Session" button creates session in Firebase and redirects
- [ ] Session is created with correct structure: `hostId`, `slotDurationSeconds`, `status: "lobby"`, etc.
- [ ] Generated session link can be copied to clipboard or displayed
- [ ] Loading state shown while session is being created
- [ ] Error handling if session creation fails
- [ ] Form validation: name is required and non-empty
- [ ] Page is responsive and mobile-friendly
- [ ] Session ID is URL-safe (Firebase keys are safe by default)

---

## Implementation Details

### Page: `app/page.tsx`

**Structure**:
1. Use `useAuth()` to get current user ID
2. Set up local state for form inputs (name, duration)
3. Session creation handler that:
   - Validates inputs
   - Creates session in Firebase via `createSession()` from `lib/session.ts`
   - Redirects to `/meeting/[sessionId]`
4. Render form with loading/error states

**Implementation**:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { createSession } from '@/lib/session'

const DURATION_OPTIONS = [
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
  { label: '3 minutes', value: 180 },
  { label: '5 minutes', value: 300 }
]

export default function HomePage() {
  const router = useRouter()
  const { userId, isLoading: authLoading } = useAuth()

  const [name, setName] = useState('')
  const [duration, setDuration] = useState(120) // Default: 2 minutes
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateSession = async (e: React.FormEvent) => {
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

    try {
      setIsCreating(true)
      const sessionId = await createSession({
        hostId: userId,
        hostName: name,
        slotDurationSeconds: duration
      })

      // Redirect to meeting page
      router.push(`/meeting/${sessionId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      setIsCreating(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Initializing...</p>
      </div>
    )
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">TickTalk</h1>
        <p className="text-gray-600 mb-8">Start a speaking meeting</p>

        <form onSubmit={handleCreateSession} className="space-y-6">
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
              disabled={isCreating}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Duration Selector */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Speaking Time Per Person
            </label>
            <select
              id="duration"
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              disabled={isCreating}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating || !name.trim()}
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create Session'}
          </button>
        </form>

        {/* Info */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            You'll receive a link to share with participants after creation.
          </p>
        </div>
      </div>
    </main>
  )
}
```

---

### Helper Function: `createSession()`

**File**: `lib/session.ts`

Must implement or enhance this function:

```ts
import { ref, push, set } from 'firebase/database'
import { db } from '@/lib/firebase'
import { Session, Participant } from '@/lib/session'

interface CreateSessionInput {
  hostId: string
  hostName: string
  slotDurationSeconds: number
}

export async function createSession(input: CreateSessionInput): Promise<string> {
  try {
    const sessionsRef = ref(db, 'sessions')
    const newSessionRef = push(sessionsRef)
    const sessionId = newSessionRef.key

    if (!sessionId) {
      throw new Error('Failed to generate session ID')
    }

    const hostParticipant: Participant = {
      name: input.hostName,
      role: 'host',
      isHandRaised: false
    }

    const session: Session = {
      hostId: input.hostId,
      slotDurationSeconds: input.slotDurationSeconds,
      status: 'lobby',
      activeSpeakerId: null,
      slotEndsAt: null,
      spokenUserIds: [],
      participants: {
        [input.hostId]: hostParticipant
      }
    }

    await set(newSessionRef, session)
    return sessionId
  } catch (error) {
    throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
```

---

## UI/UX Details

### Form Elements

| Element | Type | Details |
|---------|------|---------|
| Name Input | Text | Placeholder: "Enter your name", required |
| Duration Selector | Select Dropdown | Default: 120s (2 min), options: 60/120/180/300s |
| Create Button | Submit | Disabled during creation and if name empty |

### States

**Idle**:
- Form fully interactive
- All fields editable
- Button enabled

**Loading**:
- Form fields disabled
- Button shows "Creating..."
- No error message

**Error**:
- Fields re-enabled
- Error message displayed in red box
- Button text returns to "Create Session"

**Success**:
- User redirected to `/meeting/[sessionId]`

### Responsive Design

- Mobile (< 640px): Full-width form, padding adjusted
- Tablet/Desktop: Centered form, max-width 400px

### Styling (Tailwind)

- Gradient background: `from-blue-50 to-indigo-100`
- Card: White background, shadow, rounded corners
- Button: Indigo primary, hover state, disabled state
- Input: Gray border, indigo focus ring
- Error: Red background and text

---

## Data Flow

```
User enters name and duration
        ↓
User clicks "Create Session"
        ↓
Validate inputs (name required)
        ↓
Call createSession(hostId, hostName, slotDurationSeconds)
        ↓
createSession writes to Firebase:
  sessions/{sessionId} = {
    hostId,
    slotDurationSeconds,
    status: 'lobby',
    activeSpeakerId: null,
    slotEndsAt: null,
    spokenUserIds: [],
    participants: { hostId: { name, role: 'host', isHandRaised: false } }
  }
        ↓
Return sessionId
        ↓
Router pushes to /meeting/{sessionId}
        ↓
Meeting page loads and subscribes to session
```

---

## Error Handling

| Error | Cause | User Message |
|-------|-------|--------------|
| Empty name | User didn't enter name | "Name is required" |
| Auth not loaded | `userId` is null | "Authentication failed. Please refresh the page." |
| Firebase write fails | Network error, DB unavailable | "Failed to create session" |
| Bad session ID | `push()` returned null | "Failed to generate session ID" |

---

## Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `app/page.tsx` | Modify | Update from placeholder to full implementation |
| `lib/session.ts` | Enhance | Implement `createSession()` function |

---

## Testing Strategy

### Manual Testing

1. **Happy Path**:
   - Enter name, keep default duration
   - Click "Create Session"
   - Should redirect to `/meeting/[sessionId]`

2. **With Custom Duration**:
   - Select 5-minute duration
   - Verify session created with `slotDurationSeconds: 300`

3. **Validation**:
   - Try clicking "Create" without name
   - Button should stay disabled
   - No error message (just disabled state)

4. **Error**:
   - Disconnect network (DevTools → Offline)
   - Try creating session
   - Should show error message
   - Reconnect and retry

5. **Responsive**:
   - Test on mobile (DevTools)
   - Form should be readable and usable

### Firebase Console Verification

1. Go to Firebase Console → Realtime Database
2. After creating session, verify:
   - New entry in `sessions/{sessionId}`
   - All required fields present
   - `hostId` matches authenticated user
   - `status: "lobby"`
   - `participants[hostId]` has correct structure

---

## Completion Checklist

- [ ] Home page form renders correctly
- [ ] Form validation prevents empty names
- [ ] `createSession()` writes correct structure to Firebase
- [ ] Session ID is returned and redirect works
- [ ] Loading state shown during creation
- [ ] Error messages display properly
- [ ] Mobile layout is responsive
- [ ] Firebase writes verified in console
- [ ] No console errors
- [ ] Code reviewed for accessibility
- [ ] Update `tasks.md` with ✅ status
