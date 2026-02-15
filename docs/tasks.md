# TickTalk — Implementation Tasks

## Task Tracker

| ID | Task | Status |
|----|------|--------|
| REQ-0001 | Firebase project setup + env configuration | ✅ |
| REQ-0002 | Firebase lib initialization (`lib/firebase.ts`, `lib/auth.ts`) | ✅ |
| REQ-0003 | Session data operations (`lib/session.ts`) | ✅ |
| REQ-0004 | `useSession` and `useAuth` hooks | 🟨 |
| REQ-0005 | Home page — create session flow | ✅ |
| REQ-0006 | Join page — enter name and join | 🟨 |
| REQ-0007 | Basic meeting page with lobby view | ⬜ |
| REQ-0008 | Active speaker display component | ⬜ |
| REQ-0009 | Timer component with color states | ⬜ |
| REQ-0010 | `useTimer` hook (local countdown) | ⬜ |
| REQ-0011 | Speaker selection with transaction logic | ⬜ |
| REQ-0012 | End slot + select next speaker flow | ⬜ |
| REQ-0013 | Participant list with status indicators | ⬜ |
| REQ-0014 | Host "Start Meeting" + "End Meeting" controls | ⬜ |
| REQ-0015 | Hand raise toggle + visual indicator | ⬜ |
| REQ-0016 | "Spoken" tracking and round reset logic | ⬜ |
| REQ-0017 | Disconnect handling (speaker & host) | ⬜ |
| REQ-0018 | Timer expired indicator + sound notification | ⬜ |
| REQ-0019 | Mobile-responsive layout adjustments | ⬜ |
| REQ-0020 | Firebase security rules (basic) | ⬜ |
| REQ-0021 | End-to-end testing & bug fixes | ⬜ |

---

## Status Symbols

- **⬜ Not Started** — Ready to begin
- **🟨 In Progress** — Implementation story file is created and the agent is working or will start soon
- **✅ Completed** — Task finished and verified

---

## Task Dependencies

### Foundation Tasks (can run in parallel after setup)
- REQ-0001 (must complete first)
- REQ-0002 (must complete after REQ-0001)
- REQ-0003, REQ-0004, REQ-0005, REQ-0006, REQ-0007 (can run parallel)

### Meeting Flow Tasks (requires foundation)
- REQ-0008 through REQ-0014 (can run mostly parallel)

### Polish & Edge Cases (can run in parallel)
- REQ-0015 through REQ-0021

---

## Notes for Agents

- Update status as you progress on each task
- Comment below each completed task with implementation details if needed
- For blocked tasks, add notes in the relevant section
