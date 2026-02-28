# Plan: Unit Tests with Refactored Abstractions

**TL;DR**: Create service layer abstractions to decouple Firebase/browser APIs from business logic → establish test infrastructure (Vitest + mocks) → systematically write tests in 4 tiers (utilities → hooks → business logic → components). This results in fast, maintainable unit tests with minimal coupling. Estimated refactor effort: 4-6 hours; test writing: 8-12 hours.

**Key Decisions Applied**:
- ✅ Full coverage approach (~120-135 tests)
- ✅ Refactor-first strategy (cleaner testable code)
- ✅ Service layer for Firebase (easier mocking, better separation of concerns)

---

## Phase 1: Create Service Layer & Extract Pure Logic (Refactoring)

**Goal**: Break tight coupling so tests don't need Firebase SDK installed.

### Step 1: Create Firebase Service Abstraction Layer

Create `lib/services/sessionService.ts`:
- Abstract all Firebase operations in `lib/session.ts`
- Export interface `SessionService` with methods:
  - `createSession()`, `joinSession()`, `getSession()`
  - `selectNextSpeaker()`, `endLastSlot()`, `endMeeting()`
  - `toggleHandRaise()`, `monitorPresence()`
- Keep Firebase-specific code **within** sessionService.ts only
- Export a `.mock.ts` version for testing

Create `lib/services/authService.ts`:
- Abstract `signInAnonymously()` and user state logic from `lib/auth.ts` and `app/hooks/useAuth.ts`
- Export interface with `getCurrentUserId()`, `onAuthStateChange()`

Create `lib/services/index.ts`:
- Central export point for all services
- In tests, import mocks instead of real implementations

### Step 2: Extract Pure Logic from lib/session.ts

Create `lib/sessionLogic.ts`:
- Extract pure functions (no Firebase calls):
  - `moveToNextSpeaker(session, nextSpeakerId): Session` 
  - `computeTimerState(remaining, duration): {isExpired, isOvertime}`
  - `buildParticipantRows(session): ParticipantRow[]`
  - `validateSessionTransition(current, next): boolean`
  - `shouldPromoteNewHost(session): boolean`

**Benefit**: These functions are 100% testable, zero mocking needed.

### Step 3: Create Browser API Service Layer

Create `lib/services/storageService.ts`:
- Wrap `localStorage` calls from `lib/storage.ts` and `app/hooks/useLocalStorage.ts`
- Easy to mock (return fixed objects in tests)

Create `lib/services/audioService.ts`:
- Wrap HTML5 Audio API from `lib/audio.ts`
- Provide silence option for tests

Create `lib/services/timeService.ts`:
- Abstract `Date.now()` and `setInterval/clearInterval`
- Allows fake-timer testing without manual jest config

### Step 4: Update Hooks to Use Services

Refactor `app/hooks/useAuth.ts`:
- Replace `signInAnonymously()` with `authService.getCurrentUserId()`
- Inject `AuthService` as dependency (or use context provider)

Refactor `app/hooks/useSession.ts`:
- Replace `onValue(ref())` with `sessionService.monitorPresence()`
- Makes listener logic centralized + testable

Refactor `app/hooks/useTimer.ts`:
- Use `timeService.setInterval()` instead of native
- Extract pure `computeRemainingSeconds()` to `lib/sessionLogic.ts`

### Step 5: Update Components to Accept Injected Services

Update `components/HandRaiseButton.tsx`:
- Accept `sessionService: Pick<SessionService, 'toggleHandRaise'>` as prop
- Or use context provider for services

Update `components/SpeakerSelector.tsx` and `components/MeetingControls.tsx`:
- Same pattern: inject needed service methods as props or via context

---

## Phase 2: Test Infrastructure Setup

