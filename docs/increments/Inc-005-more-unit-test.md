

# 1. Test Business Logic (~20-25 tests) 🔴 COMPLEX, HEAVY LOGIC

**`tests/lib/sessionService.test.ts`** - Test `src/lib/services/sessionService.ts`

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


# 2. Test Hooks - Hard (~12-15 tests) 🔴 REAL-TIME LISTENER

**`tests/hooks/useSession.test.ts`** - Test `src/hooks/useSession.ts`

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

# 3. Test Components - Pure Presentation (~16-20 tests) ✅ EASY, SNAPSHOT-ABLE

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

# 4. Test Components - Integrated (~12-15 tests) ⚠️ REQUIRES SERVICE PROPS

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


# Mock Patterns

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

# Test Speed Optimizations
- Use fake timers for `useTimer` tests (no real 1000ms waits)
- Mock localStorage instead of using real browser storage
- Mock Firebase service instead of hitting backend
- Use shallow renders where possible
- Avoid real Audio API (mock it)

# Test Execution
```bash
npm run test
```

# Example - To verify a specific test file:
```bash
# After creating first test file (utils.test.ts)
npm run test -- tests/lib/utils.test.ts
```

# Decisions
- You asked for "fast unit tests only"; integration tests wait for later
- Tests easiest→hardest
- Pure functions testable with zero mocks, significant complexity moved there
