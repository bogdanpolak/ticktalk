# REQ-0022: Host Participates in Speaker Rotation

**Status**: ✅ Completed  
**Priority**: High (MVP Fairness & UX)  
**Dependencies**: REQ-0011, REQ-0012

---

## Overview

Enable the meeting host to fully participate in the speaker rotation with the same capabilities as regular participants.

Currently, the host may be excluded from speaker selection logic or treated as a special case. This requirement ensures the host can select themselves as the first or next speaker, appears in the eligible next-speaker list when they haven't spoken in the current round, and has their speaking time tracked identically to participants. The host should not have special exemptions from turn-taking fairness.

This change promotes equity in meetings and allows the host to actively participate in discussions without requiring a co-host or workaround.

---

## Acceptance Criteria

### Speaker Selection Logic

- [ ] Host appears in eligible speaker list when they haven't spoken in current round
- [ ] Host can select themselves as first speaker when starting the meeting
- [ ] Host can select themselves as next speaker (if eligible) during active meeting
- [ ] Host selection triggers same validation as participant selection
- [ ] Host's `userId` added to `spokenUserIds` array when they become speaker
- [ ] Host participates in round reset logic (included in "all have spoken" count)
- [ ] No special exemptions or bypass logic for host in speaker rotation

### Speaker Selector Component

- [ ] `SpeakerSelector.tsx` includes host in candidate list if they haven't spoken
- [ ] Host's name clearly displayed in selector dropdown/list
- [ ] Visual distinction (e.g., "(Host)" label) identifies host in selector
- [ ] Host can pick themselves without UI confusion or disabled state
- [ ] Selector validation prevents host from selecting themselves if already spoken in round
- [ ] Selector displays "spoken" indicator correctly for host

### Host Controls

- [ ] When host is active speaker, they see "End My Slot" button (same as participants)
- [ ] Host can use speaker selector to pick next speaker while they're speaking
- [ ] Host retains "End Meeting" button even when they're the active speaker
- [ ] Host's hand-raise functionality works identically to participants (if implemented)

### Speaking Time Tracking

- [ ] Host's `totalSpokeDurationSeconds` accumulates across rounds (REQ-0020 integration)
- [ ] Host's `speakingHistory` array tracks all their speaking slots
- [ ] Host's speaking data displayed in Meeting Summary (REQ-0023 integration)
- [ ] Host appears in participant list with speaking time indicators
- [ ] No special calculation or exemption for host speaking time

### Round Reset Logic

- [ ] Host included in total participant count for round completion check
- [ ] `spokenUserIds` resets when all participants (including host) have spoken
- [ ] Host can speak again in new round after reset
- [ ] Round reset indicator shows host as eligible again

### Participant List Display

- [ ] Host displays with current speaking indicator (🎤) when active
- [ ] Host displays with "spoken" indicator (✅) when in `spokenUserIds`
- [ ] Host displays with hand raised indicator (✋) if applicable
- [ ] Host visually distinguished (e.g., "(Host)" badge) but same status icons
- [ ] Host's row in participant list formatted consistently with other participants

---

## Implementation Details

### Updated Speaker Selection Validation

Modify `lib/session.ts` to remove host exclusion:

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
    
    // Validate: speaker exists as participant
    if (!session.participants[nextSpeakerId]) {
      throw new Error('Selected speaker is not a participant')
    }
    
    // Validate: speaker hasn't already spoken in current round
    if (session.spokenUserIds?.includes(nextSpeakerId)) {
      throw new Error('Speaker has already spoken in this round')
    }
    
    // NO special check to exclude hostId - host can be selected
    
    const now = Date.now()
    
    // Update session with new speaker
    session.activeSpeakerId = nextSpeakerId
    session.slotStartedAt = now
    session.slotEndsAt = now + session.slotDurationSeconds * 1000
    session.spokenUserIds = [...(session.spokenUserIds || []), nextSpeakerId]
    
    // Reset round if all participants (including host) have spoken
    const participantIds = Object.keys(session.participants)
    if (session.spokenUserIds.length >= participantIds.length) {
      session.spokenUserIds = []
    }
    
    return session
  })
}
```

**Key Change**: Remove any conditional logic that excludes `hostId` from selection validation. Host is treated as a regular participant for rotation purposes.

---

### Updated Speaker Selector Component

Modify `components/SpeakerSelector.tsx` to include host in candidate list:

```tsx
interface SpeakerSelectorProps {
  sessionId: string
  participants: Record<string, Participant>
  spokenUserIds: string[]
  hostId: string
  currentUserId: string | null
  onSelectSpeaker: (speakerId: string) => void
}

