# Plan: Unit Testing & Refactoring Implementation

This plan adds comprehensive unit testing to the TickTalk application using Jest, with strategic refactorings to improve testability. We'll start with simple pure functions and progress to complex Firebase-dependent modules, using mocks for unit tests and the Firebase emulator for integration tests. Priority areas: business logic (session.ts), custom hooks (hooks), and utilities (utils.tsx).

Key decisions from discussion:
- **Framework**: Jest (industry standard, excellent ecosystem)  
- **Firebase strategy**: Mock SDK for unit tests, emulator for integration tests
- **Refactoring**: Yes - add abstractions and dependency injection where needed
- **Priority**: Business logic, hooks, and utilities (components deferred)

**Steps**

1. **Setup Testing Infrastructure**
   - Install Jest, `@testing-library/react`, `@testing-library/react-hooks`, `@testing-library/user-event`, `@testing-library/jest-dom`
   - Install `@firebase/rules-unit-testing` for emulator tests
   - Install `jest-environment-jsdom` for DOM environment
   - Create `jest.config.js` with proper Next.js path mappings and test environment
   - Add test scripts to package.json: `test`, `test:watch`, `test:coverage`, `test:integration`
   - Create test setup file `jest.setup.js` with global mocks and matchers

2. **Phase 1: Pure Functions (No Dependencies)**
   - Test utils.tsx `calculateAgo()` - mock `Date.now()` via `jest.useFakeTimers()`
   - Test utils.tsx `formatDuration()` - edge cases (0s, 59s, 60s, 3600s, negatives)
   - Create `app/utils.test.ts`
   - Goal: 100% coverage of pure utilities

3. **Phase 2: Audio System (Simple Mock)**
   - Refactor audio.ts: Create `AudioPlayer` interface with `play()`, `stop()`, export factory
   - Test audio module: mock `HTMLAudioElement`, verify play/stop/error handling
   - Create `lib/audio.test.ts`
   - Goal: Audio abstraction ready for hook testing

4. **Phase 3: Firebase Abstractions (Critical Refactoring)**
   - Create `lib/repositories/` directory
   - Extract `AuthRepository` interface from auth.ts with methods: `signInAnonymously()`, `getCurrentUser()`, `getCurrentUserId()`
   - Extract `SessionRepository` interface from session.ts with all 14 functions
   - Implement `FirebaseAuthRepository` and `FirebaseSessionRepository` as default exports
   - Update imports across useAuth.ts, useSession.ts, components to use repositories
   - Goal: Dependency injection ready, Firebase fully abstracted

5. **Phase 4: Auth Module Unit Tests**
   - Create mock `AuthRepository` implementation for tests
   - Test auth.ts functions via `FirebaseAuthRepository`: success cases, error handling, null states
   - Test useAuth.ts: loading states, success flow, cleanup on unmount, error handling
   - Create `lib/auth.test.ts` and `app/hooks/useAuth.test.ts`
   - Use `@testing-library/react` `renderHook` utility
   - Goal: Auth flow fully tested with mocks

6. **Phase 5: Timer Hook Unit Tests**
   - Inject time dependency: Add optional `getCurrentTime` param to `useTimer` (defaults to `Date.now`)
   - Mock audio player in tests using Phase 3 abstraction
   - Test useTimer.ts: countdown, expiry detection, overtime calculation, sound playback trigger, cleanup
   - Use `vi.useFakeTimers()` and `vi.advanceTimersByTime()`
   - Create `app/hooks/useTimer.test.ts`
   - Goal: Timer logic 95%+ coverage

7. **Phase 6: Session Module Unit Tests (Complex)**
   - Create comprehensive mock for `SessionRepository`
   - Test individual functions in session.ts: `createSession`, `joinSession`, `getSession`, `updateSession`, `startMeeting`, `endMeeting`, `toggleHandRaise`, `removeParticipant`, `promoteToHost`
   - Mock Firebase transaction behavior for: `selectNextSpeaker`, `endCurrentSlot`, `promoteHostOnDisconnect`
   - Test presence monitoring: `monitorPresence` cleanup function
   - Create `lib/session.test.ts` (large file, ~400-600 lines)
   - Goal: 80%+ coverage (transactions hard to test fully)

