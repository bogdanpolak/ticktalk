# REQ-0008: Active Speaker Display Component

**Status**: ✅ Completed  
**Priority**: High (MVP Feature)  
**Dependencies**: REQ-0007

---

## Overview

Implement the `ActiveSpeaker` component that prominently displays the currently speaking participant during an active meeting. This is the primary visual focus of the meeting page — a large, highlighted card showing who is speaking, with contextual controls for the active speaker and the host.

The component integrates into the `ActiveMeetingView` created in REQ-0007 and works alongside the Timer (REQ-0009) and SpeakerSelector (REQ-0011).

---

## Acceptance Criteria

- [ ] Component: `components/ActiveSpeaker.tsx` created
- [ ] Displays the active speaker's name prominently (large, highlighted)
- [ ] Shows a 🎤 microphone indicator for the current speaker
- [ ] Visual styling: elevated card with brand accent border/highlight
- [ ] When no speaker is active, shows "No active speaker" placeholder with prompt
- [ ] Active speaker sees an "End My Slot" button within the component
- [ ] Clicking "End My Slot" calls `endCurrentSlot()` and clears active speaker
- [ ] Host sees an "End Meeting" button (only when no speaker is active)
- [ ] Clicking "End Meeting" calls `endMeeting()` to finish the session
- [ ] Loading/disabled state while "End My Slot" or "End Meeting" is processing
- [ ] Design system tokens applied (dark mode, typography, spacing)
- [ ] Component is responsive on mobile
- [ ] Update `ActiveMeetingView` in meeting page to wire in this component

---

## Implementation Details

### Component: `components/ActiveSpeaker.tsx`

**Props**:

```tsx
interface ActiveSpeakerProps {
  activeSpeakerId: string | null
  activeSpeakerName: string | null
  currentUserId: string | null
  isHost: boolean
  sessionId: string
  sessionStatus: 'lobby' | 'active' | 'finished'
}
```

**Implementation**:

```tsx
'use client'

import { useState } from 'react'
import { endCurrentSlot, endMeeting } from '@/lib/session'

export function ActiveSpeaker({
  activeSpeakerId,
  activeSpeakerName,
  currentUserId,
  isHost,
  sessionId,
  sessionStatus
}: ActiveSpeakerProps) {
  const [isEnding, setIsEnding] = useState(false)
  const isCurrentSpeaker = currentUserId === activeSpeakerId
  const hasSpeaker = activeSpeakerId !== null

  const handleEndSlot = async () => {
    setIsEnding(true)
    try {
      await endCurrentSlot(sessionId)
    } catch (err) {
      console.error('Failed to end slot:', err)
    } finally {
      setIsEnding(false)
    }
  }

  const handleEndMeeting = async () => {
    setIsEnding(true)
    try {
      await endMeeting(sessionId)
    } catch (err) {
      console.error('Failed to end meeting:', err)
      setIsEnding(false)
    }
  }

  if (!hasSpeaker) {
    return (
      <div className="bg-[var(--color-surface-elevated)] rounded-lg p-8 border border-[var(--color-border)] text-center">
        <p className="text-[var(--color-text-muted)] text-lg mb-2">
          No active speaker
        </p>
        <p className="text-[var(--color-text-secondary)] text-sm">
          {isHost
            ? 'Select the first speaker to begin'
            : 'Waiting for speaker selection...'}
        </p>

        {/* Host can end meeting when no one is speaking */}
        {isHost && sessionStatus === 'active' && (
          <button
            onClick={handleEndMeeting}
            disabled={isEnding}
            className="mt-6 px-6 py-2 bg-[var(--color-error)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isEnding ? 'Ending...' : 'End Meeting'}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-surface-elevated)] rounded-lg p-8 border-2 border-[var(--color-brand)] text-center">
      {/* Speaker indicator */}
      <div className="text-4xl mb-4">🎤</div>

      {/* Speaker name */}
      <h2 className="text-[32px] font-medium leading-[1.3] text-[var(--color-text-primary)] mb-2">
        {activeSpeakerName}
      </h2>

      <p className="text-[var(--color-brand)] text-sm font-medium mb-6">
        Currently Speaking
      </p>

      {/* Timer will be placed here by parent — REQ-0009 */}

      {/* Controls for active speaker */}
      {isCurrentSpeaker && (
        <button
          onClick={handleEndSlot}
          disabled={isEnding}
          className="mt-4 px-8 py-3 bg-[var(--color-warning)] text-[var(--color-surface)] font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isEnding ? 'Ending...' : 'End My Slot'}
        </button>
      )}
    </div>
  )
}
```

