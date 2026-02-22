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
| REQ-0020 | Speaking duration tracking in Firebase | ✅ |
| REQ-0021 | Timer over-time display format (+M:SS) | ✅ |
| REQ-0022 | Host participates in speaker rotation | ✅ |
| REQ-0023 | Meeting Summary with speaking times | ✅ |
| REQ-0024 | End Meeting warning for unspoken users | ✅ |
| REQ-0025 | Mobile-responsive layout adjustments | ✅ |
| REQ-0026 | Meeting layout: participant list in main column | ✅ |
| REQ-0027 | Remove Active Speaker panel | ✅ |
| REQ-0028 | Participant row total time badge | ✅ |
| REQ-0029 | Single-turn session flow (no reset) | ✅ |
| REQ-0030 | Meeting Summary overtime styling update | ✅ |
| REQ-0031 | Custom duration selector with 10 options | ✅ |
| REQ-0032 | Custom duration input field with validation | ✅ |
| REQ-0033 | Local storage persistence for settings | 🟨 |
| REQ-0034 | Pre-load settings on page load (Home & Join) | 🟨 |
| REQ-0035 | Focus management for quick start UX | 🟨 |
| REQ-0036 | Hide MeetingControls for non-active participants | 🟨 |
| REQ-0037 | Percentage-based timer warning/critical thresholds | 🟨 |
| REQ-0038 | Sound notifications for warning/critical states | ⬜ |

**Status Symbols**

- ⬜ = Requirements needed — Specification needed.
- 🟨 = Requirements created — Implementation story file is created and saved in `/docs/stories` folder.
- ✅ = Completed — Task finished and verified. Completed tasks are stored in `/docs/stories/completed` folder.

**Consider later:** 

After MVP completion consider implementation following tasks/requirements:
- Firebase security rules (basic)
- End-to-end testing & bug fixes


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

### REQ-0028: Meeting Layout - Participant List in Main Column
- Remove the right-side aside layout on large screens
- Stack the participant list above the timer for all breakpoints
- Maintain existing spacing and card styles

### REQ-0029: Remove Active Speaker Panel
- Remove ActiveSpeaker component usage from the meeting view
- Rely on the participant list "Speaking" badge only
- Ensure empty-speaker state is handled without the panel

### REQ-0030: Participant Row Total Time Badge
- Show total speaking time in each participant row
- Display format: "Total: M:SS"
- Place as a right-aligned badge next to status chips
- Do not show overtime styling in the participant list

### REQ-0031: Single-Turn Session Flow
- Do not reset `spokenUserIds` when all participants have spoken
- Prevent next-speaker selection once everyone has spoken
- Hide the SpeakerSelector when no eligible participants remain
- Keep end-slot behavior limited to the active speaker

### REQ-0032: Meeting Summary Overtime Styling Update
- Keep overtime indicator in Meeting Summary only
- Remove red highlight styling for overtime rows
- Keep total time display unchanged

---

## Summary of New Requirements (REQ-0031 through REQ-0038)

### REQ-0031: Custom Duration Selector with 10 Options
- Update Home page duration selector to include:
  - 60 seconds (1:00)
  - 75 seconds (1:15)
  - 90 seconds (1:30)
  - 105 seconds (1:45)
  - 120 seconds (2:00) — default
  - 135 seconds (2:15)
  - 150 seconds (2:30)
  - 165 seconds (2:45)
  - 180 seconds (3:00)
  - Custom... (triggers custom input field)
- Replace existing 4 duration options (1min, 2min, 3min, 5min)
- Implementation: Modify `app/page.tsx` DURATION_OPTIONS array

### REQ-0032: Custom Duration Input Field with Validation
- Show custom input field when "Custom..." option selected
- Pre-populate with 120 seconds (or last custom value from local storage)
- Display validation text below input: "Enter custom duration in seconds (30-3600)"
- Validate on form submit: 30-3600 seconds range
- Show error message if validation fails
- Implementation: Modify `app/page.tsx` to add conditional custom input field

### REQ-0033: Local Storage Persistence for Settings
- Create `lib/storage.ts` with helper functions:
  - `saveSettings(name, duration, isCustom)`
  - `loadSettings()` returns object with userName, slotDuration, isCustomDuration
- Storage keys:
  - `ticktalk_userName`
  - `ticktalk_slotDuration`
  - `ticktalk_isCustomDuration`
- Save settings only on successful session creation/join
- Storage is per-browser, not per-user
- Implementation: Create `lib/storage.ts` and integrate into Home and Join pages

### REQ-0034: Pre-load Settings on Page Load (Home & Join)
- Load settings from local storage on component mount
- Pre-populate name input field
- Pre-populate duration selector (including custom option if applicable)
- Pre-populate custom duration input if custom was previously selected
- Implementation: Add `useEffect` hooks in `app/page.tsx` and `app/join/[sessionId]/page.tsx`

### REQ-0035: Focus Management for Quick Start UX
- Create `useLocalStorage.ts` hook for settings + focus management
- First-time users (no stored name): Focus on name input field
- Returning users (stored name exists): Focus on action button ("Create Session" or "Join")
- Use `useRef` for input and button elements
- Call `.focus()` in `useEffect` after settings loaded
- Implementation: Create `hooks/useLocalStorage.ts` and integrate into Home and Join pages

### REQ-0036: Hide MeetingControls for Non-Active Participants
- Modify `MeetingControls.tsx` to accept visibility props
- Show MeetingControls only when:
  - User is active speaker (shows "End My Slot" button)
  - User is host (always shows "End Meeting" button, regardless of speaker status)
- Hide entire MeetingControls component for non-active, non-host participants
- No placeholder or message shown when hidden
- Same behavior on mobile
- Implementation: Modify `components/MeetingControls.tsx` and `app/meeting/[sessionId]/page.tsx`

### REQ-0037: Percentage-Based Timer Warning/Critical Thresholds
- Replace fixed thresholds (15s warning, 5s critical) with percentage-based:
  - **Warning**: 25% time remaining (75% elapsed)
  - **Critical**: 12.5% time remaining (87.5% elapsed), minimum 5 seconds
- Calculate thresholds based on `slotDurationSeconds`:
  - `warningThreshold = Math.ceil(slotDuration * 0.25)`
  - `criticalThreshold = Math.max(Math.ceil(slotDuration * 0.125), 5)`
- Update `useTimer.ts` to compute percentage-based states
- Update `Timer.tsx` to use new thresholds for color states
- Implementation: Modify `hooks/useTimer.ts` and `components/Timer.tsx`

### REQ-0038: Sound Notifications for Warning/Critical States
- Add sound notification playback at:
  - Warning threshold (when transitioning to warning state)
  - Critical threshold (when transitioning to critical state)
  - Expired (when time reaches 0) — already implemented
- Reuse existing sound notification infrastructure from REQ-0019
- Track previous state to trigger sound only on state transitions
- Implementation: Modify `hooks/useTimer.ts` to track state changes and play sounds

- Hide the SpeakerSelector when no eligible participants remain
- Keep end-slot behavior limited to the active speaker

### REQ-0032: Meeting Summary Overtime Styling Update
- Keep overtime indicator in Meeting Summary only
- Remove red highlight styling for overtime rows
- Keep total time display unchanged
