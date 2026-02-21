# REQ-0029: Single-Turn Session Flow (No Reset)

**Status**: 🟨 Requirements created  
**Priority**: High (Core Session Mechanic Change)  
**Dependencies**: REQ-0011, REQ-0012, REQ-0017

---

## Overview

Modify the session flow to eliminate the round-reset mechanism, allowing each participant to speak exactly once without cycling back to re-enable speakers. Once all participants have spoken exactly once, no more speakers can be selected, and the session naturally reaches a conclusion state where only the host can end the meeting.

This simplifies the meeting flow for single-round sessions and prevents confusion around multiple-round scenarios. The meeting becomes a single-turn format where the host controls when to end after everyone has had their turn.

---

## Acceptance Criteria

### Session Logic Updates

- [ ] Remove logic that resets `spokenUserIds` when all participants have spoken
- [ ] `spokenUserIds` array persists until meeting ends (never cleared)
- [ ] Once a participant speaks, they remain in `spokenUserIds` for the entire session
- [ ] No participant can speak twice in the same session

### Speaker Selection Behavior

- [ ] SpeakerSelector component hides when no eligible participants remain
- [ ] Eligible participants = participants NOT in `spokenUserIds`
- [ ] When `spokenUserIds.length === participants.length`, SpeakerSelector shows empty state or is hidden
- [ ] Active speaker can still end their slot when they are the last speaker
- [ ] After last speaker ends slot, no speaker selection is possible

### UI/UX Requirements

- [ ] Display appropriate empty state when all participants have spoken:
  - Message: "All participants have spoken. Host can end the meeting."
  - No speaker selection UI displayed
  - End Meeting button remains visible and enabled for host
- [ ] Participant list shows all participants with "✅ Spoken" indicators
- [ ] After all speak, meeting remains in 'active' status (doesn't auto-finish)
- [ ] Host retains full control to end meeting at any point

### End Slot Behavior

- [ ] "End My Slot" button works normally for the last speaker
- [ ] Ending the last speaker's slot clears `activeSpeakerId`, `slotEndsAt`, `slotStartedAt`
- [ ] After ending last slot, session remains in 'active' state
- [ ] No automatic transition to 'finished' state
- [ ] Timer stops and clears when last speaker ends slot

### Edge Cases

- [ ] Handle case where only one participant exists (host only)
- [ ] Handle case where participants join mid-session (they join the pool of unspoken users)
- [ ] Handle participant disconnect (if they haven't spoken, they remain eligible if reconnecting)
- [ ] Handle host ending meeting before all participants speak (allowed)
- [ ] Ensure hand-raise functionality still works but has no effect after all have spoken

---

## Implementation Details

### Updated `selectNextSpeaker` Function

Modify `lib/session.ts` to remove the round-reset logic:

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
    
    // Validation: speaker hasn't already spoken in the session (no reset allowed)
    if (session.spokenUserIds?.includes(nextSpeakerId)) {
      throw new Error('Speaker has already spoken in this session')
    }
    
    const now = Date.now()
    
    // Update session with new speaker
    session.activeSpeakerId = nextSpeakerId
    session.slotStartedAt = now
    session.slotEndsAt = now + session.slotDurationSeconds * 1000
    session.spokenUserIds = [...(session.spokenUserIds || []), nextSpeakerId]
    
    // REMOVED: Round reset logic
    // OLD CODE (remove this):
    // const participantIds = Object.keys(session.participants)
    // if (session.spokenUserIds.length >= participantIds.length) {
    //   session.spokenUserIds = []
    // }
    
    return session
  })
}
```

---

### SpeakerSelector Component Updates

Modify `components/SpeakerSelector.tsx` to handle empty eligible participants:

```tsx
// Calculate eligible participants (those who haven't spoken)
const eligibleParticipants = Object.entries(session.participants || {})
  .filter(([id]) => !session.spokenUserIds?.includes(id))
  .map(([id, p]) => ({ id, name: p.name }))

// Empty state when all have spoken
if (eligibleParticipants.length === 0) {
  return (
    <div className="card">
      <p className="text-muted">
        All participants have spoken. Host can end the meeting.
      </p>
    </div>
  )
}