8. **Phase 7: Session Hook Unit Tests**
   - Mock `SessionRepository` to simulate real-time updates
   - Test useSession.ts: loading state, data subscription updates, speaker disconnect detection, host change handling, error states, cleanup
   - Simulate Firebase `onValue` callbacks in mock
   - Create `app/hooks/useSession.test.ts`
   - Goal: Real-time subscription logic fully tested

9. **Phase 8: Firebase Integration Tests (Emulator)**
   - Set up Firebase emulator configuration in `firebase.json`
   - Create `tests/integration/` directory
   - Write integration tests for critical flows using real Firebase emulator:
     - Create session → Join session → Start meeting
     - Select speaker → End slot → Next speaker selection
     - Presence monitoring → Host disconnect → Auto-promote
     - Transaction race conditions in `selectNextSpeaker`
   - Create `tests/integration/session.integration.test.ts`
   - Configure separate test script: `test:integration`
   - Goal: Verify Firebase transactions work correctly

10. **Phase 9: Test Utilities & Documentation**
    - Create `tests/utils/` with shared mocks: `mockSession()`, `mockParticipant()`, `mockUser()`
    - Create `tests/utils/firebase-mocks.ts` with reusable Firebase mock factories
    - Add testing guidelines to README.md or new `docs/TESTING.md`
    - Document mock patterns and test organization
    - Goal: Maintainable test infrastructure

11. **Phase 10: CI/CD Integration**
    - Add GitHub Actions workflow `.github/workflows/test.yml`
    - Run unit tests on every PR
    - Run integration tests with Firebase emulator in CI
    - Add coverage reporting (upload to Codecov or similar)
    - Add status badge to README.md
    - Goal: Automated testing in pipeline

**Verification**

- Run `npm test` - all tests pass
- Run `npm run test:coverage` - see coverage report (target: 80% overall, 100% for utils)
- Run `npm run test:integration` - emulator tests pass
- Check that refactored code has no TypeScript errors: `npm run build`
- Verify no runtime regressions: manual smoke test of create → join → meeting flow

**Decisions**

- **Chose Jest**: Industry standard with excellent ecosystem, great TypeScript support via ts-jest, extensive community resources
- **Dual testing strategy**: Unit tests use mocks (fast feedback), integration tests use emulator (realistic behavior)
- **Refactoring approach**: Extract repositories for Firebase, inject time/audio dependencies - improves testability without changing public APIs
- **Test organization**: Co-located test files (`*.test.ts`) for easy discovery, separate `tests/integration/` for emulator tests
- **Deferred components**: Focus on logic first, defer UI component testing to later phase (not in this plan)

---

## Complete unit-test-plan.md Content

```markdown
# Unit Testing & Refactoring Plan

## Overview

Add comprehensive unit testing to TickTalk using Vitest, organized by dependency complexity. Includes strategic refactorings to improve testability through abstraction layers and dependency injection.

**Status**: Phase 1 Completed ✅
**Framework**: Jest + React Testing Library  
**Strategy**: Unit tests with mocks + Integration tests with Firebase emulator

## Priority Areas

1. ✅ Pure utilities ([app/utils.tsx](app/utils.tsx)) - **COMPLETED**
2. 🎯 Business logic ([lib/session.ts](lib/session.ts))
3. 🎯 Custom hooks ([app/hooks/](app/hooks/))

## Dependencies

### Required Packages

```bash
# Testing frameworks
npm install -D jest jest-environment-jsdom @types/jest
npm install -D @testing-library/react @testing-library/react-hooks @testing-library/user-event @testing-library/jest-dom
npm install -D ts-jest  # TypeScript support for Jest

# Firebase testing
npm install -D @firebase/rules-unit-testing

