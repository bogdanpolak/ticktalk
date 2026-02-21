# REQ-0016: Hand Raise Toggle + Visual Indicator

**Status**: 🟨 Requirements Created  
**Priority**: High (MVP Core Feature)  
**Dependencies**: REQ-0007, REQ-0013

---

## Overview

Implement a hand-raise mechanism that allows inactive participants to signal their interest in speaking or ask clarifying questions during active meetings.

Non-active participants can toggle a hand-raise state, which is persisted in Firebase and displayed as a visual indicator next to their name in the participant list. The active speaker may choose to address a participant with their hand raised before continuing with their slot.

---

## Acceptance Criteria

- [ ] Non-active participants see a "Raise Hand" button in active meeting state
- [ ] Active speaker does not see the "Raise Hand" button (only "End My Slot")
- [ ] Clicking "Raise Hand" toggles `isHandRaised` for current user in Firebase
- [ ] Toggle action is disabled while request is in progress
- [ ] Visual indicator (`✋`) appears next to participant name when `isHandRaised === true`
- [ ] Raised-hand participants appear second in `ParticipantList` sort order (after active speaker)
- [ ] Hand-raised indicator is visible to all participants in real-time
- [ ] Participants can lower their hand by clicking again
- [ ] Button text changes dynamically: "Raise Hand" → "Lower Hand"
- [ ] Hand-raise state persists if participant temporarily disconnects and reconnects
- [ ] Error feedback shown if toggle fails
- [ ] Mobile-responsive button placement
- [ ] Uses design system tokens and typography

---

## Implementation Details

### Session Data Model

The `participants` object already supports this field:

```ts
participants: {
  [userId]: {
    name: string,
    role: 'host' | 'participant',
    isHandRaised: boolean  // toggle this
  }
}
```

No schema changes required. Ensure `isHandRaised` defaults to `false` on join.

---

### Firebase Operations (`lib/session.ts`)

Create a new function to toggle hand-raise state:

```ts
export async function toggleHandRaise(
  sessionId: string,
  userId: string
): Promise<void> {
  const db = getDatabase()
  const participantRef = ref(db, `sessions/${sessionId}/participants/${userId}`)
  
  const snapshot = await get(participantRef)
  const currentState = snapshot.val()?.isHandRaised ?? false
  
  await update(participantRef, {
    isHandRaised: !currentState
  })
}
```

---

### UI Component: Hand-Raise Button

Create `components/HandRaiseButton.tsx`:

**Props**:

```tsx
interface HandRaiseButtonProps {
  sessionId: string
  currentUserId: string | null
  isActiveSpeaker: boolean
  isHandRaised: boolean
  isLoading?: boolean
}
```

**Behavior**:

1. Hide button entirely if `isActiveSpeaker === true`
2. Show toggle button with dynamic text:
   - Text: `"Raise Hand"` if `isHandRaised === false`
   - Text: `"Lower Hand"` if `isHandRaised === true`
3. Button disabled while `isLoading === true`
4. On click: Call `toggleHandRaise(sessionId, currentUserId)` with try/catch
5. Show error toast if operation fails
6. Use primary style when hand is down, subtle/secondary when raised
7. Compact icon-based design suitable for mobile

**Example styling**:

```tsx
// Hand down (default)
className="btn btn-primary btn-sm"

// Hand raised (highlight)
className="btn btn-secondary btn-sm"
```

---

### Integration: `app/meeting/[sessionId]/page.tsx`

In `ActiveMeetingView`:

1. Get current user's `isHandRaised` from single participant snapshot:
   ```tsx
   const currentParticipant = session.participants?.[currentUserId || '']
   const isHandRaised = currentParticipant?.isHandRaised ?? false
   const isActiveSpeaker = currentUserId === session.activeSpeakerId
   ```

2. Render `HandRaiseButton` in controls area (below or beside `MeetingControls`)

3. Pass realtime session update to re-render when status changes

---

### Integration: `components/ParticipantList.tsx`

Ensure participant list already shows hand-raise indicator:

- Include `✋` icon next to name when `isHandRaised === true`
- Apply consistent styling to match raised-hand badge
- Keep icon visible at all times during raised state

---

### Participant Ordering (ParticipantList.tsx)

Update sort rules to include hand-raised priority:

```ts
const sortedParticipants = participants.sort((a, b) => {
  // 1. Active speaker first
  if (a.isActiveSpeaker !== b.isActiveSpeaker) {
    return a.isActiveSpeaker ? -1 : 1
  }
  // 2. Hand raised next
  if (a.isHandRaised !== b.isHandRaised) {
    return a.isHandRaised ? -1 : 1
  }
  // 3. Alphabetical by name
  return a.name.localeCompare(b.name)
})
```

---

## User Flow

```
Participant in active meeting (not speaking)
        ↓
Clicks "Raise Hand"
        ↓
toggleHandRaise(sessionId, userId)
  -> isHandRaised = true
        ↓
Realtime update received by all clients
        ↓
Hand-raised indicator (✋) appears next to participant name
        ↓
Participant moves up in list (after active speaker)
        ↓
[Later] Participant clicks "Lower Hand"
        ↓
toggleHandRaise(sessionId, userId)
  -> isHandRaised = false
        ↓
Indicator disappears, participant returns to alphabetical position
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `lib/session.ts` | Modify | Add `toggleHandRaise(sessionId, userId)` function |
| `components/HandRaiseButton.tsx` | Create | Hand-raise toggle button component |
| `components/ParticipantList.tsx` | Modify | Ensure hand-raise indicator (`✋`) displayed |
| `app/meeting/[sessionId]/page.tsx` | Modify | Integrate `HandRaiseButton` into meeting controls |

---

## Testing Notes

- Verify non-active participant can raise/lower hand
- Verify active speaker does not see hand-raise button
- Verify hand-raise indicator appears in real-time across all clients
- Verify hand-raised participants appear second in list (after speaker)
- Verify hand state persists through reconnection
- Verify loading and error states work correctly
- Verify mobile layout does not overflow
- Verify button text updates correctly

---

## Design System Integration

- Use existing button classes: `btn`, `btn-primary`, `btn-secondary`, `btn-sm`
- Use existing spacing scale: `gap-`, `p-`, `m-`
- Typography: Use existing text sizes for label (avoid custom font sizes)
- Icons: Hand emoji (`✋`) for consistency with existing indicators