// Otherwise, render normal selector
return (
  <div className="card">
    <h3>Select Next Speaker</h3>
    <div className="speaker-list">
      {eligibleParticipants.map(({ id, name }) => (
        <button
          key={id}
          onClick={() => handleSelectSpeaker(id)}
          className="speaker-option"
        >
          {name}
        </button>
      ))}
    </div>
  </div>
)
```

---

### Meeting Page Layout Updates

Update `app/meeting/[sessionId]/page.tsx` to conditionally render SpeakerSelector:

```tsx
// Determine if speaker selection is available
const hasEligibleSpeakers = () => {
  const participantIds = Object.keys(session.participants || {})
  const spokenIds = session.spokenUserIds || []
  return participantIds.some(id => !spokenIds.includes(id))
}

// In render:
{session.status === 'active' && !session.activeSpeakerId && hasEligibleSpeakers() && (
  <SpeakerSelector session={session} />
)}

{session.status === 'active' && !session.activeSpeakerId && !hasEligibleSpeakers() && (
  <div className="card text-center">
    <p className="text-muted">
      All participants have spoken.
    </p>
    {session.hostId === currentUserId && (
      <p className="text-success mt-2">
        You can end the meeting now.
      </p>
    )}
  </div>
)}
```

---

## User Flow

```
Meeting starts in lobby
        ↓
Host clicks "Start Meeting" → status = 'active'
        ↓
Host/Speaker selects first speaker
        ↓
Speaker 1 talks, ends slot
        ↓
Select next speaker (from remaining unspoken participants)
        ↓
... continue until all participants have spoken ...
        ↓
Last speaker ends their slot
        ↓
activeSpeakerId = null, no eligible speakers remain
        ↓
SpeakerSelector shows empty state: "All participants have spoken"
        ↓
Meeting remains in 'active' status
        ↓
Host clicks "End Meeting" → status = 'finished'
        ↓
Meeting Summary displayed
```

---

## Technical Considerations

### Round Reset Removal

The key change is removing this block from `selectNextSpeaker`:

```ts
// REMOVE THIS:
const participantIds = Object.keys(session.participants)
if (session.spokenUserIds.length >= participantIds.length) {
  session.spokenUserIds = []
}
```

This ensures `spokenUserIds` never resets, enforcing single-turn logic.

### Backward Compatibility

- Existing sessions in progress may have empty `spokenUserIds` arrays
- New logic will work correctly for fresh sessions
- Consider migration path for existing long-running sessions (if any)

### Future Multi-Round Support

If multi-round support is needed later:
- Add a `roundNumber` field to session
- Track `spokenInCurrentRound` separately
- Feature flag to enable/disable round resets

---

## Testing Requirements

### Unit Tests

- [ ] Test `selectNextSpeaker` with all participants already in `spokenUserIds` (should fail)
- [ ] Test eligible participant calculation with various spoke/unspoken combinations
- [ ] Test SpeakerSelector renders empty state when all have spoken
- [ ] Test that `spokenUserIds` never clears after all speak

### Integration Tests

- [ ] Full session flow: lobby → active → all speak → end meeting
- [ ] Verify no speaker can be selected twice
- [ ] Verify SpeakerSelector hides after last speaker is selected
- [ ] Verify "End My Slot" works for the last speaking participant
- [ ] Verify host can end meeting after all participants speak
- [ ] Test with 2, 3, 5+ participants to ensure scaling works

### Edge Case Tests

- [ ] Session with only host (1 participant)
- [ ] Participant joins after some have already spoken
- [ ] Participant disconnects before speaking (remains eligible)
- [ ] Rapid speaker selection attempts (transaction safety)

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/session.ts` | Modify | Remove round-reset logic from `selectNextSpeaker` |
| `components/SpeakerSelector.tsx` | Modify | Add empty state when all participants spoken |
| `app/meeting/[sessionId]/page.tsx` | Modify | Conditionally render SpeakerSelector based on eligible participants |

---

## Success Criteria

At completion:

- Each participant can speak exactly once per session
- `spokenUserIds` never resets during an active session
- SpeakerSelector displays appropriate empty state after all speak
- Meeting flow feels natural and unambiguous (single-turn format)
- Host can always end meeting regardless of speak status
- No breaking changes to existing session operations
- All edge cases handled gracefully

---

## References

- [PRD Section 3.1: Core Mechanics](/docs/PRD.md#core-mechanics)
- [Plan Section 4.4: Speaker Selection](/docs/plan.md#speaker-selection)
- [REQ-0017: Spoken Tracking and Round Reset Logic](/docs/stories/completed/REQ-0017-spoken-tracking-round-reset-logic.md)