# Type definitions
npm install -D @types/testing-library__jest-dom
```

### Configuration Files

- `jest.config.js` - Jest configuration with Next.js path mappings
- `jest.setup.js` - Global test setup, matchers, mocks
- `firebase.json` (optional) - Emulator configuration for integration tests
- `.github/workflows/test.yml` - CI/CD pipeline

## Testing Phases

### Phase 1: Pure Functions ✅ COMPLETED

**Goal**: Test functions with no external dependencies

**Files**:
- ✅ `app/utils.test.ts` - **CREATED** (27 tests, 100% coverage)

**Tests**:
- ✅ `calculateAgo()` - mock `Date.now()`, test various time ranges (11 tests)
- ✅ `formatDuration()` - test edge cases (0, 59, 60, 3600, negatives, invalid) (16 tests)

**Effort**: 1-2 hours (✅ COMPLETED)
**Dependencies**: None  
**Coverage Target**: 100% ✅ **ACHIEVED**

---

### Phase 2: Audio System ⚠️ Medium

**Goal**: Abstract and test audio playback

**Refactoring Required**:

```typescript
// audio.ts - Add interface
interface AudioPlayer {
  play(): void;
  stop(): void;
}

// Export factory for dependency injection
export function createAudioPlayer(): AudioPlayer {
  // ... existing implementation
}
```

**Files**:
- `lib/audio.test.ts` (new)

**Tests**:
- Mock `HTMLAudioElement` constructor
- Test `playTimerExpiredSound()` success and error cases
- Test `stopTimerExpiredSound()` cleanup
- Verify audio source path correctness

**Effort**: 2-3 hours  
**Dependencies**: None  
**Coverage Target**: 90%+ (Audio API errors hard to simulate)

---

### Phase 3: Firebase Abstractions 🚨 Critical Refactoring

**Goal**: Create testable abstractions for all Firebase operations

**Refactoring Required**:

1. Create `lib/repositories/AuthRepository.ts`:
```typescript
interface AuthRepository {
  signInAnonymously(): Promise<User>;
  getCurrentUser(): User | null;
  getCurrentUserId(): Promise<string>;
}

export class FirebaseAuthRepository implements AuthRepository {
  // Move existing logic from auth.ts
}
```

2. Create `lib/repositories/SessionRepository.ts`:
```typescript
interface SessionRepository {
  createSession(input: CreateSessionInput): Promise<string>;
  joinSession(sessionId: string, userId: string, userName: string): Promise<void>;
  getSession(sessionId: string): Promise<Session | null>;
  // ... all other methods from lib/session.ts
}

export class FirebaseSessionRepository implements SessionRepository {
  // Move existing logic from lib/session.ts
}
```

3. Update imports across codebase:
   - useAuth.ts - inject AuthRepository
   - useSession.ts - inject SessionRepository
   - page.tsx, page.tsx, page.tsx
   - All components using session functions

**Files Modified**:
- auth.ts - becomes wrapper/export of FirebaseAuthRepository
- session.ts - becomes wrapper/export of FirebaseSessionRepository
- `lib/repositories/AuthRepository.ts` (new)
- `lib/repositories/SessionRepository.ts` (new)
- `lib/repositories/index.ts` (new, barrel export)
- Multiple hook and component files

**Effort**: 6-8 hours  
**Risk**: Medium (widespread changes, but type-safe)  
**Benefit**: Makes all downstream tests possible

---

### Phase 4: Auth Module Tests ⚠️ Medium

**Goal**: Test authentication logic with mocked Firebase

**Files**:
- `lib/auth.test.ts` (new)
- `app/hooks/useAuth.test.ts` (new)
- `tests/utils/firebase-mocks.ts` (new, shared mocks)

**Tests for auth.ts**:
- `authenticateAnonymously()` - success, already signed in, error cases
- `getCurrentUser()` - user exists, null, not initialized
- `getCurrentUserId()` - success, not authenticated error

**Tests for useAuth hook**:
- Loading state initially true
- Success: userId set, loading false
- Error: error state set, loading false
- Cleanup: no state updates after unmount
- Re-authentication on auth state change

**Mocks Required**:
- Mock `AuthRepository`
- Mock `signInAnonymously`, `onAuthStateChanged`

**Effort**: 4-5 hours  
**Dependencies**: Phase 3 complete  
**Coverage Target**: 85%+ (Firebase edge cases hard to simulate)

---

### Phase 5: Timer Hook Tests ⚠️ Medium

**Goal**: Test time-based logic with fake timers

**Refactoring Required**:

```typescript
// app/hooks/useTimer.ts
interface UseTimerOptions {
  getCurrentTime?: () => number;  // for testing
  audioPlayer?: AudioPlayer;      // from Phase 2
}

