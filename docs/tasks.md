# Tick-Talk — Implementation Tasks

## Task Tracker

| ID | Task | Status |
|----|------|--------|
| REQ-0001 | Firebase project setup + env configuration | ✅ |
| REQ-0002 | Firebase lib initialization (`lib/firebase.ts`, `lib/auth.ts`) | ✅ |
| REQ-0003 | Session data operations (`lib/session.ts`) | ✅ |
| REQ-0004 | `useSession` and `useAuth` hooks | ✅ |
| REQ-0005 | Home page — create session flow | ✅ |
| REQ-0006 | Join page — enter name and join | ✅ |
| REQ-0007 | Basic meeting page with lobby view | ✅ |
| REQ-0008 | Active speaker display component | ✅ |
| REQ-0009 | Timer component with color states | ✅ |
| REQ-0010 | `useTimer` hook (local countdown) | ✅ |
| REQ-0011 | Speaker selection with transaction logic | ✅ |
| REQ-0012 | End slot + select next speaker flow | ✅ |
| REQ-0013 | Participant list with status indicators | ✅ |
| REQ-0014 | Host "Start Meeting" + "End Meeting" controls | ✅ |
| REQ-0015 | UI Polish — Idle state messaging and edge case handling (extra) | ✅ |
| REQ-0016 | Hand raise toggle + visual indicator | ✅ |
| REQ-0017 | "Spoken" tracking and round reset logic | ✅ |
| REQ-0018 | Disconnect handling (speaker & host) | ✅ |
| REQ-0019 | Timer expired indicator + sound notification | ✅ |
| REQ-0020 | Speaking duration tracking in Firebase | ⬜ |
| REQ-0021 | Timer over-time display format (+M:SS) | ⬜ |
| REQ-0022 | Host participates in speaker rotation | ⬜ |
| REQ-0023 | Meeting Summary with speaking times | ⬜ |
| REQ-0024 | End Meeting warning for unspoken users | ⬜ |
| REQ-0025 | Mobile-responsive layout adjustments | ⬜ |
| REQ-0026 | Firebase security rules (basic) | ⬜ |
| REQ-0027 | End-to-end testing & bug fixes | ⬜ |

**Status Symbols**

- ⬜ = Requirements needed — Specification needed.
- 🟨 = Requirements created — Implementation story file is created and saved in `/docs/stories` folder.
- ✅ = Completed — Task finished and verified. Completed tasks are stored in `/docs/stories/completed` folder.

**References**

- [/docs/stories/](/docs/stories/) - created requirements, but not yet implemented
- [/docs/stories/completed/](/docs/stories/completed/) - requirements completed

---

## Notes for Agents

- Update status as you progress on each task
- Comment below each completed task with implementation details if needed
- For blocked tasks, add notes in the relevant section

---

## Summary of New Requirements (REQ-0020 through REQ-0024)

### REQ-0020: Speaking Duration Tracking in Firebase
- Track `slotStartedAt` when speaker is selected
- Calculate actual speaking duration when slot ends
- Store in `speakingHistory` array with `startTime`, `endTime`, `durationSeconds`
- Accumulate `totalSpokeDurationSeconds` per participant (never resets)
- Implementation: Modify `lib/session.ts` end-slot logic and update Firebase schema

### REQ-0021: Timer Over-Time Display Format
- Extend Timer.tsx to display over-time as `+M:SS` (e.g., `+1:12`)
- Switch format when `slotEndsAt < Date.now()`
- Apply distinct visual state (red background) different from expired indicator
- Update useTimer.ts to compute both countdown and over-time
- Modify Timer color states to include new over-time state

### REQ-0022: Host Participates in Speaker Rotation
- Update SpeakerSelector.tsx logic to allow host selection (remove host from ineligibility check)
- Host can select themselves as first speaker
- Host appears in eligible next-speaker list if they haven't spoken in current round
- Update speaker selection validation to include host in rotation

### REQ-0023: Meeting Summary with Speaking Times
- Create new MeetingSummary.tsx component
- Display when `status: 'finished'` or when End Meeting is confirmed
- Show: Name, Total Time Spoken, Over-time Flag (if exceeded slotDurationSeconds), Number of Turns
- Highlight rows red if participant exceeded their slot duration in any turn
- Allow host to close summary or return to active meeting view

### REQ-0024: End Meeting Warning for Unspoken Users
- Create EndMeetingDialog.tsx confirmation modal
- Trigger when host clicks End Meeting with unspoken participants
- Dialog: "X participant(s) haven't spoken yet. End meeting anyway?" with [Cancel] [End Meeting] buttons
- Calculate unspoken: `participants not in spokenUserIds`
- Make "End Meeting" button always enabled (remove speaker-active disabled state)
