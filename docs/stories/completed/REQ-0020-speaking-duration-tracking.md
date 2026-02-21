# REQ-0020: Speaking Duration Tracking in Firebase

**Status**: ✅ Completed  
**Priority**: High (MVP Core Feature)  
**Dependencies**: REQ-0011, REQ-0012

---

## Overview

Implement comprehensive speaking duration tracking in Firebase to record each participant's speaking time across multiple rounds.

The system must track when a speaker's slot starts (`slotStartedAt`), calculate the actual duration when they end their slot, and store detailed history in a `speakingHistory` array with `startTime`, `endTime`, and `durationSeconds`. Additionally, maintain a cumulative `totalSpokeDurationSeconds` counter per participant that never resets, enabling meeting analytics and summary views.

This provides the data foundation for features like speaking time analytics, meeting summaries, and over-time tracking.

---

## Acceptance Criteria

### Firebase Schema Updates

- [ ] Session data model includes `slotStartedAt` field (Unix timestamp in ms)
- [ ] Participant model includes `totalSpokeDurationSeconds` field (number, default 0)
- [ ] Participant model includes `speakingHistory` array with structure:
  ```ts
  speakingHistory: [{
    startTime: number,      // Unix timestamp (ms) when slot started
    endTime: number,        // Unix timestamp (ms) when slot ended
    durationSeconds: number // Calculated speaking duration
  }]
  ```
- [ ] All fields properly initialized when session/participant is created

### Speaker Selection Logic

- [ ] When speaker is selected, `slotStartedAt` is set to `Date.now()`
- [ ] `slotStartedAt` is written atomically with `activeSpeakerId` and `slotEndsAt`
- [ ] Transaction ensures consistent state across all three fields
- [ ] `slotStartedAt` is cleared when speaker ends slot

### End Slot Duration Calculation

- [ ] Calculate actual speaking duration: `durationMs = Date.now() - slotStartedAt`
- [ ] Convert to seconds: `durationSeconds = Math.round(durationMs / 1000)`
- [ ] Store new history entry in participant's `speakingHistory` array
- [ ] Update participant's `totalSpokeDurationSeconds` by adding new duration
- [ ] Handle case where `slotStartedAt` is missing (graceful fallback, log warning)
- [ ] Ensure history entries are appended, not replaced
- [ ] Cumulative total accumulates across all rounds (never resets)

### Data Persistence

- [ ] Speaking history survives browser refresh
- [ ] History entries persist even if participant disconnects
- [ ] Total duration accurately reflects sum of all speaking slots
- [ ] Firebase updates complete before UI transitions to next state
- [ ] Error handling for failed Firebase writes with user feedback

### Integration Requirements

- [ ] `lib/session.ts` exports updated `selectNextSpeaker` function with `slotStartedAt` tracking
- [ ] `lib/session.ts` exports updated `endCurrentSlot` function with duration calculation
- [ ] Session hook (`useSession`) provides access to `slotStartedAt` for debugging/verification
- [ ] No breaking changes to existing function signatures (backward compatible)

---

## Implementation Details

### Updated Session Schema

Extend existing session data model in Firebase:

```ts
// In lib/session.ts or data model documentation

interface Session {
  hostId: string
  slotDurationSeconds: number
  status: 'lobby' | 'active' | 'finished'
  activeSpeakerId: string | null
  slotEndsAt: number | null
  slotStartedAt: number | null          // NEW: timestamp when current speaker started
  spokenUserIds: string[]
  participants: {
    [userId: string]: Participant
  }
}

interface Participant {
  name: string
  role: 'host' | 'participant'
  isHandRaised: boolean
  totalSpokeDurationSeconds: number     // NEW: cumulative speaking time
  speakingHistory: SpeakingHistoryEntry[] // NEW: detailed history
}

interface SpeakingHistoryEntry {
  startTime: number        // Unix timestamp (ms) when slot started
  endTime: number          // Unix timestamp (ms) when slot ended
  durationSeconds: number  // Calculated duration for this slot
}
```

---

### Updated `selectNextSpeaker` Function

Modify `lib/session.ts` to set `slotStartedAt` atomically:

```ts
export async function selectNextSpeaker(
  sessionId: string,
  nextSpeakerId: string
): Promise<void> {
  const sessionRef = ref(db, `sessions/${sessionId}`)
  
  await runTransaction(sessionRef, (session) => {
    if (!session) {
      throw new Error('Session not found')
    }
    
    // Validation: speaker hasn't already spoken in current round
    if (session.spokenUserIds?.includes(nextSpeakerId)) {
      throw new Error('Speaker has already spoken in this round')
    }
    
    const now = Date.now()
    
    // Update session with new speaker
    session.activeSpeakerId = nextSpeakerId
    session.slotStartedAt = now  // NEW: Track start time
    session.slotEndsAt = now + session.slotDurationSeconds * 1000
    session.spokenUserIds = [...(session.spokenUserIds || []), nextSpeakerId]
    
    // Reset round if all participants have spoken
    const participantIds = Object.keys(session.participants)
    if (session.spokenUserIds.length >= participantIds.length) {
      session.spokenUserIds = []
    }
    
    return session
  })
}
```

---

### Updated `endCurrentSlot` Function

Modify `lib/session.ts` to calculate and store speaking duration:

