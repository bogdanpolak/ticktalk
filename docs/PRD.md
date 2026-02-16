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

  * Slot duration (e.g., 2 minutes)
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

* Active speaker (highlighted)
* Countdown timer (or "Time Expired" indicator)
* Participant list
* Hand raise indicators
* Visual indicators showing who has already spoken

Host:

* Select first speaker only
* Start/end meeting
* No override capability during active slots

Active Speaker:

* Sees "End Slot" button
* Can select next speaker from those who haven't spoken yet

---

## 5.4 Timer Logic

* Timer duration defined by host.
* When speaker selected:

  * Server sets `slotEndsAt`
  * All clients compute countdown locally.
* When time expires:

  * Timer shows "Time Expired" indicator
  * Slot remains active - speaker is NOT automatically ended
  * Speaker can continue and must manually end their slot
  * Speaker then selects next from participants who haven't spoken

Server remains authoritative.

---

## 5.5 Hand Raise

Inactive participants:

* Can toggle “Raise Hand”
* Visual indicator next to name
* Active speaker may address before continuing

---

# 6. User Flow

## 6.1 Host Flow

Login → Create Session → Share Link → Start Meeting → Select First Speaker → Meeting Cycle → End Meeting

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
| F6  | Active speaker is visually highlighted                       |
| F7  | Countdown timer visible to all                               |
| F8  | Active speaker can end slot early                            |
| F9  | When time expires, show indicator but keep speaker active    |
| F10 | Inactive users can raise/lower hand                          |
| F11 | All clients receive real-time updates                        |
| F12 | System handles reconnects gracefully                         |
| F13 | Speaker selection excludes users in spokenUserIds            |
| F14 | Reset speaker history when all participants have spoken      |
| F15 | Host cannot override or intervene during active speaker slot |
| F16 | Visual indicators show which participants have already spoken|

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

## User

```
User {
  id: string
  name: string
  role: Host | Participant
  isHandRaised: boolean
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
| All participants have spoken  | Reset `spokenUserIds`, allow re-selection         |
| Speaker exceeds time limit    | Timer shows expired, speaker manually ends        |
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
**Decision:** Free choice from participants who haven't spoken yet.
* Active speaker can select any participant who hasn't had a turn in current round
* Once all participants have spoken, reset the history and allow re-selection
* No ordered queue - maintains flexibility while ensuring fairness

## Host Override
**Decision:** Host cannot override during active speaker slots.
* Host role is limited to selecting the first speaker and managing meeting start/end
* Once a speaker is active, host has no intervention capability
* Protects speaker autonomy and reduces host management burden

## Timer Auto-Advance
**Decision:** No auto-advance when timer expires.
* Timer shows countdown and "Time Expired" indicator when time runs out
* Speaker slot remains active until speaker manually ends it
* Gives speakers control to finish their thought without abrupt cutoff

## Meeting Duration
**Decision:** Meetings can exceed total planned duration.
* No enforcement of total meeting duration limits
* Meeting continues until all participants have spoken or host ends meeting
* Prioritizes completion over arbitrary time constraints