### Step 1: Install Dependencies

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/user-event @testing-library/dom
npm install -D @testing-library/jest-dom
npm install -D jest-mock-extended
npm install -D @types/node
```

### Step 2: Create Vitest Configuration

Create `vitest.config.ts`:
- Extend from Next.js config
- Set up React + TypeScript support
- Configure globals (describe, test, expect)
- Set up JSDOM or Node environment as needed
- Configure coverage thresholds

Update `package.json`:
- Add scripts: `"test": "vitest"`, `"test:ui": "vitest --ui"`, `"test:coverage": "vitest --coverage"`

### Step 3: Create Test Setup & Utilities

Create `lib/__tests__/setup.ts`:
- Global test hooks (beforeEach, afterEach)
- Fake timers setup
- Reset mocks before each test

Create `lib/__tests__/mocks.ts`:
- Mock factory functions:
  - `createMockSession()`, `createMockParticipant()`
  - `createMockSessionService()` (returns jest MockProxy)
  - `createMockAuthService()`
  - Mock localStorage, Audio API

Create `__mocks__/firebase.ts`, `__mocks__/firebase/auth.ts`, `__mocks__/firebase/database.ts`:
- Mock Firebase SDK (used if tests still directly import Firebase)
- Optional if service layer is complete

---

## Phase 3: Write Tests (4 Tiers, ~120-135 tests)

### TIER 1: Pure Utilities (~10-12 tests) ✅ EASY, FAST

**`tests/lib/utils.test.ts`** - Test `app/utils.tsx`
- `formatDuration(0)` returns "0:00"
- `formatDuration(125)` returns "2:05"
- `formatDuration(3661)` returns "1:01:01"
- `calculateAgo(timestamp)` returns correct relative time
- `calculateAgo()` updates over time

**`tests/lib/sessionLogic.test.ts`** - Test pure functions extracted from `lib/session.ts`
- `moveToNextSpeaker(session, userId)` updates activeUser + timing
- `moveToNextSpeaker()` cycles through all participants
- `computeTimerState(remaining, duration)` returns isExpired, isOvertime correctly
- `buildParticipantRows()` sorts by speaking order
- `validateSessionTransition()` rejects invalid moves
- `shouldPromoteNewHost(session)` detects when host disconnected

**`tests/lib/storage.test.ts`** - Test `lib/storage.ts`
- `saveSettings()` stores to localStorage
- `loadSettings()` retrieves with defaults
- `loadSettings()` handles missing values gracefully

**`tests/lib/audio.test.ts`** - Test `lib/audio.ts`
- `playTimerExpiredSound()` calls Audio API
- Sound plays without errors
- Multiple calls handled correctly

---

### TIER 2: Hooks - Easy (~12-15 tests) ✅ TESTABLE, MINIMAL MOCKS

**`tests/hooks/useLocalStorage.test.ts`** - Test `app/hooks/useLocalStorage.ts`
- Hook loads settings on mount
- Returns `hasStoredName: true` when name exists
- Returns `hasStoredName: false` when empty
- Computes `isReady: true`
- Handles localStorage not available gracefully

**`tests/hooks/useTimer.test.ts`** - Test `app/hooks/useTimer.ts` (MOST COMPLEX TESTABLE HOOK)
- Computes remaining seconds correctly
- `isExpired: true` when remaining ≤ 0
- `isOverTime: true` when remaining < 0
- `showWarning: true` at 25% threshold
- `showCritical: true` at 12.5% or 5s minimum
- Plays sound exactly once when expires
- Resets sound flag when timer restarts
- Returns `isIdleState: true` when no slotEndsAt
- Clears interval on unmount
- Correctly syncs with prop changes

---

### TIER 2: Hooks - Medium (~8-10 tests) ⚠️ MEDIUM COMPLEXITY

**`tests/hooks/useAuth.test.ts`** - Test `app/hooks/useAuth.ts`
- Returns loading state initially (`userId: null`)
- Calls `authService.getCurrentUserId()` on mount
- Returns userId after auth succeeds
- Returns error state on auth failure
- Uses cached user from storage if available
- Does NOT re-authenticate if userId already set
- Cleanup prevents state updates after unmount

---

### TIER 3: Business Logic (~20-25 tests) 🔴 COMPLEX, HEAVY LOGIC

**`tests/lib/sessionService.test.ts`** - Test `lib/services/sessionService.ts`

**For `createSession()`**:
- Creates session with unique sessionId
- Set host, currentUser, participants list
- Initializes empty slots/speaking history
- Returns sessionId

**For `joinSession(sessionId, userId)`**:
- Fetches existing session
- Adds participant to list
- Raises error if session not found
- Rejects if too many participants

**For `selectNextSpeaker(sessionId, nextSpeakerId)`**:
- Updates activeUser → nextSpeakerId
- Records timestamp
- Calls Firebase update
- Validates speaker exists in participants

**For `endLastSlot(sessionId)`**:
- Computes speaking duration correctly
- Updates participant's totalTime
- Clears currentUser (no one speaking)
- Stores in completion list

**For `endMeeting(sessionId)`**:
- Sets meetingEndedAt timestamp
- Marks host as host (preserves for history)
- Prevents new joins

**For `monitorPresence(sessionId, onDisconnect)`**:
- Returns unsubscribe function
- Detects host disconnect
- Calls `shouldPromoteNewHost()` logic
- Promotes participant to host if needed
- Handles cleanup correctly

---

### TIER 2: Hooks - Hard (~12-15 tests) 🔴 REAL-TIME LISTENER

**`tests/hooks/useSession.test.ts`** - Test `app/hooks/useSession.ts`

- Returns loading initially
- Calls `sessionService.monitorPresence(sessionId)` with dependency
- Returns session data after load
- Updates when session changes
- Detects `speakerDisconnected` flag
- Handles session not found (404)
- Handles Firebase errors gracefully
- Unsubscribes listener on unmount
- Unsubscribes + resubscribes when sessionId changes
- Skips subscription if `sessionId: null`

---

### TIER 4: Components - Pure Presentation (~16-20 tests) ✅ EASY, SNAPSHOT-ABLE

**`tests/components/ActiveSpeaker.test.tsx`** - Test `components/ActiveSpeaker.tsx`
- Renders active speaker info
- Displays correct name, duration, speaking time
- Shows "waiting for speaker" when empty
- Handles missing data gracefully

**`tests/components/ParticipantList.test.tsx`** - Test `components/ParticipantList.tsx`
- Renders list of participants
- Highlights active speaker
- Shows total speaking time for each
- Shows hand raised indicator
- Renders "no participants" empty state

**`tests/components/Timer.test.tsx`** - Test `components/Timer.tsx`
- Uses `useTimer` hook correctly
- Displays time in MM:SS format
- Shows warning color at threshold
- Shows critical color when expired
- Shows OT badge for overtime

**`tests/components/MeetingSummary.test.tsx`** - Test `components/MeetingSummary.tsx`
- Renders summary with session data
- Shows total time, participant count, duration
- Displays each participant's speaking time
- Calculates percentages correctly

**`tests/components/EndMeetingDialog.test.tsx`** - Test `components/EndMeetingDialog.tsx`
- Shows when `isOpen: true`
- Hidden when `isOpen: false`
- Calls `onConfirm()` when confirm clicked
- Calls `onCancel()` when cancel clicked

---

### TIER 4: Components - Integrated (~12-15 tests) ⚠️ REQUIRES SERVICE PROPS

**`tests/components/SpeakerSelector.test.tsx`** - Test `components/SpeakerSelector.tsx`
- Renders list of selectable participants
- Disables current speaker
- Calls `sessionService.selectNextSpeaker(nextUserId)` on click
- Handles not found error
- Shows loading state during transition

**`tests/components/MeetingControls.test.tsx`** - Test `components/MeetingControls.tsx`
- "End Slot" button calls `sessionService.endLastSlot()`
- "End Meeting" button shows confirmation dialog
- Dialog confirms calls `sessionService.endMeeting()`
- Disables buttons while loading

**`tests/components/HandRaiseButton.test.tsx`** - Test `components/HandRaiseButton.tsx`
- Toggle state updates on click
- Calls `sessionService.toggleHandRaise(sessionId, userId)`
- Shows raised/lowered visual state
- Handles errors gracefully

---

## Phase 4: Test Patterns & Best Practices

### Test File Structure
```
tests/
  lib/
    utils.test.ts
    sessionLogic.test.ts
    storage.test.ts
    audio.test.ts
    sessionService.test.ts
  hooks/
    useLocalStorage.test.ts
    useTimer.test.ts
    useAuth.test.ts
    useSession.test.ts
  components/
    ActiveSpeaker.test.tsx
    ParticipantList.test.tsx
    Timer.test.tsx
    ... (others)
  setup.ts (global)
  mocks.ts (factories)