export function useTimer(
  slotEndsAt: number | null,
  slotDurationSeconds: number,
  options?: UseTimerOptions
)
```

**Files**:
- `app/hooks/useTimer.test.ts` (new)

**Tests**:
- Remaining time decreases correctly
- `isActive` flag accurate
- `isExpired` triggers at 0
- `isOverTime` and `overTimeSeconds` calculate correctly
- Audio plays once when timer expires
- Cleanup stops interval
- Re-initializes on `slotEndsAt` change

**Mocks Required**:
- `jest.useFakeTimers()` for time control
- Mock audio player from Phase 2

**Effort**: 5-6 hours  
**Dependencies**: Phase 2 complete  
**Coverage Target**: 95%+

---

### Phase 6: Session Module Tests 🚨 Hard

**Goal**: Test all business logic functions in session.ts

**Files**:
- `lib/session.test.ts` (new, large ~500+ lines)
- `tests/utils/mock-data.ts` (new, factory functions)

**Test Groups**:

1. **CRUD Operations** (~100 lines):
   - `createSession()`, `joinSession()`, `getSession()`, `listSessions()`, `updateSession()`
   - Success, not found, validation errors

2. **Meeting Lifecycle** (~80 lines):
   - `startMeeting()`, `endMeeting()`
   - State transitions, participant updates

3. **Speaker Management** (~150 lines):
   - `selectNextSpeaker()` - round-robin, hand-raise priority, already-spoken users
   - `endCurrentSlot()` - time tracking, slot history
   - Transaction race conditions (hard to test, may skip)

4. **Participant Actions** (~80 lines):
   - `toggleHandRaise()`, `removeParticipant()`, `promoteToHost()`
   - Permission validation, state updates

5. **Presence System** (~100 lines):
   - `monitorPresence()` - onDisconnect handlers, cleanup
   - `promoteHostOnDisconnect()` - transaction logic
   - Simulate disconnects in mock

**Mocks Required**:
- Complete `SessionRepository` mock with Firebase-like behavior
- Mock `ref()`, `set()`, `update()`, `get()`, `runTransaction()`, `onDisconnect()`
- Mock snapshot data structures

**Effort**: 12-15 hours (largest testing effort)  
**Dependencies**: Phase 3 complete  
**Coverage Target**: 80%+ (transactions/presence limited)

---

### Phase 7: Session Hook Tests 🚨 Hard

**Goal**: Test real-time data subscription hook

**Files**:
- `app/hooks/useSession.test.ts` (new, ~300 lines)

**Tests**:
- Initial loading state
- Data updates via mocked `onValue` callback
- Speaker disconnect detection (compare current vs previous)
- Host change detection
- Error handling
- Cleanup: unsubscribe and presence cleanup
- Re-subscribe on sessionId change

**Mocks Required**:
- Mock `SessionRepository.subscribeToSession()` (new method needed)
- Simulate Firebase snapshot updates
- Trigger callbacks to test reactivity

**Refactoring Required**:
```typescript
// Add to SessionRepository interface
subscribeToSession(sessionId: string, callback: (session: Session | null) => void): () => void;
```

**Effort**: 8-10 hours  
**Dependencies**: Phase 3, Phase 6 complete  
**Coverage Target**: 85%+

---

### Phase 8: Firebase Integration Tests 🔴 Emulator

**Goal**: Verify business logic works with real Firebase

**Setup**:
1. Create `firebase.json`:
```json
{
  "emulators": {
    "database": {
      "port": 9000
    }
  }
}
```

2. Add test script to package.json:
```json
{
  "scripts": {
    "test:integration": "firebase emulators:exec --only database 'jest tests/integration'"
  }
}
```

**Files**:
- `tests/integration/session.integration.test.ts` (new)
- `tests/integration/setup.ts` (new, emulator connection)

**Test Scenarios**:
1. Full meeting flow:
   - Create session → Multiple joins → Start meeting → Select speakers → End meeting
2. Presence system:
   - Join → Force disconnect → Verify cleanup
   - Host disconnect → Verify auto-promote
3. Transaction race conditions:
   - Multiple clients selecting next speaker simultaneously
4. Security rules (if implemented):
   - Test read/write permissions

**Effort**: 6-8 hours  
**Dependencies**: Phase 6 complete, Firebase CLI installed  
**Coverage**: Focuses on transaction and presence edge cases

---

### Phase 9: Test Infrastructure 🔧 Foundation

**Goal**: Shared utilities and best practices documentation

**Files Created**:
- `tests/utils/mock-data.ts` - Factory functions:
  ```typescript
  export const mockSession = (overrides?: Partial<Session>): Session
  export const mockParticipant = (overrides?: Partial<Participant>): Participant
  export const mockUser = (overrides?: Partial<User>): User
  ```
- `tests/utils/firebase-mocks.ts` - Reusable Firebase mock factories
- `docs/TESTING.md` - Testing guidelines:
  - How to run tests
  - Mock patterns
  - Firebase emulator usage
  - Writing new tests

**Effort**: 3-4 hours  
**Dependencies**: None (can be done anytime)

---

### Phase 10: CI/CD Integration 🚀 Automation

**Goal**: Run tests automatically on every commit/PR

**Files**:
- `.github/workflows/test.yml` (new)

**Workflow**:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3  # optional

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm install -g firebase-tools
      - run: npm run test:integration
```