export function SpeakerSelector({
  sessionId,
  participants,
  spokenUserIds,
  hostId,
  currentUserId,
  onSelectSpeaker
}: SpeakerSelectorProps) {
  // Get eligible candidates: anyone who hasn't spoken in current round
  const eligibleCandidates = Object.entries(participants)
    .filter(([userId]) => !spokenUserIds.includes(userId))
    .map(([userId, participant]) => ({
      userId,
      name: participant.name,
      isHost: userId === hostId  // Track host status for display
    }))
  
  if (eligibleCandidates.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        All participants have spoken. Round will reset with next speaker selection.
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Select Next Speaker:
      </label>
      <div className="grid gap-2">
        {eligibleCandidates.map(({ userId, name, isHost }) => (
          <button
            key={userId}
            onClick={() => onSelectSpeaker(userId)}
            className="px-4 py-2 text-left bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <span className="font-medium">{name}</span>
            {isHost && (
              <span className="ml-2 text-xs text-blue-600 font-semibold">(Host)</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Key Changes**:
- Include all participants in filtering logic (no exclusion of `hostId`)
- Add visual indicator `(Host)` to distinguish host in selector
- Host treated equally in eligibility filtering

---

### Updated Participant List Component

Modify `components/ParticipantList.tsx` to display host consistently:

```tsx
interface ParticipantListProps {
  participants: Record<string, Participant>
  activeSpeakerId: string | null
  spokenUserIds: string[]
  hostId: string
}

export function ParticipantList({
  participants,
  activeSpeakerId,
  spokenUserIds,
  hostId
}: ParticipantListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700">
        Participants ({Object.keys(participants).length})
      </h3>
      <ul className="space-y-1">
        {Object.entries(participants).map(([userId, participant]) => {
          const isActive = userId === activeSpeakerId
          const hasSpoken = spokenUserIds.includes(userId)
          const isHost = userId === hostId
          
          return (
            <li
              key={userId}
              className={`
                flex items-center justify-between px-3 py-2 rounded-lg
                ${isActive ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'}
              `}
            >
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">
                  {participant.name}
                </span>
                {isHost && (
                  <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full font-semibold">
                    Host
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {isActive && <span title="Currently speaking">🎤</span>}
                {hasSpoken && !isActive && <span title="Already spoken">✅</span>}
                {participant.isHandRaised && <span title="Hand raised">✋</span>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

**Key Changes**:
- Host displays with same status indicators as participants (🎤, ✅, ✋)
- Visual badge ("Host") distinguishes host role while maintaining consistent layout
- No special exemption from status tracking

---

### Meeting Page Integration

Update `app/meeting/[sessionId]/page.tsx` to support host as speaker:

```tsx
function ActiveMeetingView({ session, currentUserId }: Props) {
  const isHost = currentUserId === session.hostId
  const isActiveSpeaker = currentUserId === session.activeSpeakerId
  const noActiveSpeaker = session.activeSpeakerId === null
  
  // Host can select first speaker OR next speaker if they're current speaker
  const canSelectSpeaker = (isHost && noActiveSpeaker) || isActiveSpeaker
  
  return (
    <div className="space-y-6">
      {/* Active Speaker Display */}
      {session.activeSpeakerId && (
        <ActiveSpeaker
          speakerName={session.participants[session.activeSpeakerId]?.name}
        />
      )}
      
      {/* Timer */}
      <Timer {...timerProps} />
      
      {/* Meeting Controls */}
      {isActiveSpeaker && (
        <MeetingControls
          sessionId={session.id}
          onEndSlot={handleEndSlot}
        />
      )}
      
      {/* Speaker Selector */}
      {canSelectSpeaker && (
        <SpeakerSelector
          sessionId={session.id}
          participants={session.participants}
          spokenUserIds={session.spokenUserIds || []}
          hostId={session.hostId}
          currentUserId={currentUserId}
          onSelectSpeaker={handleSelectSpeaker}
        />
      )}
      
      {/* Host-Only Controls */}
      {isHost && (
        <div className="mt-4">
          <button
            onClick={handleEndMeeting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            End Meeting
          </button>
        </div>
      )}
      
      {/* Participant List */}
      <ParticipantList
        participants={session.participants}
        activeSpeakerId={session.activeSpeakerId}
        spokenUserIds={session.spokenUserIds || []}
        hostId={session.hostId}
      />
    </div>
  )
}
```

**Key Changes**:
- Remove any logic that prevents host from being active speaker
- Host sees same controls as active speaker when speaking
- Host retains "End Meeting" button even while speaking

---

## User Flow Scenarios

### Scenario 1: Host Selects Themselves as First Speaker

```
Meeting starts (lobby state)
        ↓
Host clicks "Start Meeting"
  → status: 'active'
  → activeSpeakerId: null
        ↓
Host sees speaker selector (no active speaker)
        ↓
Host selects themselves from list
        ↓
selectNextSpeaker(sessionId, hostId)
  → activeSpeakerId: hostId
  → spokenUserIds: [hostId]
  → Timer starts
        ↓
Host is now active speaker
  → Can end their slot
  → Can select next speaker
```

### Scenario 2: Host Participates in Mid-Round

```
Participant A finishes speaking
        ↓
Participant A selects next speaker
        ↓
Host appears in eligible list (hasn't spoken yet)
        ↓
Participant A selects Host
        ↓
Host becomes active speaker
  → Timer starts
  → Host can end slot and pick next speaker
```

### Scenario 3: Round Reset with Host

```
All participants (including host) have spoken
  → spokenUserIds: [user1, user2, user3, hostId]
        ↓
Current speaker selects next speaker
        ↓
spokenUserIds resets to []
        ↓
Host eligible again for next round
```

---

## Edge Cases

- **Host is only participant**: Host can speak, end slot, select themselves again
- **Host disconnects while speaking**: Same logic as participant disconnect (REQ-0018)
- **Host joins late**: Host can still participate as speaker even if not first
- **Host never speaks**: Valid scenario, host not forced to speak
- **Host speaks multiple times**: Allowed across rounds, same as participants
- **Two people select host simultaneously**: Transaction ensures only one succeeds

---

## Error Handling

- **Host tries to select themselves when already spoken**: Validation prevents, show error message
- **Host selection fails in transaction**: Show error toast, allow retry
- **Missing host in participants list**: Log error, graceful degradation

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/session.ts` | Modify | Remove host exclusion from speaker selection validation |
| `components/SpeakerSelector.tsx` | Modify | Include host in eligible candidates with visual indicator |
| `components/ParticipantList.tsx` | Modify | Display host with consistent status indicators |
| `app/meeting/[sessionId]/page.tsx` | Modify | Support host as active speaker in UI logic |

---

## Testing Notes

- Verify host can select themselves as first speaker
- Verify host appears in speaker selector when eligible
- Verify host displays "(Host)" badge in selector
- Verify host's "spoken" status tracked correctly
- Verify host included in round reset logic
- Test round completion when host is last speaker
- Verify host can end their own slot
- Verify host retains "End Meeting" button while speaking
- Test meeting with host as only participant (self-selection loop)
- Verify host's speaking time tracked identically to participants

---

## Accessibility Considerations

- [ ] Screen readers announce host role in participant list
- [ ] Host role badge has sufficient contrast
- [ ] Keyboard navigation works for host selection
- [ ] Focus states clear when host is selected speaker

---

## Success Criteria

At completion:

- Host fully participates in speaker rotation without special exemptions
- Host can select themselves as speaker when eligible
- Host's speaking time and history tracked identically to participants
- Host displays in participant list with same status indicators as others
- UI clearly identifies host role while maintaining consistent behavior
- No breaking changes to existing speaker selection flow
- All existing participant features work for host (hand raise, speaking indicators, etc.)
