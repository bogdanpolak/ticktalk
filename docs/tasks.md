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
| REQ-0020 | Mobile-responsive layout adjustments | ⬜ |
| REQ-0021 | Firebase security rules (basic) | ⬜ |
| REQ-0022 | End-to-end testing & bug fixes | ⬜ |

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
