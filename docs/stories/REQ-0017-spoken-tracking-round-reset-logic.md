# REQ-0017: "Spoken" Tracking and Round Reset Logic

**Status**: 🟨 Requirements Created  
**Priority**: High (MVP Core Logic)  
**Dependencies**: REQ-0011

---

## Overview

Implement robust tracking of which participants have already spoken in the current round and automatic reset logic when all participants have spoken.

This ensures fair speaker selection:
- Only participants who haven't spoken in the current round are eligible for selection
- Once all participants have spoken, the `spokenUserIds` array resets to empty
- UI clearly indicates who has and hasn't spoken via status indicators
- Speaker selection transactions validate against the current `spokenUserIds` state

---

## Acceptance Criteria

- [ ] `spokenUserIds` array is populated whenever a speaker is selected
- [ ] New speaker's ID is added to `spokenUserIds` atomically via transaction
- [ ] Speaker selection validates that `nextSpeakerId` is NOT in `spokenUserIds`
- [ ] Selection is rejected if participant has already spoken
- [ ] When `spokenUserIds.length === participantCount`, round resets to `[]`
- [ ] Reset happens atomically during the next speaker selection
- [ ] UI shows `✅` indicator for participants in `spokenUserIds`
- [ ] `SpeakerSelector` filters out participants already in `spokenUserIds`
- [ ] After round reset, all participants become eligible again
- [ ] Spoken status updates in real-time across all clients
- [ ] Host cannot force skip the spoken-tracking logic
- [ ] Edge case: Host-only sessions work correctly (single participant can re-speak after round ends)

---

## Implementation Details

### Data Model

Session object maintains:

```ts
session: {
  // ... other fields
  spokenUserIds: string[] // participants who have spoken in current round
  participants: {
    [userId]: {
      name: string,
      role: 'host' | 'participant',
      isHandRaised: boolean
    }
  }
}
```

The `spokenUserIds` is reset to `[]` when all participants have had a turn.

---

### Firebase Operations (`lib/session.ts`)

Update `selectNextSpeaker()` to include spoken-tracking and reset logic:

```ts
export async function selectNextSpeaker(
  sessionId: string,
  nextSpeakerId: string
): Promise<void> {
  const db = getDatabase()
  const sessionRef = ref(db, `sessions/${sessionId}`)
  
  await runTransaction(sessionRef, (session) => {
    if (!session) return undefined
    
    // Ensure data structures exist
    const spokenUserIds = session.spokenUserIds || []
    const participants = session.participants || {}
    
    // Validate: nextSpeakerId not already spoken
    if (spokenUserIds.includes(nextSpeakerId)) {
      throw new Error(
        `Participant ${nextSpeakerId} has already spoken this round`
      )
    }
    
    // Validate: nextSpeakerId exists as participant
    if (!participants[nextSpeakerId]) {
      throw new Error(
        `Participant ${nextSpeakerId} not found in session`
      )
    }
    
    // Add to spokenUserIds
    const updatedSpoken = [...spokenUserIds, nextSpeakerId]
    
    // Check if all have spoken
    const participantIds = Object.keys(participants)
    const allHaveSpoken = updatedSpoken.length >= participantIds.length
    
    // Reset if needed
    const finalSpokenUserIds = allHaveSpoken ? [] : updatedSpoken
    
    // Update session
    session.activeSpeakerId = nextSpeakerId
    session.slotEndsAt = Date.now() + session.slotDurationSeconds * 1000
    session.spokenUserIds = finalSpokenUserIds
    
    return session
  })
}
```

Error handling:
- Catch "already spoken" errors and show user-friendly message
- Prevent selection UI from allowing ineligible participant selection
- Log transaction failures for debugging

---

### UI: Speaker Selection (`components/SpeakerSelector.tsx`)

Filter participants to show only eligible candidates:

```tsx
interface SpeakerSelectorProps {
  sessionId: string
  participants: Record<string, Participant>
  spokenUserIds: string[]
  activeSpeakerId: string | null
  currentUserId: string | null
  hostId: string
}

export function SpeakerSelector(props: SpeakerSelectorProps) {
  const {
    sessionId,
    participants,
    spokenUserIds,
    activeSpeakerId,
    currentUserId,
    hostId
  } = props
  
  // Eligible candidates are those NOT in spokenUserIds and NOT currently active
  const eligibleCandidates = Object.entries(participants)
    .filter(([userId, _]) => 
      !spokenUserIds.includes(userId) && userId !== activeSpeakerId
    )
    .map(([userId, participant]) => ({ userId, ...participant }))
    .sort((a, b) => a.name.localeCompare(b.name))
  
  const canSelect = currentUserId === activeSpeakerId || currentUserId === hostId
  
  if (!canSelect) {
    return null
  }
  
  if (eligibleCandidates.length === 0) {
    return (
      <div className="rounded bg-yellow-50 p-4 text-sm text-yellow-800">
        <p className="font-semibold">Round Complete</p>
        <p>All participants have spoken. The next speaker will start a new round.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold">Select Next Speaker</label>
      <div className="grid gap-2 sm:grid-cols-2">
        {eligibleCandidates.map(candidate => (
          <CandidateButton
            key={candidate.userId}
            candidate={candidate}
            onSelect={() => selectNextSpeaker(sessionId, candidate.userId)}
          />
        ))}
      </div>
    </div>
  )
}
```

---

### UI: Participant List (`components/ParticipantList.tsx`)

Show spoken status for each participant:

```tsx
interface ParticipantListProps {
  participants: Record<string, Participant>
  activeSpeakerId: string | null
  spokenUserIds: string[]
  hostId: string
}

// In rendering:
{
  spokenUserIds.includes(userId) && (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
      ✅ Spoke
    </span>
  )
}
```

---

### Integration: Meeting Page

Ensure session data is always passed with `spokenUserIds`:

```tsx
// In app/meeting/[sessionId]/page.tsx
const {
  activeSpeakerId,
  spokenUserIds = [],
  participants,
  hostId,
  status,
  slotDurationSeconds
} = session || {}

// Pass to components
<SpeakerSelector
  spokenUserIds={spokenUserIds}
  participants={participants}
  activeSpeakerId={activeSpeakerId}
  // ...
/>

<ParticipantList
  spokenUserIds={spokenUserIds}
  participants={participants}
  activeSpeakerId={activeSpeakerId}
  hostId={hostId}
/>
```

---

## Edge Cases

| Case | Handling |
|------|----------|
| Only host in session | Host can speak multiple times per round |
| Participant joins during round | Added to `participants` but not automatically adds to `spokenUserIds` (can speak this round) |
| Selection of previously-spoken participant via stale UI | Transaction rejects with error |
| All participants spoken, next selection | Round resets atomically; new speaker starts clean round |
| Participant rejoins after disconnect | Their spoken status is preserved (still marked as spoken) |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/session.ts` | Modify | Update `selectNextSpeaker()` with spoken-tracking and reset logic |
| `components/SpeakerSelector.tsx` | Modify | Filter to eligible candidates only |
| `components/ParticipantList.tsx` | Modify | Add spoken status indicator (`✅`) |
| `app/meeting/[sessionId]/page.tsx` | Verify | Ensure `spokenUserIds` is passed to all relevant components |

---

## Testing Notes

- Verify participants can only speak once per round
- Verify eligible candidate list updates after each selection
- Verify round resets automatically after all have spoken
- Verify "spoke" indicator appears for all in participant list
- Verify stale selection attempts are rejected
- Verify new participants joining mid-round are eligible
- Verify reset works with various participant counts
- Verify edge case: single participant (host) can re-speak after round

---

## Round Reset Behavior Example

```
Initial: 3 participants, spokenUserIds = []
Select Alice   → spokenUserIds = [alice]
Select Bob     → spokenUserIds = [alice, bob]
Select Charlie → spokenUserIds = [] (reset, all have spoken)

Next selection:
Select Bob     → spokenUserIds = [bob] (new round started)
```

---

## Notes

- The spoken-tracking transaction MUST be atomic to prevent concurrent modification issues
- The reset logic triggers during speaker selection, not as a separate operation
- Host cannot override or bypass spoken-tracking
- This logic ensures fairness without requiring a fixed turn order
