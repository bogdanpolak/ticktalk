# 📄 Product Requirements Document

## Product Name

**Tick-Talk**

---

# 1. Overview

**Tick-Talk** is a lightweight real-time web application that enforces structured, time-boxed speaking during Standup and Grooming meetings.

It enables:

* Equal speaking time
* Clear discussion ownership
* Transparent timing
* Controlled hand-raising for clarifications

Primary goal:
Increase meeting efficiency, fairness, and engagement.

---

# 2. Problem Statement

Current meetings:

* Overrun time
* Allow dominant speakers
* Lack structured turn-taking
* Have unclear discussion ownership
* Do not provide objective timing visibility

This leads to:

* Reduced engagement
* Meeting fatigue
* Poor time discipline
* Lower perceived meeting value

---

# 3. Goals & Success Criteria

## Goals

1. Enforce equal speaking time.
2. Increase meeting structure.
3. Improve psychological safety via hand-raise feature.
4. Provide transparent timer visible to all participants.
5. Keep UX friction extremely low.

## Non-Goals (MVP)

* Calendar integrations
* Persistent meeting history
* Analytics dashboard
* AI summaries
* Complex authentication

---

# 4. Target Users

## Primary

* Engineering teams (5–12 people)
* Scrum teams
* Product development teams

## Roles

### Host

* Creates session
* Defines slot duration
* Starts meeting
* Selects first speaker

### Participant

* Joins session
* Speaks when active
* Can raise hand
* Can select next speaker when active

---

# 5. Core Features (MVP)

## 5.1 Session Creation

Host:

* Logs in (name only for MVP)
* Sets:

  * Slot duration from predefined options:
    * 60 seconds (1:00)
    * 75 seconds (1:15)
    * 90 seconds (1:30)
    * 105 seconds (1:45)
    * 120 seconds (2:00) — default
    * 135 seconds (2:15)
    * 150 seconds (2:30)
    * 165 seconds (2:45)
    * 180 seconds (3:00)
    * Custom... (30-3600 seconds)
  * Custom duration input appears below selector when "Custom..." selected
  * Pre-populated with 120 seconds (or last custom value from local storage)
  * Validation on submit: 30-3600 seconds
* Previously entered name and duration pre-loaded from browser local storage
* Gets unique join link

---

## 5.2 Lobby

Participants:

* Join via link
* Enter name
* Appear in participant list

Host:

* Sees participants
* Can start meeting

---

## 5.3 Meeting Room

All users see:

* Participant list (includes active speaker indicator)
* Countdown timer (or "Time Expired" indicator + over-time display)
* Hand raise indicators
* Visual indicators showing who has already spoken and total speaking time
* Participant list is placed above the timer in the main column

Host:

* Can select themselves or any participant as first speaker
* Can end meeting at any time (button always enabled)
* "End Meeting" shows warning dialog if unspoken participants remain
* Cannot intervene during active speaker slots (no override)

Active Speaker:

* Sees "End Slot" button
* Can select next speaker from those who haven't spoken yet (if any remain)
* Sees cumulative speaking time for all participants

---

## 5.4 Timer Logic

* Timer duration defined by host (from selector or custom input).
* When speaker selected:

  * Server sets `slotEndsAt`
  * All clients compute countdown locally.
  * System begins tracking speaker slot start time for duration calculation
* Timer color states based on percentage elapsed:

  * **Normal** (0-75% elapsed): Default state
  * **Warning** (75% elapsed / 25% remaining): Visual change + optional sound notification
    * For 120s slot: triggers at 30s remaining
  * **Critical** (87.5% elapsed / 12.5% remaining): Visual change + optional sound notification
    * Minimum threshold: 5 seconds
    * For 120s slot: triggers at 15s remaining
    * For 60s slot: triggers at max(7.5s, 5s) = 7.5s remaining
  * **Expired** (100% elapsed): "⏰ Time Expired" indicator + sound notification
  * **Over-time** (>100% elapsed): "+M:SS" format display
* When time expires:

  * Timer shows "⏰ Time Expired" indicator in red with sound notification
  * Slot remains active - speaker is NOT automatically ended
  * Speaker can continue and must manually end their slot
  * If speaker continues past allocated time, timer switches to over-time display format: "+0:45" (red background, distinct visual state)
  * Speaker then selects next from participants who haven't spoken (if any remain)
* Sound notifications play at warning, critical, and expired thresholds

Server remains authoritative for slot duration.

---

## 5.5 Speaking Duration Tracking

