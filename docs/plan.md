# TickTalk — Implementation Plan

> Updated: February 2025
> Based on PRD + tech architecture decisions

---

## 1. Architecture Overview

```
Browser (Next.js on Vercel)
        |
        | Realtime subscription (WebSocket)
        |
Firebase Realtime Database
```

### Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Frontend   | Next.js 16 (App Router), React 19 |
| Styling    | Tailwind CSS 4                    |
| State      | React `useState` / `useEffect`   |
| Realtime   | Firebase Realtime Database SDK    |
| Auth       | Firebase Anonymous Auth (MVP)     |
| Hosting    | Vercel (free tier)                |
| Database   | Firebase Realtime Database        |

No custom backend server. Firebase handles real-time sync, state persistence, and concurrency via transactions.

---

## 2. Data Model

### Session

```json
sessions/{sessionId}: {
  hostId: string,
  slotDurationSeconds: number,
  status: "lobby" | "active" | "finished",
  activeSpeakerId: string | null,
  slotEndsAt: number | null,          // Unix timestamp (ms)
  spokenUserIds: string[],
  participants: {
    [userId]: {
      name: string,
      role: "host" | "participant",
      isHandRaised: boolean
    }
  }
}
```

### Key rules

- `spokenUserIds` tracks who has already spoken in the current round.
- When all participants have spoken, `spokenUserIds` resets to empty.
- `slotEndsAt` is authoritative — clients compute countdown locally.
- Timer expiry shows an indicator but does NOT auto-advance. Speaker manually ends slot.

---

## 3. Page Structure

```
app/
  page.tsx                      → Home / Create Session
  join/[sessionId]/page.tsx     → Join session (enter name)
  meeting/[sessionId]/page.tsx  → Lobby + Meeting Room
```

### 3.1 Home Page (`/`)

- Name input field
- Slot duration selector (default: 2 minutes)
- "Create Session" button → generates session in Firebase, redirects to meeting page
- Session link displayed for sharing

### 3.2 Join Page (`/join/[sessionId]`)

- Name input field
- "Join" button → adds participant to Firebase session, redirects to meeting page
- If session doesn't exist → error message

### 3.3 Meeting Page (`/meeting/[sessionId]`)

Single page with conditional rendering based on `session.status`:

**Lobby state** (`status: "lobby"`):
- Participant list (real-time updated)
- Host sees "Start Meeting" button
- All see shareable join link

**Active state** (`status: "active"`):
- Active speaker (highlighted, large)
- Countdown timer (large, central)
- "Time Expired" indicator when timer reaches 0
- Participant list with:
  - ✋ Hand raised indicator
  - ✅ Already spoken indicator
  - 🎤 Currently speaking indicator
