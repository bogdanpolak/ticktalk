# REQ-0018: Disconnect Handling (Speaker & Host)

**Status**: 🟨 Requirements Created  
**Priority**: High (MVP Reliability & Edge Cases)  
**Dependencies**: REQ-0007, REQ-0011, REQ-0014

---

## Overview

Implement graceful handling when critical participants (active speaker or host) experience network disconnection or close their browser during an active meeting.

Disconnects are detected via Firebase presence logic or session inactivity. When a speaker disconnects, the host can select a replacement from unspoken participants. When a host disconnects, the system promotes the first (by join order or alphabetically) non-host participant to temporary host role.

---

## Acceptance Criteria

### Speaker Disconnect Handling

- [ ] When active speaker's connection is lost, `activeSpeakerId` remains set (browser doesn't clear it)
- [ ] Host is notified that active speaker has disconnected (visual indicator or status message)
- [ ] Host can select a replacement speaker from participants who haven't spoken
- [ ] Selecting replacement immediately calls `selectNextSpeaker()` to update timer
- [ ] Previous speaker cannot resume after disconnect; they lose their current slot
- [ ] Replacement speaker sees active speaker UI and timer continues countdown

### Host Disconnect Handling

- [ ] When host disconnects, another participant is promoted to temporary host
- [ ] Host role is transferred to first non-host participant (deterministic promotion)
- [ ] Promotion happens automatically (no manual intervention required)
- [ ] Promoted host can perform all host functions: start meeting (if lobby), end meeting, select speakers
- [ ] Original host cannot regain host role if they reconnect later
- [ ] If promoted host then disconnects, role transfers to next non-host participant

### General Disconnect Handling

- [ ] Disconnection is detected when client loses Firebase connection
- [ ] Re-connection automatically re-syncs session state via `useSession` hook
- [ ] Participant re-joining after disconnect retains their identity (`userId`)
- [ ] Participants cannot manually leave (only disconnect via network/close)
- [ ] Grace period of 5-10 seconds before considering disconnect permanent
- [ ] Error states shown clearly to remaining participants

---

## Implementation Details

### Speaker Disconnect Detection

**Option A: Presence-based (Recommended for MVP)**

Firebase Realtime Database Presence Monitoring:

```ts
// In session.ts
export function monitorPresence(
  sessionId: string,
  userId: string,
  onDisconnect: () => void
): () => void {
  const db = getDatabase()
  const presenceRef = ref(db, `sessions/${sessionId}/presence/${userId}`)
  
  // Set presence on connect
  set(presenceRef, {
    lastSeen: serverTimestamp(),
    status: 'online'
  })
  
  // On disconnect, remove presence
  onDisconnect(presenceRef).remove()
  
  // Monitor active speaker presence
  onValue(ref(db, `sessions/${sessionId}/activeSpeakerId`), (snapshot) => {
    const activeSpeakerId = snapshot.val()
    if (!activeSpeakerId) return
    
    const speakerPresenceRef = ref(
      db,
      `sessions/${sessionId}/presence/${activeSpeakerId}`
    )
    
    onValue(speakerPresenceRef, (presenceSnapshot) => {
      if (!presenceSnapshot.exists()) {
        // Speaker has disconnected
        onDisconnect()
      }
    }, { onlyOnce: false })
  })
  
  // Return unsubscribe function
  return () => {
    off(presenceRef)
  }
}
```

**Option B: Inactivity-based (Simpler, eventual consistency)**

Monitor `lastActivityAt` timestamp. If it exceeds 30s without update, consider disconnected.

For MVP, **recommend Option A** using Firebase's automatic presence tracking.

---

### Host Promotion Logic

When host disconnects:

```ts
export async function promoteHostOnDisconnect(
  sessionId: string
): Promise<void> {
  const db = getDatabase()
  const sessionRef = ref(db, `sessions/${sessionId}`)
  
  await runTransaction(sessionRef, (session) => {
    if (!session) return undefined
    
    const participants = session.participants || {}
    const currentHostId = session.hostId
    
    // Find first non-host participant (deterministic order)
    const candidateIds = Object.keys(participants)
      .filter(id => id !== currentHostId)
      .sort() // Deterministic alphabetical order
    
    if (candidateIds.length === 0) {
      // No other participants, current host remains
      return session
    }
    
    const newHostId = candidateIds[0]
    
    // Update participant role
    session.participants[newHostId].role = 'host'
    session.hostId = newHostId
    
    // Add log entry (optional, for debugging)
    session.hostChangedAt = Date.now()
    session.previousHostId = currentHostId
    
    return session
  })
}
```

---

### Speaker Disconnect Handler (`useSession` Hook Integration)

In `hooks/useSession.ts`, add disconnect detection:

```ts
export function useSession(sessionId: string | null) {
  const [session, setSession] = useState<Session | null>(null)
  const [speakerDisconnected, setSpeakerDisconnected] = useState(false)
  
  useEffect(() => {
    if (!sessionId) return
    
    const db = getDatabase()
    const sessionRef = ref(db, `sessions/${sessionId}`)
    
    const unsubscribeSession = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val()
      setSession(data)
      
      // Check speaker presence if active
      if (data?.activeSpeakerId) {
        const presenceRef = ref(
          db,
          `sessions/${sessionId}/presence/${data.activeSpeakerId}`
        )
        const checkPresence = onValue(presenceRef, (presenceSnapshot) => {
          setSpeakerDisconnected(!presenceSnapshot.exists())
        })
        
        return () => off(presenceRef)
      }
    })
    
    return () => off(sessionRef)
  }, [sessionId])
  
  return { session, speakerDisconnected }
}
```