* Each speaker's actual speaking duration is calculated from when slot begins to when slot ends
* Durations are tracked per session (no multi-round reset)
* Participants who exceed their `slotDurationSeconds` are shown as "Over Time" in the meeting summary
* Total speaking time displayed in Meeting Summary view without overtime highlighting

---

## 5.6 Meeting Summary

When meeting is finished or "End Meeting" is clicked:

* Display list of all participants with:
  * Name
  * Total time spoken (cumulative across the session)
  * Over-time indicator if they exceeded `slotDurationSeconds`
* Host can close summary to return to meeting or fully end session

---

## 5.7 Hand Raise

Inactive participants:

* Can toggle “Raise Hand”
* Visual indicator next to name
* Active speaker may address before continuing
---

## 5.8 Local Storage Persistence

To minimize friction and speed up session creation/joining:

* Browser local storage persists:
  * User name (shared across Home and Join pages)
  * Slot duration (including custom values)
* Settings pre-loaded when page loads
* Settings saved only when session is successfully created/joined
* Storage is per-browser (not per-user)
* No explicit UI to clear settings; clearing browser data resets

---

## 5.9 Quick Start UX

Focus management for faster session start:

* **First-time users** (no stored settings): Focus on Name input field
* **Returning users** (stored settings exist): Focus on action button ("Create Session" or "Join")
* Allows keyboard-only workflow: pre-loaded settings + Enter key to proceed
* Reduces clicks required to start/join meeting

---

## 5.10 Meeting Controls Visibility

To reduce visual clutter for non-active participants:

* **MeetingControls component** (End My Slot + End Meeting buttons) only visible to:
  * Active speaker (shows "End My Slot" button)
  * Host (always sees "End Meeting" button, regardless of speaker status)
* **Non-active, non-host participants**: MeetingControls hidden
  * No placeholder or message shown
  * SpeakerSelector sufficient for next speaker selection
* Same behavior on mobile (no special mobile layout difference)
---

# 6. User Flow

## 6.1 Host Flow

Login → Create Session → Share Link → Start Meeting → (Select First Speaker OR Participate as Speaker) → Meeting Cycle → View Summary → End Meeting

