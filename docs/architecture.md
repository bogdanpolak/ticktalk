# Tick-Talk — Implementation Architecture

> Updated: 1 March 2026
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

| Layer          | Technology                                                        |
| -------------- | ----------------------------------------------------------------- |
| Frontend       | Next.js 16 (App Router), React 19                                 |
| Styling        | Tailwind CSS 4                                                    |
| State          | React `useState` / `useEffect`                                    |
| Business Logic | `lib/sessionLogic.ts` — pure functions, zero Firebase dependencies |
| Service Layer  | `lib/services/` — typed interfaces over Firebase & browser APIs   |
| Realtime       | Firebase Realtime Database SDK                                    |
| Auth           | Firebase Anonymous Auth (MVP)                                     |
| Hosting        | Vercel (free tier)                                                |
| Database       | Firebase Realtime Database                                        |
| Testing        | Vitest 4.x, @testing-library/react, jest-mock-extended            |

No custom backend server. Firebase handles real-time sync, state persistence, and concurrency via transactions.

---

## 2. Data Model

### Session

```json
sessions/{sessionId}: {
  hostId: string,
  createdAt: number,                   // Unix timestamp (ms) — set once at creation
  slotDurationSeconds: number,
  status: "lobby" | "active" | "finished",
  activeSpeakerId: string | null,
  slotEndsAt: number | null,          // Unix timestamp (ms)
  slotStartedAt: number | null,       // Unix timestamp (ms) when current speaker started
  spokenUserIds: string[],
  previousHostId: string | null,      // userId of previous host (set on host promotion)
  hostChangedAt: number | null,       // Unix timestamp (ms) of last host promotion
  presence: {
    [userId]: {
      lastSeen: number,               // SERVER_TIMESTAMP on connect
      status: "online" | "offline"
    }
  },
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
- `createdAt` is set once at session creation; never mutated.
- `totalSpokeDurationSeconds` accumulates across the session, never resets.
- `speakingHistory` records each individual speak slot with start/end/duration for analytics.
- `presence` tracks real-time online/offline state per participant; managed by `monitorPresence()`. Each client writes `online` on connect and `null` on disconnect via `onDisconnect().remove()`.
- `previousHostId` and `hostChangedAt` are written when host promotion occurs via `promoteHostOnDisconnect()`.
- Timer expiry shows an indicator but does NOT auto-advance; over-time display shows if speaker exceeds slot duration.
- Speaker manually ends slot; system calculates actual duration and stores in history.

---

## 3. Page Structure

All application source lives under `src/`. The `app/` directory follows Next.js App Router conventions and contains only routing files (`page.tsx`, `layout.tsx`) and colocated `_components/` private folders. View logic is extracted from `page.tsx` files into those subfolders, keeping pages thin.

```
src/
  app/
    _components/
      HomeForm.tsx              → Full home page UI and logic
      join/
        JoinView.tsx            → Full join page UI and logic
      meeting
        LoadingView.tsx         → Loading spinner
        ErrorView.tsx           → Error state with back link
        LobbyView.tsx           → Pre-meeting waiting room
        ActiveMeetingView.tsx   → Active meeting UI
        FinishedView.tsx        → Post-meeting summary/ended state
    join/[sessionId]/
      page.tsx                  → Resolves sessionId param, renders <JoinView>
    meeting/[sessionId]/
      page.tsx                  → Status router → delegates to view component
    globals.css
    layout.tsx
    page.tsx                    → Renders <HomeForm /> (≤ 10 lines)
  components/                   → Shared reusable UI components
  hooks/                        → React hooks (moved from app/hooks/)
  lib/                          → Firebase, services, business logic
  utils.tsx                     → Shared utilities (moved from app/utils.tsx)
