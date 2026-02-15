# REQ-0011: Speaker Selection with Transaction Logic

**Status**: ⬜ Not Started  
**Priority**: High (MVP Feature)  
**Dependencies**: REQ-0007, REQ-0008

---

## Overview

Implement the `SpeakerSelector` component that allows the active speaker (or the host for the first speaker) to select the next participant to speak. The selection uses a Firebase transaction to prevent race conditions when multiple users attempt simultaneous selections.

The component displays a list of eligible participants (those who haven't spoken in the current round), with visual indicators for hand-raised participants. Selecting a speaker triggers `selectNextSpeaker()` which atomically updates the session state.

---

## Acceptance Criteria

- [ ] Component: `components/SpeakerSelector.tsx` created
- [ ] Displays a list of eligible participants who haven't spoken yet
- [ ] Eligible list excludes participants already in `spokenUserIds`
- [ ] Hand-raised participants (✋) are visually highlighted and sorted to the top
- [ ] Already-spoken participants are shown as disabled/greyed with ✅ indicator
- [ ] Clicking a participant triggers `selectNextSpeaker()` Firebase transaction
- [ ] Only the current speaker or the host (when no speaker is active) can select
- [ ] Loading state while selection is processing
- [ ] Error handling if transaction fails
- [ ] After selection, the speaker selector is hidden (new speaker is now active)
- [ ] Component handles the round-reset scenario (all have spoken → `spokenUserIds` resets)
- [ ] Design system tokens applied (dark mode, spacing, typography)
- [ ] Mobile-responsive layout
- [ ] Wire component into `ActiveMeetingView` in the meeting page

---

## Implementation Details

### Component: `components/SpeakerSelector.tsx`

**Props**:

```tsx
interface SpeakerSelectorProps {
  sessionId: string
  participants: Record<string, Participant>
  spokenUserIds: string[]
  currentUserId: string | null
  activeSpeakerId: string | null
  isHost: boolean
}
```

**Implementation**:

```tsx
'use client'

import { useState } from 'react'
import { selectNextSpeaker } from '@/lib/session'
import type { Participant } from '@/lib/session'

interface SpeakerSelectorProps {
  sessionId: string
  participants: Record<string, Participant>
  spokenUserIds: string[]
  currentUserId: string | null
  activeSpeakerId: string | null
  isHost: boolean
}

interface CandidateEntry {
  userId: string
  name: string
  isHandRaised: boolean
  hasSpoken: boolean
}

export function SpeakerSelector({
  sessionId,
  participants,
  spokenUserIds,
  currentUserId,
  activeSpeakerId,
  isHost
}: SpeakerSelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine if current user can select
  const isCurrentSpeaker = currentUserId === activeSpeakerId
  const noActiveSpeaker = activeSpeakerId === null
  const canSelect = isCurrentSpeaker || (isHost && noActiveSpeaker)

  // If user can't select, don't render
  if (!canSelect) return null

  // Build candidate list
  const candidates: CandidateEntry[] = Object.entries(participants)
    .filter(([id]) => id !== currentUserId) // Exclude self
    .map(([userId, participant]) => ({
      userId,
      name: participant.name,
      isHandRaised: participant.isHandRaised,
      hasSpoken: spokenUserIds.includes(userId)
    }))
    .sort((a, b) => {
      // Hand raised first, then not spoken, then spoken
      if (a.isHandRaised && !b.isHandRaised) return -1
      if (!a.isHandRaised && b.isHandRaised) return 1
      if (!a.hasSpoken && b.hasSpoken) return -1
      if (a.hasSpoken && !b.hasSpoken) return 1
      return 0
    })

  const eligibleCount = candidates.filter(c => !c.hasSpoken).length

  const handleSelect = async (nextSpeakerId: string) => {
    setError(null)
    setIsSelecting(true)

    try {
      await selectNextSpeaker(sessionId, nextSpeakerId)
      // UI will update via real-time subscription when activeSpeakerId changes
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select speaker')
      setIsSelecting(false)
    }
  }

  return (
    <div className="bg-[var(--color-surface-elevated)] rounded-lg p-6 border border-[var(--color-border)]">
      <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-1">
        Select Next Speaker
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        {eligibleCount} participant{eligibleCount !== 1 ? 's' : ''} remaining in this round
      </p>

      {error && (
        <div className="mb-4 p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)] rounded text-[var(--color-error)] text-sm">
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {candidates.map(candidate => {
          const isEligible = !candidate.hasSpoken
          return (
            <li key={candidate.userId}>
              <button
                onClick={() => handleSelect(candidate.userId)}
                disabled={!isEligible || isSelecting}
                className={`
                  w-full flex items-center justify-between py-3 px-4 rounded-lg
                  transition-colors text-left
                  ${isEligible
                    ? 'bg-[var(--color-surface)] hover:bg-[var(--color-surface-subtle)] cursor-pointer'
                    : 'bg-[var(--color-surface)] opacity-50 cursor-not-allowed'
                  }
                  ${candidate.isHandRaised && isEligible
                    ? 'border border-[var(--color-warning)]'
                    : 'border border-transparent'
                  }
                  disabled:opacity-40
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Status indicator */}
                  <span className="text-lg">
                    {candidate.hasSpoken ? '✅' : candidate.isHandRaised ? '✋' : '👤'}
                  </span>

                  {/* Name */}
                  <span className={`font-medium ${
                    isEligible
                      ? 'text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-muted)]'
                  }`}>
                    {candidate.name}
                  </span>
                </div>

                {/* Action hint */}
                {isEligible && !isSelecting && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Tap to select
                  </span>
                )}
                {isEligible && isSelecting && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Selecting...
                  </span>
                )}
                {candidate.hasSpoken && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Already spoken
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {candidates.length === 0 && (
        <p className="text-center text-[var(--color-text-muted)] py-4">
          No other participants in the session
        </p>
      )}
    </div>
  )
}
```

---

### Integration: Wire into `ActiveMeetingView`

Update `ActiveMeetingView` in `app/meeting/[sessionId]/page.tsx`:

```tsx
import { SpeakerSelector } from '@/components/SpeakerSelector'

