# Inc-005 — More Unit Tests — Clarification

## Q1: Spec gaps — Inc-005 spec lists tests for features that don't exist in code

**Context**: Several test cases in Inc-005 describe behavior that doesn't match the actual implementation:
- `joinSession` has no max-participant check
- `endMeeting` has no `meetingEndedAt` timestamp or join-prevention
- `monitorPresence` host-disconnect logic is in a separate `promoteHostOnDisconnect()` method
- `MeetingSummary` doesn't calculate percentages
- `SpeakerSelector` hides (not disables) the current speaker

**Answer**: Test actual code behavior only — skip spec items that don't match real code, write tests for what the code actually does.

## Q2: Scope — sessionService already has 9 tests, Inc-005 asks for ~20-25

**Answer**: Add ~12 new sessionService tests covering currently untested methods: listSessions, getSession, updateSession, startMeeting, removeParticipant, promoteToHost, subscribeSession, and edge cases.

## Q3: Task split

**Answer**: 4 tasks matching Inc-005 sections:
- REQ-0040: sessionService additional tests
- REQ-0041: useSession hook tests
- REQ-0042: presentation component tests (ActiveSpeaker, ParticipantList, Timer, MeetingSummary, EndMeetingDialog)
- REQ-0043: integrated component tests (SpeakerSelector, MeetingControls, HandRaiseButton)