tests/                          → Test files (root-level; @/* alias → src/)
```

### 3.1 Home Page (`/`)

- Name input field (pre-loaded from local storage if available)
- Slot duration selector with options:
  - 60 seconds (1:00)
  - 75 seconds (1:15)
  - 90 seconds (1:30)
  - 105 seconds (1:45)
  - 120 seconds (2:00) — default
  - 135 seconds (2:15)
  - 150 seconds (2:30)
  - 165 seconds (2:45)
  - 180 seconds (3:00)
  - Custom...
- Custom duration input field (appears when "Custom..." selected):
  - Pre-populated with 120 seconds (or last custom value from local storage)
  - Validation text: "Enter custom duration in seconds (30-3600)"
  - Validation on submit: 30-3600 seconds
- Settings pre-loaded from browser local storage on page load
- Focus management:
  - First-time users (no stored name): Focus on Name input
  - Returning users (stored name exists): Focus on "Create Session" button
- "Create Session" button → generates session in Firebase, saves settings to local storage, redirects to meeting page
- Session link displayed for sharing

### 3.2 Join Page (`/join/[sessionId]`)

- Name input field (pre-loaded from local storage if available)
- Settings pre-loaded from browser local storage on page load
- Focus management:
  - First-time users (no stored name): Focus on Name input
  - Returning users (stored name exists): Focus on "Join" button
- "Join" button → adds participant to Firebase session, saves settings to local storage, redirects to meeting page
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
  - "End My Slot" button (in MeetingControls)
  - Cumulative speaking time display
- Host sees:
  - "End Meeting" button (always visible, regardless of speaker status)
  - Same participant list as active speaker
  - If clicking End Meeting with unspoken participants: warning dialog "X participants haven't spoken yet. End meeting anyway?"
- Non-active, non-host participants:
  - MeetingControls component is hidden
  - No placeholder or message shown
  - SpeakerSelector visible for next speaker selection

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

> **Note:** All Firebase operations are now encapsulated inside `lib/services/sessionService.ts`. Application code calls `sessionService.createSession()`, `sessionService.selectNextSpeaker()`, etc. — never the Firebase SDK directly. The snippets below document the underlying logic.

```ts
const sessionId = push(ref(db, 'sessions')).key
set(ref(db, `sessions/${sessionId}`), {
  hostId: currentUserId,
  createdAt: Date.now(),
  slotDurationSeconds: slotDuration,
  status: 'lobby',
  activeSpeakerId: null,
  slotEndsAt: null,
  slotStartedAt: null,
  spokenUserIds: [],
  previousHostId: null,
  hostChangedAt: null,
  presence: {},
  participants: {
    [currentUserId]: {
      name: name.trim(),
      role: 'host',
      isHandRaised: false,
      totalSpokeDurationSeconds: 0,
      speakingHistory: []
    }
  }
})
```

### 4.2 Joining Session (Participant)

```ts
const trimmedName = name.trim()
if (!trimmedName) throw new Error('Participant name is required')

set(ref(db, `sessions/${sessionId}/participants/${userId}`), {
  name: trimmedName,
  role: 'participant',
  isHandRaised: false,
  totalSpokeDurationSeconds: 0,
  speakingHistory: []
})
```

### 4.3 Real-Time Subscription

The subscription is delegated to `sessionService.subscribeSession(sessionId, onData, onError)`, which returns an unsubscribe function. The raw Firebase `onValue` code now lives only inside `sessionService.ts`:

```ts
// Inside sessionService.subscribeSession():
onValue(ref(db, `sessions/${sessionId}`), (snapshot) => {
  onData(snapshot.val())
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

End slot is executed as a single atomic `runTransaction` (not two separate `update()` calls) to ensure the participant history update and session field clear happen together:

```ts
runTransaction(ref(db, `sessions/${sessionId}`), (session) => {
  if (!session) return session
  const now = Date.now()
  const slotStartedAt = session.slotStartedAt ?? now
  const durationSeconds = Math.round((now - slotStartedAt) / 1000)
  const speaker = session.participants[activeSpeakerId]

  session.participants[activeSpeakerId] = {
    ...speaker,
    totalSpokeDurationSeconds: (speaker.totalSpokeDurationSeconds || 0) + durationSeconds,
    speakingHistory: [
      ...(speaker.speakingHistory || []),
      { startTime: slotStartedAt, endTime: now, durationSeconds }
    ]
  }
  session.activeSpeakerId = null
  session.slotEndsAt = null
  session.slotStartedAt = null
  return session
})
```

After ending slot, the speaker selects the next participant (combined into one action for better UX — speaker picks next, which triggers 4.4). If no eligible participants remain, the selector is hidden and the host ends the meeting. System automatically calculates and stores actual duration in speaking history.

### 4.6 Timer Display

Client-side countdown computed from `slotEndsAt`:

```ts
const now = Date.now()
const elapsed = now - session.slotStartedAt
const remaining = (session.slotEndsAt - now) / 1000
const slotDuration = session.slotDurationSeconds

// Calculate percentage elapsed
const percentElapsed = (elapsed / (slotDuration * 1000)) * 100

// Calculate thresholds
const warningThreshold = Math.ceil(slotDuration * 0.25) // 25% remaining
const criticalThreshold = Math.max(Math.ceil(slotDuration * 0.125), 5) // 12.5% remaining, min 5s

if (remaining > 0) {
  // Show countdown: MM:SS
  displayCountdown(Math.ceil(remaining))
  
  // Color states based on remaining time:
  if (remaining <= criticalThreshold) {
    // Critical state (red) - play sound on transition
    displayCritical()
  } else if (remaining <= warningThreshold) {
    // Warning state (yellow) - play sound on transition  
    displayWarning()
  } else {
    // Normal state (green)
    displayNormal()
  }
} else if (remaining <= 0 && remaining > -0.5) {
  // Show "Time Expired" indicator - play sound
  displayExpired()
} else {
  // Show over-time: +M:SS format in red
  displayOverTime(Math.abs(remaining))
}
```

- Tick locally every 100ms for smooth animation
- Timer math (`computeRemainingSeconds`, `computeTimerState`) is implemented as pure functions in `lib/sessionLogic.ts` and consumed by `useTimer` via `timeService`
- `Date.now()` and interval management are abstracted through `timeService` (enables fake-timer testing)
- **Countdown state**: 
  - Normal (green): > 25% remaining
  - Warning (yellow): ≤ 25% remaining
  - Critical (red): ≤ 12.5% remaining (minimum 5 seconds)
- **Expired state**: Red pulse with "⏰ Time Expired" message when reaching 0
- **Over-time state**: Switch to "+M:SS" format (e.g., "+1:45"), distinct red visual state when negative
- **Sound notifications**: Play at warning threshold, critical threshold, and expiry via `audioService`
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

### 4.9 Presence Tracking & Host Promotion

**`monitorPresence(sessionId, userId)`** — called on meeting page mount:
- Writes `{ lastSeen: serverTimestamp(), status: 'online' }` to `sessions/{sessionId}/presence/{userId}`
- Registers `onDisconnect().remove()` on the same ref so the node is deleted automatically on disconnect
- Returns a cleanup function that explicitly sets presence to `null`

**`promoteHostOnDisconnect(sessionId, disconnectedHostId)`** — called when host disconnect is detected:
- Runs a `runTransaction` on the session root
- Aborts (no-op) if `presence[disconnectedHostId].status` is still `'online'`
- Picks candidate: alphabetically-first `userId` (excluding `disconnectedHostId`) among participants
- Writes: `session.hostId = candidateId`, `session.participants[candidateId].role = 'host'`, `session.previousHostId = disconnectedHostId`, `session.hostChangedAt = Date.now()`

**`shouldPromoteNewHost(session, hostId)`** — pure function in `lib/sessionLogic.ts`:
- Returns `true` when host entry is absent from `participants`, or when `presence[hostId].status === 'offline'`
- Returns `false` when no other participants exist as promotion candidates

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

## 6. Local Storage Management

### 6.1 Storage Keys

Storage key constants are encapsulated within `storageService` (`lib/services/storageService.ts`) and not exported directly. Internally they map to:
- `ticktalk_userName`
- `ticktalk_slotDuration`
- `ticktalk_isCustomDuration`

### 6.2 Save Settings

Save to local storage only on successful session creation or join. Delegated to `storageService`:

```ts
storageService.saveSettings(name, duration, isCustom)
```

The implementation lives in `lib/services/storageService.ts`.

### 6.3 Load Settings

Load from local storage on page mount. Delegated to `storageService`:

```ts
const settings = storageService.loadSettings()
// returns StoredSettings: { userName, slotDuration, isCustomDuration }
```

`StoredSettings` is exported from `lib/services/storageService.ts`. The implementation is SSR-safe (guards for `typeof window === 'undefined'`).

> **Note:** `hasStoredName` is computed as `userName.trim().length > 0`. A stored value of only whitespace is equivalent to an empty name for focus management and pre-fill purposes.

### 6.4 Focus Management

```ts
useEffect(() => {
  const settings = storageService.loadSettings()
  
  // Pre-populate form fields
  setName(settings.userName)
  setDuration(settings.slotDuration)
  setIsCustom(settings.isCustomDuration)
  
  // Focus management
  if (settings.userName.trim()) {
    // Returning user: focus on action button
    actionButtonRef.current?.focus()
  } else {
    // First-time user (or whitespace-only stored name): focus on name input
    nameInputRef.current?.focus()
  }
}, [])
```

### 6.5 Storage Scope

- Storage is per-browser, not per-user
- Same settings shared across Home and Join pages
- No explicit clear UI; users can clear via browser settings
- Settings persist across sessions on same device/browser

---

## 7. Component Breakdown

```
src/components/
  Timer.tsx                → Countdown + over-time display with color states
  ParticipantList.tsx      → List with status + total time badge; sorted: active speaker first, then hand-raised (alpha), then others (alpha)
  SpeakerSelector.tsx      → Pick next speaker from eligible list; accepts optional sessionService for DI
  HandRaiseButton.tsx      → Toggle hand raise; accepts optional sessionService for DI
  MeetingControls.tsx      → Host/speaker action buttons; accepts optional sessionService for DI
  MeetingSummary.tsx       → Finished state view with speaking times + overtime indicator
  EndMeetingDialog.tsx     → Confirmation modal for unspoken participants warning

src/lib/
  firebase.ts              → Firebase app initialization
  session.ts               → Facade — re-exports types, delegates to lib/services/sessionService
  sessionLogic.ts          → Pure logic functions (no Firebase): moveToNextSpeaker, computeRemainingSeconds,
                             computeTimerState, buildParticipantRows, validateSessionTransition,
                             shouldPromoteNewHost
  auth.ts                  → Facade — re-exports helpers, delegates to lib/services/authService
  storage.ts               → Local storage helpers (delegates to lib/services/storageService)
  audio.ts                 → Audio helpers (delegates to lib/services/audioService)
  services/
    sessionService.ts      → Firebase session operations (sole owner of session Firebase calls)
    sessionService.mock.ts → Mock factory for testing (createMockSessionService)
    authService.ts         → Firebase anonymous auth operations
    authService.mock.ts    → Mock factory for testing (createMockAuthService)
    storageService.ts      → SSR-safe localStorage abstraction; exports StoredSettings type
    audioService.ts        → HTML5 Audio abstraction; AudioService.setEnabled() for test silence
    timeService.ts         → Abstracts Date.now(), setInterval/clearInterval, computeRemainingSeconds()
    index.ts               → Central re-export for all service interfaces and mocks
  __tests__/
    setup.ts               → Global Vitest setup (fake timers, localStorage mock, Audio mock)
    mocks.ts               → Shared mock factories for services, session data, and browser APIs

src/hooks/
  useSession.ts            → Subscribe to session updates via sessionService.subscribeSession();
                             accepts optional { sessionService } for testability
  useTimer.ts              → Local countdown/over-time logic; accepts optional { audioService, timeService }
  useAuth.ts               → Current user identity; accepts optional { authService }
  useLocalStorage.ts       → Hook for loading/saving settings with focus management

src/utils.tsx              → Shared utility functions (calculateAgo, formatDuration)
```

---

## 8. Edge Cases

| Case                          | Handling                                                   |
| ----------------------------- | ---------------------------------------------------------- |
| Active speaker disconnects    | Host selects next speaker from unspoken participants                                              |
| Host disconnects              | `promoteHostOnDisconnect` runs a Firebase transaction; promotes alphabetically-first participant (by userId) with non-offline presence; records `previousHostId` + `hostChangedAt` |
| Two users select next speaker | Firebase transaction — only first one succeeds                                                    |
| Timer drift across clients    | Server-authoritative `slotEndsAt`, clients compute locally |
| All participants have spoken  | Prevent selection; host ends meeting                       |
| Speaker exceeds time limit    | Timer shows "Time Expired"; summary shows overtime indicator |
| Session link used after finish| Show "Meeting ended" state                                 |
| Browser tab inactive          | Re-sync on visibility change via Firebase reconnect        |

---

## 9. UX Polish

- 🔊 Sound notifications:
  - Warning threshold (25% remaining)
  - Critical threshold (12.5% remaining, min 5s)
  - Expired (time reached 0)
- 🟢 Normal timer state: > 25% remaining
- 🟡 Warning timer state: ≤ 25% remaining (percentage-based)
- 🔴 Critical timer state: ≤ 12.5% remaining (percentage-based, min 5s)
- Clear visual distinction between lobby / active / finished states
- Mobile-responsive layout
- Focus management for quick session start
- MeetingControls visibility optimized for non-active participants
- Keyboard shortcuts (future):
  - `Space` → End slot
  - `R` → Raise hand

---

## 10. Implementation Tasks

See [docs/tasks.md](tasks.md) for the complete task list with tracking and status updates.

All 39 tasks (REQ-0001 through REQ-0039) must be completed to achieve a production-ready MVP.

REQ-0039 (completed) covers the `src/` folder restructure and minimal `page.tsx` pattern — see [docs/stories/completed/REQ-0039-src-folder-restructure.md](stories/completed/REQ-0039-src-folder-restructure.md).

Unit test implementation is tracked separately in [docs/unit-tests-plan-v2.md](unit-tests-plan-v2.md). Commits `9ce4d1b` through `5b0d188` implement Phase 1 (service abstractions + pure logic extraction) and Tiers 1–3 of the test suite.

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

At MVP completion (all 39 tasks marked ✅):

- All core features functional (create, join, speak, timer with over-time, end meeting with warnings)
- Custom duration selector with 10 options + custom input (30-3600s)
- Local storage persistence for quick session start (name + duration)
- Focus management for returning users (keyboard-only workflow)
- Percentage-based timer thresholds (25% warning, 12.5% critical)
- Sound notifications at warning, critical, and expired states
- MeetingControls visibility optimized (hidden for non-active, non-host participants)
- Speaking duration tracking and Meeting Summary view working
- Host fully participates as speaker with same capabilities as participants
- Firebase real-time sync working across participants
- Over-time display and speaking time analytics working
- Mobile-responsive UI with no critical layout issues
- Edge cases handled (disconnects, concurrent actions, over-time scenarios)
- Code ready for internal team testing
- Unit test coverage: lines/functions/statements ≥ 80%, branches ≥ 75% (`npm run test:coverage`)
- Unit test suite: Tier 1 (utilities), Tier 2 (hooks), and Tier 3 (business logic) all passing
