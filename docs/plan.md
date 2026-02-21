# Tick-Talk — Implementation Plan

> Updated: February 2026
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
  slotStartedAt: number | null,       // Unix timestamp (ms) when current speaker started
  spokenUserIds: string[],
  participants: {
    [userId]: {
      name: string,
      role: "host" | "participant",
      isHandRaised: boolean,
      totalSpokeDurationSeconds: number,   // Cumulative across the session
      speakingHistory: [
        {
          startTime: number,                // Unix timestamp (ms) when this slot started
          endTime: number,                  // Unix timestamp (ms) when this slot ended
          durationSeconds: number           // Calculated duration
        }
      ]
    }
  }
}
```

### Key rules

- `spokenUserIds` tracks who has already spoken in the session (no multi-round reset).
- `slotEndsAt` is authoritative — clients compute countdown locally and display over-time if exceeded.
- `slotStartedAt` marks when current speaker's slot began (set on speaker selection).
- `totalSpokeDurationSeconds` accumulates across the session, never resets.
- `speakingHistory` records each individual speak slot with start/end/duration for analytics.
- Timer expiry shows an indicator but does NOT auto-advance; over-time display shows if speaker exceeds slot duration.
- Speaker manually ends slot; system calculates actual duration and stores in history.

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
- Layout order: Participants list -> Timer -> Meeting controls -> Hand raise -> Speaker selector -> Host end meeting
- Participant list (shows active speaker indicator + total time per participant)
- Countdown timer (large, central) with over-time display if speaker exceeds slot duration
- "⏰ Time Expired" indicator when timer reaches 0, then switches to over-time display "+0:MM"
- Participant list with:
  - ✋ Hand raised indicator
  - ✅ Already spoken indicator
  - 🎤 Currently speaking indicator
  - 📊 Total speaking time per participant
- Active speaker sees:
  - "End My Slot" button
  - Cumulative speaking time display
- Host sees:
  - "End Meeting" button (always enabled)
  - Same participant list as active speaker
  - If clicking End Meeting with unspoken participants: warning dialog "X participants haven't spoken yet. End meeting anyway?"

**Finished state** (`status: "finished"`) or End Meeting clicked:
- Meeting Summary view:
  - List of all participants with:
    - Name
    - Total speaking time (cumulative)
    - Over-time indicator (if applicable)
  - Host can close to return to active meeting or fully end session

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

When the active speaker (or host for any speaker, including themselves) selects the next speaker:

```ts
runTransaction(ref(db, `sessions/${sessionId}`), (session) => {
  if (!session) return
  // Validate: nextSpeakerId not in spokenUserIds
  if (session.spokenUserIds?.includes(nextSpeakerId)) return
  
  const participantIds = Object.keys(session.participants)
  if ((session.spokenUserIds || []).length >= participantIds.length) return

  session.activeSpeakerId = nextSpeakerId
  session.slotStartedAt = Date.now()  // Mark start of this speaker's slot
  session.slotEndsAt = Date.now() + session.slotDurationSeconds * 1000
  session.spokenUserIds = [...(session.spokenUserIds || []), nextSpeakerId]
  
  return session
})
```

Transaction ensures only one concurrent selection succeeds. Host can select themselves or others.

### 4.5 End Slot

```ts
const now = Date.now()
const durationMs = now - session.slotStartedAt
const durationSeconds = Math.round(durationMs / 1000)

update(ref(db, `sessions/${sessionId}/participants/${activeSpeakerId}`), {
  totalSpokeDurationSeconds: (participant.totalSpokeDurationSeconds || 0) + durationSeconds,
  speakingHistory: [
    ...participant.speakingHistory,
    {
      startTime: session.slotStartedAt,
      endTime: now,
      durationSeconds: durationSeconds
    }
  ]
})

update(ref(db, `sessions/${sessionId}`), {
  activeSpeakerId: null,
  slotEndsAt: null,
  slotStartedAt: null
})
```

After ending slot, the speaker selects the next participant (combined into one action for better UX — speaker picks next, which triggers 4.4). If no eligible participants remain, the selector is hidden and the host ends the meeting. System automatically calculates and stores actual duration in speaking history.

### 4.6 Timer Display

Client-side countdown computed from `slotEndsAt`:

```ts
const now = Date.now()
const elapsed = now - session.slotStartedAt
const remaining = (session.slotEndsAt - now) / 1000