// Inside ActiveMeetingView, after Timer:
<div className="mt-6">
  <SpeakerSelector
    sessionId={sessionId}
    participants={session.participants}
    spokenUserIds={session.spokenUserIds || []}
    currentUserId={userId}
    activeSpeakerId={session.activeSpeakerId}
    isHost={isHost}
  />
</div>
```

---

## Transaction Logic (from `lib/session.ts`)

The `selectNextSpeaker()` function already exists and uses `runTransaction` for concurrency safety:

```ts
await runTransaction(sessionRef, (session) => {
  if (!session) return session;
  
  // Validate: nextSpeakerId not in spokenUserIds
  if (session.spokenUserIds?.includes(nextSpeakerId)) return;
  
  session.activeSpeakerId = nextSpeakerId;
  session.slotEndsAt = Date.now() + session.slotDurationSeconds * 1000;
  session.spokenUserIds = [...(session.spokenUserIds || []), nextSpeakerId];
  
  // Reset if all have spoken
  const participantIds = Object.keys(session.participants);
  if (session.spokenUserIds.length >= participantIds.length) {
    session.spokenUserIds = [];
  }
  
  return session;
});
```

Key behaviors:
- **Atomic**: Only one concurrent selection succeeds
- **Validated**: Can't select someone who already spoke this round
- **Auto-reset**: When all participants have spoken, `spokenUserIds` resets to `[]`

---

## Speaker Selection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Meeting starts (status: "active", no active speaker)            │
│                                                                 │
│ Host sees SpeakerSelector → picks first speaker                 │
│   └── selectNextSpeaker() transaction                           │
│       ├── activeSpeakerId = selected                            │
│       ├── slotEndsAt = now + duration                           │
│       └── spokenUserIds = [selected]                            │
│                                                                 │
│ Speaker speaks, timer counts down                               │
│ Speaker clicks "End My Slot" → endCurrentSlot()                 │
│   └── activeSpeakerId = null, slotEndsAt = null                 │
│                                                                 │
│ Speaker sees SpeakerSelector → picks next speaker               │
│   └── selectNextSpeaker() transaction (repeats)                 │
│                                                                 │
│ When all have spoken → spokenUserIds resets to []               │
│ New round begins                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
ActiveMeetingView
├── ActiveSpeaker (REQ-0008)
├── Timer (REQ-0009)
└── SpeakerSelector
    ├── Header ("Select Next Speaker")
    ├── Round progress ("X participants remaining")
    ├── Error message (if transaction fails)
    └── Candidate list
        ├── ✋ Hand-raised candidates (sorted first, highlighted border)
        ├── 👤 Eligible candidates (clickable)
        └── ✅ Already-spoken candidates (disabled, greyed)
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `components/SpeakerSelector.tsx` | Create | Speaker selection component |
| `app/meeting/[sessionId]/page.tsx` | Modify | Wire SpeakerSelector into ActiveMeetingView |

---

## Dependencies on Existing Code

| Module | Usage |
|--------|-------|
| `selectNextSpeaker(sessionId, nextSpeakerId)` | Firebase transaction for speaker selection |
| `Session`, `Participant` types | Type definitions from `lib/session.ts` |
| `useSession` | Real-time session updates (via parent) |

---

## Design Specifications

| Element | Design Token | Value |
|---------|-------------|-------|
| Container | `--color-surface-elevated` | `#1E293B` |
| Candidate row bg | `--color-surface` | `#0F172A` |
| Candidate hover | `--color-surface-subtle` | `#334155` |
| Hand-raised border | `--color-warning` | `#F59E0B` |
| Eligible name text | `--color-text-primary` | `#F8FAFC` |
| Spoken name text | `--color-text-muted` | `#94A3B8` |
| "Tap to select" hint | `--color-text-muted` | `#94A3B8`, 12px |
| Spacing between items | s | 8px |
| Item padding | s/m | 12px vertical, 16px horizontal |

---

## Edge Cases

| Case | Handling |
|------|----------|
| Two users select same speaker simultaneously | Transaction ensures only first succeeds; second gets no-op |
| Selected speaker already spoke | Transaction validates against `spokenUserIds`, aborts if duplicate |
| All participants have spoken | `spokenUserIds` resets to `[]`, new round begins — all become eligible |
| Only one other participant | Selector still shows them; auto-select UX could be added later |
| Speaker selects themselves | Filtered out — self is excluded from candidate list |
| Participant leaves mid-round | Their entry remains in `spokenUserIds` but they won't appear in participants |

---

## Testing Notes

- Verify only the current speaker and host (when no speaker) see the selector
- Verify hand-raised participants appear at the top of the list
- Verify already-spoken participants are disabled and greyed
- Verify clicking a candidate triggers the transaction and updates the session
- Verify concurrent selections — only one succeeds
- Verify round reset when all participants have spoken
- Verify selector disappears once a new speaker is selected
- Verify error handling when transaction fails
- Verify mobile responsiveness of the candidate list