```ts
export async function endCurrentSlot(sessionId: string): Promise<void> {
  const sessionRef = ref(db, `sessions/${sessionId}`)
  const snapshot = await get(sessionRef)
  const session = snapshot.val()
  
  if (!session || !session.activeSpeakerId) {
    throw new Error('No active speaker to end')
  }
  
  const activeSpeakerId = session.activeSpeakerId
  const slotStartedAt = session.slotStartedAt
  
  // Calculate duration
  const now = Date.now()
  let durationSeconds = 0
  
  if (slotStartedAt) {
    const durationMs = now - slotStartedAt
    durationSeconds = Math.round(durationMs / 1000)
  } else {
    console.warn('slotStartedAt missing, cannot calculate duration')
    // Fallback: use slot duration as estimate
    durationSeconds = session.slotDurationSeconds || 0
  }
  
  // Update participant's speaking history and total time
  const participantRef = ref(db, `sessions/${sessionId}/participants/${activeSpeakerId}`)
  const participantSnapshot = await get(participantRef)
  const participant = participantSnapshot.val()
  
  if (participant) {
    const newHistoryEntry: SpeakingHistoryEntry = {
      startTime: slotStartedAt || now,
      endTime: now,
      durationSeconds: durationSeconds
    }
    
    const updatedHistory = [...(participant.speakingHistory || []), newHistoryEntry]
    const updatedTotal = (participant.totalSpokeDurationSeconds || 0) + durationSeconds
    
    await update(participantRef, {
      speakingHistory: updatedHistory,
      totalSpokeDurationSeconds: updatedTotal
    })
  }
  
  // Clear session active speaker state
  await update(sessionRef, {
    activeSpeakerId: null,
    slotEndsAt: null,
    slotStartedAt: null  // Clear start time
  })
}
```

---

### Session Creation Initialization

Update session creation in `lib/session.ts` to initialize new fields:

```ts
export async function createSession(
  hostId: string,
  hostName: string,
  slotDurationSeconds: number
): Promise<string> {
  const sessionId = push(ref(db, 'sessions')).key
  
  if (!sessionId) {
    throw new Error('Failed to generate session ID')
  }
  
  await set(ref(db, `sessions/${sessionId}`), {
    hostId,
    slotDurationSeconds,
    status: 'lobby',
    activeSpeakerId: null,
    slotEndsAt: null,
    slotStartedAt: null,  // NEW: Initialize to null
    spokenUserIds: [],
    participants: {
      [hostId]: {
        name: hostName,
        role: 'host',
        isHandRaised: false,
        totalSpokeDurationSeconds: 0,      // NEW: Initialize to 0
        speakingHistory: []                 // NEW: Initialize empty array
      }
    }
  })
  
  return sessionId
}
```

---

### Participant Join Initialization

Update participant join in `lib/session.ts`:

```ts
export async function joinSession(
  sessionId: string,
  userId: string,
  userName: string
): Promise<void> {
  const participantRef = ref(db, `sessions/${sessionId}/participants/${userId}`)
  
  await set(participantRef, {
    name: userName,
    role: 'participant',
    isHandRaised: false,
    totalSpokeDurationSeconds: 0,  // NEW: Initialize to 0
    speakingHistory: []             // NEW: Initialize empty array
  })
}
```

---

## User Flow

```
Host/Speaker selects next speaker
        ↓
selectNextSpeaker(sessionId, nextSpeakerId)
  → activeSpeakerId = nextSpeakerId
  → slotStartedAt = Date.now()
  → slotEndsAt = now + slotDuration
        ↓
Speaker talks (timer counts down client-side)
        ↓
Speaker clicks "End My Slot"
        ↓
endCurrentSlot(sessionId)
  → Calculate: durationSeconds = (now - slotStartedAt) / 1000
  → Append to speakingHistory: { startTime, endTime, durationSeconds }
  → Update totalSpokeDurationSeconds += durationSeconds
  → Clear: activeSpeakerId, slotEndsAt, slotStartedAt
        ↓
Speaking data persisted in Firebase
        ↓
Available for Meeting Summary and analytics
```

---

## Error Handling

- **Missing `slotStartedAt`**: Log warning, use slot duration as fallback estimate
- **Firebase write failure**: Show error toast, allow retry
- **Negative duration**: Clamp to 0, log error for debugging
- **Participant not found**: Log error, skip history update (session still ends slot)
- **Concurrent end slot calls**: Transaction ensures only one succeeds
- **Browser disconnect during slot**: Duration not recorded (acceptable for MVP, future improvement)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/session.ts` | Modify | Add `slotStartedAt` tracking to `selectNextSpeaker` |
| `lib/session.ts` | Modify | Add duration calculation to `endCurrentSlot` |
| `lib/session.ts` | Modify | Initialize new fields in `createSession` and `joinSession` |
| `lib/session.ts` | Update types | Add `SpeakingHistoryEntry` interface |

---

## Testing Notes

- Verify `slotStartedAt` is set when speaker is selected
- Verify duration calculation is accurate (within 1-2 seconds tolerance)
- Verify history entries are appended to array (not replaced)
- Verify `totalSpokeDurationSeconds` accumulates across multiple slots
- Verify cumulative total survives round resets
- Test with speaker who talks multiple times across rounds
- Verify graceful handling when `slotStartedAt` is missing
- Verify Firebase transaction atomicity for speaker selection
- Test with rapid speaker changes to ensure no data loss
- Verify data persists across browser refresh

---

## Success Criteria

At completion:

- All participants have accurate speaking time tracking
- History entries show individual slot details with start/end timestamps
- Cumulative totals correctly reflect all speaking time across session
- Data foundation ready for Meeting Summary component (REQ-0023)
- No breaking changes to existing session operations
- Error handling prevents data corruption or lost tracking
