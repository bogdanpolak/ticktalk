# REQ-0007: Basic Meeting Page with Lobby View

**Status**: ✅ Completed  
**Priority**: High (MVP Feature)  
**Dependencies**: REQ-0001, REQ-0002, REQ-0003, REQ-0004, REQ-0005, REQ-0006

---

## Overview

Implement the meeting page (`app/meeting/[sessionId]/page.tsx`) — the central hub of the Tick-Talk application. This page renders conditionally based on the session status:

1. **Lobby** (`status: "lobby"`) — waiting room before the meeting starts
2. **Active** (`status: "active"`) — live meeting with speaker, timer, controls (placeholder in this task)
3. **Finished** (`status: "finished"`) — post-meeting summary view

This task focuses on the **lobby view** and the **page shell** with conditional rendering. Active meeting components will be wired in subsequent tasks (REQ-0008 through REQ-0012).

---

## Acceptance Criteria

- [ ] Page route: `app/meeting/[sessionId]/page.tsx` accepts `sessionId` from URL params
- [ ] Uses `useSession(sessionId)` hook for real-time session data
- [ ] Uses `useAuth()` hook for current user identity
- [ ] Conditional rendering based on `session.status`: lobby, active, finished
- [ ] **Lobby view** displays:
  - [ ] Session title/heading
  - [ ] Real-time participant list (updates as people join)
  - [ ] Shareable join link (`/join/[sessionId]`) with copy-to-clipboard button
  - [ ] Slot duration display (e.g., "2 min per speaker")
  - [ ] Host sees "Start Meeting" button
  - [ ] Non-host participants see "Waiting for host to start..." message
- [ ] **Finished view** displays:
  - [ ] "Meeting Ended" heading
  - [ ] Summary list of all participants
  - [ ] Link back to home page to create a new session
- [ ] **Active view** — placeholder component rendering session status (will be expanded in later tasks)
- [ ] Loading state while session data is being fetched
- [ ] Error state if session doesn't exist or fails to load
- [ ] Redirect or error if user is not a participant in the session
- [ ] Design system tokens applied (dark mode, spacing, typography)
- [ ] Mobile-responsive layout

---

## Implementation Details

### Page: `app/meeting/[sessionId]/page.tsx`

**Structure**:
1. Accept `sessionId` from route params
2. Use `useSession(sessionId)` for real-time session data
3. Use `useAuth()` for current user identity
4. Conditional render based on `session.status`
5. Extract participant info from session data

**Implementation**:

```tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/app/hooks/useAuth'
import { useSession } from '@/app/hooks/useSession'
import { startMeeting } from '@/lib/session'
import type { Session, Participant } from '@/lib/session'

export default function MeetingPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const { userId, isLoading: authLoading } = useAuth()
  const { session, isLoading: sessionLoading, error: sessionError } = useSession(sessionId)

  if (authLoading || sessionLoading) {
    return <LoadingView />
  }

  if (sessionError || !session) {
    return <ErrorView error={sessionError || 'Session not found'} />
  }

  switch (session.status) {
    case 'lobby':
      return (
        <LobbyView
          session={session}
          sessionId={sessionId}
          userId={userId}
        />
      )
    case 'active':
      return (
        <ActiveMeetingView
          session={session}
          sessionId={sessionId}
          userId={userId}
        />
      )
    case 'finished':
      return <FinishedView session={session} />
    default:
      return <ErrorView error="Unknown session status" />
  }
}
```

### Component: `LobbyView`

**Renders**:
- Heading: "Meeting Lobby"
- Participant list (real-time from `session.participants`)
- Join link with copy button
- Slot duration info
- "Start Meeting" button (host only)