- Active speaker sees:
  - "End My Slot" button
  - Participant picker (only those who haven't spoken)
- Host sees "End Meeting" button (only when no speaker is active)

**Finished state** (`status: "finished"`):
- Meeting complete message
- Summary of participants

---

## 4. Core Logic

### 4.1 Session Creation (Host)

```ts
const sessionId = push(ref(db, 'sessions')).key
set(ref(db, `sessions/${sessionId}`), {
  hostId: currentUserId,
  slotDurationSeconds: slotDuration,
  status: 'lobby',
  activeSpeakerId: null,
  slotEndsAt: null,
  spokenUserIds: [],
  participants: {
    [currentUserId]: { name, role: 'host', isHandRaised: false }
  }
})
```

### 4.2 Joining Session (Participant)

```ts
set(ref(db, `sessions/${sessionId}/participants/${userId}`), {
  name,
  role: 'participant',
  isHandRaised: false
})
```

### 4.3 Real-Time Subscription

```ts
onValue(ref(db, `sessions/${sessionId}`), (snapshot) => {
  setSession(snapshot.val())
})
```

All UI state derives from the Firebase session snapshot. No separate event system.

### 4.4 Speaker Selection

When the active speaker (or host for the first speaker) selects the next speaker:

```ts
runTransaction(ref(db, `sessions/${sessionId}`), (session) => {
  if (!session) return
  // Validate: nextSpeakerId not in spokenUserIds
  if (session.spokenUserIds?.includes(nextSpeakerId)) return
  
  session.activeSpeakerId = nextSpeakerId
  session.slotEndsAt = Date.now() + session.slotDurationSeconds * 1000
  session.spokenUserIds = [...(session.spokenUserIds || []), nextSpeakerId]
  
  // Reset if all have spoken
  const participantIds = Object.keys(session.participants)
  if (session.spokenUserIds.length >= participantIds.length) {
    session.spokenUserIds = []
  }
  
  return session
})
```

Transaction ensures only one concurrent selection succeeds.

### 4.5 End Slot

```ts
update(ref(db, `sessions/${sessionId}`), {
  activeSpeakerId: null,
  slotEndsAt: null
})
```

After ending slot, the speaker selects the next participant (combined into one action for better UX — speaker picks next, which triggers 4.4).

### 4.6 Timer

Client-side countdown computed from `slotEndsAt`:

```ts
const remaining = Math.max(0, Math.ceil((session.slotEndsAt - Date.now()) / 1000))
```

- Tick locally every second via `setInterval`
- Yellow warning at 15s remaining
- Red warning at 5s remaining
- "Time Expired" indicator when reaching 0
- No auto-advance — speaker stays active until they end their slot

### 4.7 Hand Raise

```ts
update(ref(db, `sessions/${sessionId}/participants/${userId}`), {
  isHandRaised: !currentState
})
```

---

## 5. Firebase Configuration

### 5.1 Security Rules (MVP)

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

Sufficient for internal team tool. Tighten in later phases.

### 5.2 Environment Variables

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 6. Component Breakdown

```
components/
  Timer.tsx                → Countdown display with color states
  ParticipantList.tsx      → List with status indicators
  ActiveSpeaker.tsx        → Highlighted current speaker display
  SpeakerSelector.tsx      → Pick next speaker from eligible list
  HandRaiseButton.tsx      → Toggle hand raise
  LobbyView.tsx            → Pre-meeting waiting room
  MeetingControls.tsx      → Host/speaker action buttons

lib/
  firebase.ts              → Firebase app initialization
  session.ts               → Session CRUD operations
  auth.ts                  → Anonymous auth helper

hooks/
  useSession.ts            → Subscribe to session updates
  useTimer.ts              → Local countdown logic
  useAuth.ts               → Current user identity
```

---

## 7. Edge Cases

| Case                          | Handling                                                   |
| ----------------------------- | ---------------------------------------------------------- |
| Active speaker disconnects    | Host selects next speaker from unspoken participants       |
| Host disconnects              | Promote first participant to host role                     |
| Two users select next speaker | Firebase transaction — only first one succeeds             |
| Timer drift across clients    | Server-authoritative `slotEndsAt`, clients compute locally |
| All participants have spoken  | Reset `spokenUserIds` to empty array                       |
| Speaker exceeds time limit    | Timer shows "Time Expired", speaker manually ends slot     |
| Session link used after finish| Show "Meeting ended" state                                 |
| Browser tab inactive          | Re-sync on visibility change via Firebase reconnect        |

---

## 8. UX Polish

- 🔊 Sound notification when slot time expires
- 🟡 Yellow timer background at ≤15s remaining
- 🔴 Red timer background at ≤5s remaining
- Clear visual distinction between lobby / active / finished states
- Mobile-responsive layout
- Keyboard shortcuts (future):
  - `Space` → End slot
  - `R` → Raise hand

---

## 9. Implementation Phases

### Phase 1 — Foundation (Week 1)

| # | Task                                         | Est.  |
|---|----------------------------------------------|-------|
| 1 | Firebase project setup + env configuration   | 2h    |
| 2 | Firebase lib initialization (`lib/firebase.ts`, `lib/auth.ts`) | 2h |
| 3 | Session data operations (`lib/session.ts`)   | 3h    |
| 4 | `useSession` and `useAuth` hooks             | 3h    |
| 5 | Home page — create session flow              | 3h    |
| 6 | Join page — enter name and join              | 2h    |
| 7 | Basic meeting page with lobby view           | 3h    |

**Deliverable:** Host can create session, participants can join, all see lobby.

---

### Phase 2 — Meeting Flow (Week 2)

| # | Task                                         | Est.  |
|---|----------------------------------------------|-------|
| 1 | Active speaker display component             | 2h    |
| 2 | Timer component with color states            | 3h    |
| 3 | `useTimer` hook (local countdown)            | 2h    |
| 4 | Speaker selection with transaction logic     | 3h    |
| 5 | End slot + select next speaker flow          | 3h    |
| 6 | Participant list with status indicators      | 2h    |
| 7 | Host "Start Meeting" + "End Meeting" controls| 2h    |

**Deliverable:** Complete meeting flow — start, speak, timer, select next, end.

---

### Phase 3 — Polish & Edge Cases (Week 3)

| # | Task                                         | Est.  |
|---|----------------------------------------------|-------|
| 1 | Hand raise toggle + visual indicator         | 2h    |
| 2 | "Spoken" tracking and round reset logic      | 2h    |
| 3 | Disconnect handling (speaker & host)         | 3h    |
| 4 | Timer expired indicator + sound notification | 2h    |
| 5 | Mobile-responsive layout adjustments         | 3h    |
| 6 | Firebase security rules (basic)              | 1h    |
| 7 | End-to-end testing & bug fixes               | 4h    |

**Deliverable:** Production-ready MVP with edge case handling.

---

## 10. Deployment

1. Create Firebase project → enable Realtime Database + Anonymous Auth
2. Add Firebase credentials as Vercel environment variables
3. `vercel deploy` or push to connected Git repo
4. Set Firebase security rules
5. Share session links with team

---

## 11. Future Enhancements (Post-MVP)

| Priority | Feature                                  |
| -------- | ---------------------------------------- |
| High     | Speaking time analytics per participant  |
| High     | Auto-rotation mode (no manual selection) |
| Medium   | Meeting templates (save slot duration)   |
| Medium   | Slack/Teams notification integration     |
| Low      | Calendar integration                     |
| Low      | Historical meeting reports               |
| Low      | AI summary per speaker                   |

---

## 12. Success Criteria

After 1 month of internal usage:

- Meetings end on time ≥ 80%
- All participants speak in ≥ 90% of sessions
- Positive team feedback on meeting structure
- Reduced standup duration variance