**Effort**: 2-3 hours  
**Dependencies**: All test phases complete  
**Benefit**: Catch regressions automatically

---

## Verification Checklist

After completing all phases:

- [ ] `npm test` passes with 0 failures
- [ ] `npm run test:coverage` shows 80%+ overall coverage
- [ ] `npm run test:integration` passes (if Phase 8 done)
- [ ] `npm run build` succeeds (TypeScript compiles)
- [ ] Manual smoke test: create → join → start → speak → end meeting
- [ ] No console errors in development
- [ ] CI/CD workflow runs successfully

## Total Effort Estimate

| Phase | Hours | Complexity |
|-------|-------|------------|
| 1. Pure Functions | 2 | ✅ Easy |
| 2. Audio | 3 | ⚠️ Medium |
| 3. Firebase Abstractions | 8 | 🚨 Critical |
| 4. Auth Tests | 5 | ⚠️ Medium |
| 5. Timer Tests | 6 | ⚠️ Medium |
| 6. Session Tests | 15 | 🚨 Hard |
| 7. Session Hook Tests | 10 | 🚨 Hard |
| 8. Integration Tests | 8 | 🔴 Emulator |
| 9. Test Infrastructure | 4 | 🔧 Foundation |
| 10. CI/CD | 3 | 🚀 Automation |
| **TOTAL** | **64 hours** | ~1.5-2 weeks |

## Success Metrics

- ✅ 80%+ code coverage overall
- ✅ 100% coverage for pure utilities
- ✅ 85%+ coverage for hooks
- ✅ 80%+ coverage for business logic
- ✅ Integration tests cover critical transaction flows
- ✅ Tests run in CI/CD on every PR
- ✅ Zero regressions after refactoring

## Notes

- **Deferred**: Component testing (UI) - focus on logic first
- **Future**: E2E tests with Playwright/Cypress for full user flows
- **Risk**: Phase 3 refactoring is invasive but necessary - use TypeScript to guide changes
- **Alternative**: Could skip integration tests (Phase 8) if mocks prove sufficient

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing/jest)
```