```tsx
function LobbyView({
  session,
  sessionId,
  userId
}: {
  session: Session
  sessionId: string
  userId: string | null
}) {
  const [isCopied, setIsCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const isHost = userId === session.hostId

  const joinLink = `${window.location.origin}/join/${sessionId}`
  const participants = Object.entries(session.participants)

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(joinLink)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleStartMeeting = async () => {
    setIsStarting(true)
    try {
      await startMeeting(sessionId)
    } catch (err) {
      setIsStarting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-[32px] font-medium leading-[1.3] mb-6">Meeting Lobby</h1>

        {/* Session Info */}
        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-6 mb-6 border border-[var(--color-border)]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-1">
            Slot Duration
          </p>
          <p className="text-lg font-medium">
            {Math.floor(session.slotDurationSeconds / 60)} min per speaker
          </p>
        </div>

        {/* Share Link */}
        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-6 mb-6 border border-[var(--color-border)]">
          <p className="text-[var(--color-text-secondary)] text-sm mb-2">Share this link to invite participants:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-[var(--color-surface)] px-3 py-2 rounded text-sm font-mono break-all">
              {joinLink}
            </code>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-[var(--color-brand)] text-white rounded hover:bg-[var(--color-brand-hover)] transition-colors whitespace-nowrap"
            >
              {isCopied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-[var(--color-surface-elevated)] rounded-lg p-6 mb-6 border border-[var(--color-border)]">
          <h2 className="text-lg font-medium mb-4">
            Participants ({participants.length})
          </h2>
          <ul className="space-y-2">
            {participants.map(([id, participant]) => (
              <li
                key={id}
                className="flex items-center gap-2 py-2 px-3 rounded bg-[var(--color-surface)]"
              >
                <span className="text-[var(--color-text-primary)]">
                  {participant.name}
                </span>
                {participant.role === 'host' && (
                  <span className="text-xs bg-[var(--color-brand)] text-white px-2 py-0.5 rounded">
                    Host
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Start Meeting or Waiting */}
        {isHost ? (
          <button
            onClick={handleStartMeeting}
            disabled={isStarting || participants.length < 2}
            className="w-full py-3 bg-[var(--color-success)] text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isStarting ? 'Starting...' : 'Start Meeting'}
          </button>
        ) : (
          <p className="text-center text-[var(--color-text-muted)] py-4">
            Waiting for host to start the meeting...
          </p>
        )}
      </div>
    </main>
  )
}
```

### Component: `FinishedView`

```tsx
function FinishedView({ session }: { session: Session }) {
  const participants = Object.entries(session.participants)

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-4 flex items-center justify-center">
      <div className="max-w-md w-full bg-[var(--color-surface-elevated)] rounded-lg p-8 border border-[var(--color-border)]">
        <h1 className="text-[32px] font-medium leading-[1.3] mb-4">Meeting Ended</h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Thanks for participating! Here's who joined:
        </p>
        <ul className="space-y-2 mb-8">
          {participants.map(([id, participant]) => (
            <li key={id} className="py-2 px-3 rounded bg-[var(--color-surface)]">
              {participant.name}
              {participant.role === 'host' && ' (Host)'}
            </li>
          ))}
        </ul>
        <a
          href="/"
          className="block text-center bg-[var(--color-brand)] text-white font-medium py-3 rounded-lg hover:bg-[var(--color-brand-hover)] transition-colors"
        >
          Start a New Meeting
        </a>
      </div>
    </main>
  )
}
```

### Component: `ActiveMeetingView` (placeholder)

```tsx
function ActiveMeetingView({
  session,
  sessionId,
  userId
}: {
  session: Session
  sessionId: string
  userId: string | null
}) {
  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-4">
      <div className="max-w-2xl mx-auto text-center py-12">
        <h1 className="text-[32px] font-medium leading-[1.3] mb-4">Meeting in Progress</h1>
        <p className="text-[var(--color-text-secondary)]">
          Active meeting view — components will be added in upcoming tasks.
        </p>
      </div>
    </main>
  )
}
```

---

## Component Hierarchy

```
MeetingPage
├── LoadingView
├── ErrorView
├── LobbyView
│   ├── Session info (slot duration)
│   ├── Share link + copy button
│   ├── Participant list (real-time)
│   └── Start Meeting button (host) / Waiting message (participant)
├── ActiveMeetingView (placeholder — expanded in REQ-0008 to REQ-0012)
└── FinishedView
    ├── Participant summary
    └── "Start New Meeting" link
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/meeting/[sessionId]/page.tsx` | Create | Main meeting page with conditional rendering |

---

## Dependencies on Existing Code

| Module | Usage |
|--------|-------|
| `useSession(sessionId)` | Real-time session subscription |
| `useAuth()` | Current user identity |
| `startMeeting(sessionId)` | Change session status to `active` |
| `Session`, `Participant` types | Type definitions from `lib/session.ts` |

---

## Testing Notes

- Verify lobby view updates in real-time when new participants join
- Verify "Start Meeting" button is only visible to host
- Verify "Start Meeting" is disabled with fewer than 2 participants
- Verify copy-to-clipboard works for the join link
- Verify navigation to finished view when session status changes
- Verify error handling for non-existent sessions
- Verify mobile responsiveness