---

### UI: Speaker Disconnect Indicator

Add to `ActiveMeetingView` in meeting page:

```tsx
export function ActiveMeetingView({
  session,
  speakerDisconnected,
  currentUserId,
  isHost
}: ActiveMeetingViewProps) {
  const { activeSpeakerId, participants } = session
  
  const showSpeakerDisconnectWarning =
    speakerDisconnected && isHost && activeSpeakerId
  
  return (
    <div className="space-y-6">
      {showSpeakerDisconnectWarning && (
        <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4">
          <h3 className="font-semibold text-red-900">Active Speaker Disconnected</h3>
          <p className="text-sm text-red-700">
            {participants[activeSpeakerId]?.name} has lost connection.
          </p>
          <p className="mt-2 text-sm text-red-700">
            Please select a replacement speaker from the list below.
          </p>
        </div>
      )}
      
      {/* Rest of meeting UI */}
      <ActiveSpeaker
        speaker={participants[activeSpeakerId]}
        isDisconnected={speakerDisconnected}
      />
      
      <SpeakerSelector
        sessionId={sessionId}
        participants={participants}
        spokenUserIds={session.spokenUserIds}
        activeSpeakerId={activeSpeakerId}
        currentUserId={currentUserId}
        hostId={session.hostId}
      />
    </div>
  )
}
```

---

### UI: Host Role Change Indicator

When host role changes, show notification to new host:

```tsx
export function HostRoleNotification({
  prevHostId,
  newHostId,
  participants
}: {
  prevHostId?: string
  newHostId: string
  participants: Record<string, Participant>
}) {
  if (!prevHostId || !newHostId || prevHostId === newHostId) return null
  
  return (
    <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
      <p className="text-sm text-blue-700">
        <strong>{participants[newHostId]?.name}</strong> is now the host.
        The previous host has disconnected.
      </p>
    </div>
  )
}
```

---

### Meeting Page Integration

Update `app/meeting/[sessionId]/page.tsx`:

```tsx
export default function MeetingPage({
  params: { sessionId }
}: MeetingPageProps) {
  const { session, speakerDisconnected } = useSession(sessionId)
  const { userId } = useAuth()
  const [prevHostId, setPrevHostId] = useState<string | null>(null)
  
  useEffect(() => {
    if (session?.hostId && prevHostId && prevHostId !== session.hostId) {
      // Host role has changed, show notification
    }
    setPrevHostId(session?.hostId || null)
  }, [session?.hostId, prevHostId])
  
  const isHost = userId === session?.hostId
  
  if (session?.status === 'active') {
    return (
      <>
        {speakerDisconnected && isHost && (
          <SpeakerDisconnectWarning participant={session.participants[session.activeSpeakerId]} />
        )}
        
        {prevHostId && prevHostId !== session.hostId && (
          <HostRoleNotification
            prevHostId={prevHostId}
            newHostId={session.hostId}
            participants={session.participants}
          />
        )}
        
        <ActiveMeetingView {...props} />
      </>
    )
  }
  
  // ... rest of page
}
```

---

## Firebase Data Model Extensions

Sessions may include:

```ts
sessions/{sessionId}: {
  // ... existing fields
  presence: {
    [userId]: {
      lastSeen: timestamp,
      status: 'online' | 'offline'
    }
  },
  hostChangedAt?: timestamp,
  previousHostId?: string
}
```

---

## Edge Cases

| Case | Handling |
|------|----------|
| Speaker disconnects, reconnects ASAP | May rejoin but no longer active speaker; in unspoken for next round |
| Host disconnects, comes back 5 min later | Role already transferred; rejoins as regular participant |
| All participants disconnect simultaneously | Session remains open; first to reconnect sees current state |
| Speaker disconnects, no other unspoken candidates | Host can pick anyone (including host themselves) to restart |
| Multiple rapid disconnects | Each triggers independent guest or role re-assignment |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/session.ts` | Modify | Add `monitorPresence()` and `promoteHostOnDisconnect()` functions |
| `hooks/useSession.ts` | Modify | Add `speakerDisconnected` state and detection logic |
| `components/ActiveSpeaker.tsx` | Modify | Add visual indicator for disconnected speaker (visual blur/dim) |
| `app/meeting/[sessionId]/page.tsx` | Modify | Integrate disconnect handlers and UI indicators |
| `components/SpeakerDisconnectWarning.tsx` | Create | Alert component for host when speaker disconnects |

---

## Testing Notes

- Verify speaker disconnect triggers presence monitoring
- Verify host receives notification of speaker disconnect
- Verify host can select replacement speaker after disconnect
- Verify host role promotes automatically when host disconnects
- Verify promoted host can perform all host actions
- Verify reconnecting host doesn't regain host role
- Verify multiple rapid disconnects are handled safely
- Test with Firebase emulator simulating connection loss
- Verify UI updates correctly across all participants

---

## Deployment Notes

- Firebase Security Rules must allow presence updates
- Verify Firebase connection timeout settings (~30 seconds)
- Test with simulated slow/unreliable networks (DevTools throttling)
- Monitor Firebase connection stability in production
- Log disconnect events for debugging

---

## Notes for Implementation

1. **Presence-based detection is recommended** due to automatic Firebase cleanup on disconnect
2. **Host promotion is atomic** to prevent race conditions with multiple disconnects
3. **Disconnected participants retain their data** (spoken status, participant entry) for the session duration
4. **Role reassignment is permanent** — original host cannot reclaim role if they reconnect
5. Consider adding a "Waiting for speaker..." state if speaker disconnects but isn't immediately replaced