```

### Mock Patterns

**Pure Functions**: No mocks needed
```ts
test('formatDuration', () => {
  expect(formatDuration(125)).toBe('2:05');
});
```

**Hooks**: Use `renderHook` from @testing-library/react
```ts
const { result } = renderHook(() => useTimer(...props));
expect(result.current.remaining).toBe(60);
```

**Components**: Use `render` from @testing-library/react
```ts
render(<Timer slotEndsAt={...} />);
expect(screen.getByText(/2:05/)).toBeInTheDocument();
```

**Firebase Services**: Inject mocks via props or context
```ts
const mockService = createMockSessionService();
render(<SpeakerSelector sessionService={mockService} />);
```

### Test Speed Optimizations
- Use fake timers for `useTimer` tests (no real 1000ms waits)
- Mock localStorage instead of using real browser storage
- Mock Firebase service instead of hitting backend
- Use shallow renders where possible
- Avoid real Audio API (mock it)

---

## Verification

### Post-Refactoring Checklist
- ✅ All Firebase imports removed from hooks (moved to services)
- ✅ All pure logic extracted to `sessionLogic.ts`
- ✅ All browser APIs wrapped (storage, audio, time)
- ✅ Services are mockable (interfaces exported)
- ✅ Zero circular dependencies

### Test Execution
```bash
# Run all tests
npm run test

# Watch mode during development
npm run test -- --watch

# Coverage report
npm run test:coverage

# UI dashboard
npm run test:ui
```

### Coverage Targets
- Functions: ≥ 90% (aim for utility functions)
- Lines: ≥ 80% (hooks/components)
- Branches: ≥ 75% (complex conditionals)

### Sample Commands to Verify Tests Work
```bash
# After creating first test file (utils.test.ts)
npm run test -- tests/lib/utils.test.ts

# After all Tier 1 tests
npm run test tests/lib/ tests/hooks/useLocalStorage.test.ts
npm run test:coverage
```

---

## Decisions & Rationale

| Decision | Why |
|----------|-----|
| **Vitest over Jest** | Better Next.js 16 support, faster, ESM-native |
| **Service layer abstraction** | Isolates Firebase complexity, enables meaningful unit tests without SDK mocking nightmare |
| **Extract sessionLogic.ts** | Pure functions testable with zero mocks, significant complexity moved there |
| **Refactor BEFORE tests** | Service layer is foundational; cleaner to refactor than write tests with tight coupling |
| **Tier-based approach** | Tests easiest→hardest; early wins build momentum |
| **No integration tests in this phase** | You asked for "fast unit tests only"; integration tests wait for later |