---

### Update: `app/meeting/[sessionId]/page.tsx` — Wire `ActiveMeetingView`

Replace the placeholder `ActiveMeetingView` with actual component usage:

```tsx
import { ActiveSpeaker } from '@/components/ActiveSpeaker'

function ActiveMeetingView({
  session,
  sessionId,
  userId
}: {
  session: Session
  sessionId: string
  userId: string | null
}) {
  const isHost = userId === session.hostId
  const activeSpeakerName = session.activeSpeakerId
    ? session.participants[session.activeSpeakerId]?.name ?? 'Unknown'
    : null

  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text-primary)] p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-lg font-medium text-[var(--color-text-secondary)] mb-6">
          Tick-Talk Meeting
        </h1>

        {/* Active Speaker Display */}
        <ActiveSpeaker
          activeSpeakerId={session.activeSpeakerId}
          activeSpeakerName={activeSpeakerName}
          currentUserId={userId}
          isHost={isHost}
          sessionId={sessionId}
          sessionStatus={session.status}
        />

        {/* Timer — REQ-0009 */}
        {/* Participant List — REQ-0013 */}
        {/* Speaker Selector — REQ-0011 */}
      </div>
    </main>
  )
}
```

---

## Component Hierarchy

```
ActiveMeetingView (meeting page)
├── ActiveSpeaker
│   ├── No-speaker placeholder (+ End Meeting for host)
│   └── Speaker card
│       ├── 🎤 Indicator
│       ├── Speaker name (large, highlighted)
│       ├── "Currently Speaking" label
│       └── "End My Slot" button (speaker only)
├── Timer (REQ-0009 — future)
├── ParticipantList (REQ-0013 — future)
└── SpeakerSelector (REQ-0011 — future)
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `components/ActiveSpeaker.tsx` | Create | Active speaker display component |
| `app/meeting/[sessionId]/page.tsx` | Modify | Wire ActiveSpeaker into ActiveMeetingView |

---

## Dependencies on Existing Code

| Module | Usage |
|--------|-------|
| `endCurrentSlot(sessionId)` | End the current speaker's slot |
| `endMeeting(sessionId)` | End the entire meeting |
| `Session`, `Participant` types | Type definitions from `lib/session.ts` |

---

## Design Specifications

| Element | Design Token | Value |
|---------|-------------|-------|
| Speaker card background | `--color-surface-elevated` | `#1E293B` |
| Active border | `--color-brand` | `#5B8DEF` |
| Speaker name | Display or Headline-Large | 32px, weight 500 |
| "Currently Speaking" | `--color-brand` | `#5B8DEF`, 14px |
| "End My Slot" button | `--color-warning` bg | `#F59E0B` |
| "End Meeting" button | `--color-error` bg | `#EF4444` |
| No-speaker text | `--color-text-muted` | `#94A3B8` |

---

## Testing Notes

- Verify speaker name updates in real-time when `activeSpeakerId` changes
- Verify "End My Slot" button only appears for the active speaker
- Verify "End Meeting" button only appears for the host when no speaker is active
- Verify loading states on button clicks
- Verify transition from no-speaker to active-speaker state
- Verify component renders correctly when speaker disconnects (name fallback)
- Verify mobile layout responsiveness