Host can:
- Speak during the meeting like any participant
- Select themselves as first speaker
- Monitor speaking times in real-time
- End meeting at any time (with warning if participants haven't spoken)

---

## 6.2 Participant Flow

Open Link → Enter Name → Wait in Lobby → Meeting Starts → Speak When Active → Raise Hand If Needed

---

# 7. Functional Requirements

| ID  | Requirement                                                  |
| --- | ------------------------------------------------------------ |
| F1  | Host can create a meeting session                            |
| F2  | System generates unique session link                         |
| F3  | Participants can join session                                |
| F4  | Host can start meeting                                       |
| F5  | Host can select first speaker                                |
| F6  | Active speaker indicator appears in the participant list      |
| F7  | Countdown timer visible to all                               |
| F8  | Active speaker can end slot early                            |
| F9  | When time expires, show indicator but keep speaker active    |
| F10 | Inactive users can raise/lower hand                          |
| F11 | All clients receive real-time updates                        |
| F12 | System handles reconnects gracefully                         |
| F13 | Speaker selection excludes users in spokenUserIds            |
| F14 | Prevent speaker selection once all participants have spoken  |
| F15 | Host cannot override or intervene during active speaker slot |
| F16 | Visual indicators show which participants have already spoken|
| F17 | Timer displays over-time in format +0:MM (e.g., +1:12)       |
| F18 | System tracks actual speaking duration per speaker per session |
| F19 | Meeting Summary shows total time spoken + overtime indicator |
| F20 | Host can select themselves as first speaker                  |
| F21 | End Meeting always enabled with warning for unspoken users   |
| F22 | Participant list is shown in the main column for all breakpoints |
| F23 | Participant row shows total time as "Total: M:SS" with no overtime highlight |
| F24 | Active speaker has no dedicated panel (list indicator only)  |
| F25 | Host can set custom slot duration (30-3600 seconds)          |
| F26 | Duration selector includes 9 predefined options + "Custom..." |
| F27 | Local storage persists user name and slot duration           |
| F28 | Settings pre-loaded on Home and Join page load               |
| F29 | Focus management: action button for returning users          |
| F30 | MeetingControls hidden for non-active, non-host participants |
| F31 | Timer warning state at 75% elapsed (25% remaining)           |
| F32 | Timer critical state at 87.5% elapsed (12.5% remaining, min 5s) |
| F33 | Sound notifications at warning, critical, and expired thresholds |

---

# 8. Non-Functional Requirements

## Performance

* Real-time updates < 300ms delay
* Support 20 concurrent users per session

## Reliability

* Firebase authoritative state
* Real-time sync via Firebase subscriptions
* Auto-resync on reconnect

## Security (MVP)

* Firebase Security Rules
* Session-based access
* Anonymous authentication for MVP

---

# 9. Technical Architecture (MVP)

## Frontend

* Next.js (App Router)
* React useState
* Firebase SDK
* Tailwind CSS

## Backend

* Firebase Realtime Database
* No custom backend server required
* Real-time updates via Firebase WebSocket

## Hosting

* Vercel (Frontend)
* Firebase (Realtime Database & Authentication)

---

# 10. Data Model (Simplified)

## Session

```
Session {
  id: string
  hostId: string
  slotDurationSeconds: number
  participants: List<User>
  activeSpeakerId?: string
  spokenUserIds: List<string>
  status: Lobby | Active | Finished
  slotEndsAt?: DateTime
}
```

## User / Participant

```
Participant {
  id: string
  name: string
  role: 'host' | 'participant'
  isHandRaised: boolean
  totalSpokeDurationSeconds: number     // Cumulative across the session
  speakingHistory: [
    {
      startTime: number,                 // Unix timestamp (ms) when slot started
      endTime?: number,                  // Unix timestamp (ms) when slot ended
      durationSeconds: number            // Calculated duration of this speak
    }
  ]
}
```

---

# 11. Edge Cases

| Case                          | Handling                                          |
| ----------------------------- | ------------------------------------------------- |
| Active speaker disconnects    | Host selects next from unspoken participants      |
| Host disconnects              | Promote first participant to host                 |
| Two users select next speaker | Server validates and rejects duplicate            |
| Timer drift                   | Server authoritative `slotEndsAt`                 |
| All participants have spoken  | Prevent next-speaker selection; host ends meeting |
| Speaker exceeds time limit    | Timer shows "+0:MM" over-time format; summary shows overtime indicator |
| Unspoken users on end meeting  | Warning dialog confirms ending with unspoken users |
| Selection of previous speaker | Server validates against `spokenUserIds`, rejects |

---

# 12. Risks

* WebSocket instability
* Race conditions when selecting next speaker
* Host forgetting to manage flow
* UX confusion in lobby state

Mitigation:

* Clear visual states
* Server validation
* Strict state transitions

---

# 13. MVP Timeline (3 Weeks)

### Week 1

* Firebase project setup
* Database schema design
* Session management logic
* Real-time subscription patterns

### Week 2

* Next.js UI setup
* Lobby page
* Meeting room page
* Timer component

### Week 3

* Hand raise feature
* Edge cases
* Firebase transactions for race conditions
* UX polish

---

# 14. Future Enhancements

* Speaking time analytics
* Auto-rotation mode
* Calendar integration
* Slack/Teams bot
* Meeting templates
* Historical reports
* AI summary per speaker

---

# 15. Success Metrics

After 1 month of internal usage:

* Meetings end on time ≥ 80%
* All participants speak ≥ 90% of sessions
* Positive team feedback on meeting structure
* Reduced standup duration variance

---

# 16. Design Decisions

## Speaker Selection
**Decision:** Single-turn selection with no reset.
* Active speaker can select any participant who has not spoken yet
* Once all participants have spoken, no further selection is allowed
* No ordered queue - maintains flexibility while ensuring fairness

## Host Role as Full Participant
**Decision:** Host is a full participant who can speak during the meeting.
* Host creates the session and can select the first speaker (including themselves)
* Host participates in speaker rotation like any other participant
* Host can end meeting at any time (always-active button) with warning if unspoken users exist
* Once a speaker is active, no host override capability exists during that slot
* Protects speaker autonomy while allowing host to contribute to discussion

## Timer Auto-Advance & Over-Time Display
**Decision:** No auto-advance when timer expires; over-time is visible and tracked.
* Timer shows countdown (MM:SS) until slot time expires
* At expiry: Timer switches to "Time Expired" indicator (red)
* If speaker exceeds allocated time: Timer displays over-time as "+M:SS" (e.g., "+1:12") in distinct visual state
* Speaker slot remains active until speaker manually ends it
* Gives speakers control to finish their thought while making time overages visible to all
* Over-time is indicated in Meeting Summary without special highlight styling

## Meeting Duration
**Decision:** Meetings can exceed total planned duration.
* No enforcement of total meeting duration limits
* Meeting continues until all participants have spoken or host ends meeting
* Prioritizes completion over arbitrary time constraints