if (remaining > 0) {
  // Show countdown: MM:SS
  displayCountdown(Math.ceil(remaining))
  // Color states: green → yellow (15s) → red (5s)
} else if (remaining <= 0 && remaining > -0.5) {
  // Show "Time Expired" indicator
  displayExpired()
} else {
  // Show over-time: +M:SS format in red
  displayOverTime(Math.abs(remaining))
}
```

- Tick locally every 100ms for smooth animation
- **Countdown state**: Green → Yellow (≤15s) → Red (≤5s)
- **Expired state**: Red pulse with "⏰ Time Expired" message when reaching 0
- **Over-time state**: Switch to "+M:SS" format (e.g., "+1:45"), distinct red visual state when negative
- No auto-advance — speaker stays active until they end their slot
- Both countdown and over-time are computed and displayed client-side; cleared on slot end

### 4.7 Hand Raise

```ts
update(ref(db, `sessions/${sessionId}/participants/${userId}`), {
  isHandRaised: !currentState
})
```

### 4.8 End Meeting with Unspoken Warning

When host clicks "End Meeting" button:

```ts
const spokenCount = session.spokenUserIds.length || 0
const totalParticipants = Object.keys(session.participants).length
const unspokenIds = Object.keys(session.participants).filter(
  id => !session.spokenUserIds?.includes(id)
)

if (unspokenIds.length > 0) {
  // Show confirmation dialog:
  // "X participant(s) haven't spoken yet. End meeting anyway?"
  // [Cancel] [End Meeting]
  showConfirmDialog()
} else {
  // Immediately end meeting
  endMeeting()
}

function endMeeting() {
  update(ref(db, `sessions/${sessionId}`), {
    status: 'finished',
    activeSpeakerId: null,
    slotEndsAt: null
  })
  // Display Meeting Summary view
}
```

- "End Meeting" button is **always enabled** (even during active speaking)
- Warning checks if there are participants who haven't spoken in current round
- Dialog is dismissible; user can cancel or confirm
- No override needed — all participants can see who hasn't spoken via indicators

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

## 7. Component Breakdown

```
components/
  Timer.tsx                → Countdown + over-time display with color states
  ParticipantList.tsx      → List with status + total time badge (includes active speaker)
  SpeakerSelector.tsx      → Pick next speaker from eligible list (host + active speaker)
  HandRaiseButton.tsx      → Toggle hand raise
  MeetingControls.tsx      → Host/speaker action buttons
  MeetingSummary.tsx       → Finished state view with speaking times + overtime indicator
  EndMeetingDialog.tsx     → Confirmation modal for unspoken participants warning
  LobbyView.tsx            → Pre-meeting waiting room

lib/
  firebase.ts              → Firebase app initialization
  session.ts               → Session CRUD operations + time tracking helpers
  auth.ts                  → Anonymous auth helper

hooks/
  useSession.ts            → Subscribe to session updates
  useTimer.ts              → Local countdown/over-time logic with display format
  useAuth.ts               → Current user identity
```

---

## 8. Edge Cases

| Case                          | Handling                                                   |
| ----------------------------- | ---------------------------------------------------------- |
| Active speaker disconnects    | Host selects next speaker from unspoken participants       |
| Host disconnects              | Promote first participant to host role                     |
| Two users select next speaker | Firebase transaction — only first one succeeds             |
| Timer drift across clients    | Server-authoritative `slotEndsAt`, clients compute locally |
| All participants have spoken  | Prevent selection; host ends meeting                       |
| Speaker exceeds time limit    | Timer shows "Time Expired"; summary shows overtime indicator |
| Session link used after finish| Show "Meeting ended" state                                 |
| Browser tab inactive          | Re-sync on visibility change via Firebase reconnect        |

---

## 9. UX Polish

- 🔊 Sound notification when slot time expires
- 🟡 Yellow timer background at ≤15s remaining
- 🔴 Red timer background at ≤5s remaining
- Clear visual distinction between lobby / active / finished states
- Mobile-responsive layout
- Keyboard shortcuts (future):
  - `Space` → End slot
  - `R` → Raise hand

---

## 10. Implementation Tasks

See [docs/tasks.md](tasks.md) for the complete task list with tracking and status updates.

All 32 tasks must be completed to achieve a production-ready MVP.

---

## 11. Deployment

1. Create Firebase project → enable Realtime Database + Anonymous Auth
2. Add Firebase credentials as Vercel environment variables
3. `vercel deploy` or push to connected Git repo
4. Set Firebase security rules
5. Share session links with team

---

## 12. Future Enhancements (Post-MVP)

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

## 13. Success Criteria

At MVP completion (all 32 tasks marked ✅):

- All core features functional (create, join, speak, timer with over-time, end meeting with warnings)
- Speaking duration tracking and Meeting Summary view working
- Host fully participates as speaker with same capabilities as participants
- Firebase real-time sync working across participants
- Over-time display and speaking time analytics working
- Mobile-responsive UI with no critical layout issues
- Edge cases handled (disconnects, concurrent actions, over-time scenarios)
- Sound notification on timer expiry
- Code ready for internal team testing
