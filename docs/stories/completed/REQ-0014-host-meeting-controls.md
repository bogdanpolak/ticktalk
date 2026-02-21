# REQ-0014: Host "Start Meeting" + "End Meeting" Controls

**Status**: ✅ Completed  
**Priority**: High (MVP Session Lifecycle)  
**Dependencies**: REQ-0007

---

## Overview

Implement explicit host lifecycle controls to transition session state:
- Start meeting (`lobby` → `active`)
- End meeting (`active` → `finished`)

Only the host can perform these actions. Controls must enforce valid state transitions, provide clear loading/error feedback, and remain synchronized via realtime session updates.

---

## Acceptance Criteria

- [ ] Host sees `Start Meeting` button in lobby state
- [ ] Non-host users do not see `Start Meeting`
- [ ] `Start Meeting` triggers `startMeeting(sessionId)`
- [ ] Start button shows loading state while request is pending
- [ ] Host sees `End Meeting` button only during active meeting state
- [ ] Non-host users do not see `End Meeting`
- [ ] `End Meeting` triggers `endMeeting(sessionId)`
- [ ] End button is disabled if a speaker is currently active (`activeSpeakerId !== null`)
- [ ] Helpful hint text appears when end is blocked by active speaker
- [ ] Buttons show inline error feedback on failure
- [ ] Session status transitions reflected in UI without manual refresh
- [ ] Uses design system tokens and responsive layout

---

## Implementation Details

### Session Operations (`lib/session.ts`)

Confirm (or implement) these functions:

```ts
export async function startMeeting(sessionId: string): Promise<void>
export async function endMeeting(sessionId: string): Promise<void>
```

Expected updates:

- `startMeeting`:
  - set `status` to `'active'`
  - keep `activeSpeakerId` null initially (host picks first speaker)
- `endMeeting`:
  - set `status` to `'finished'`
  - clear `activeSpeakerId` and `slotEndsAt`

---

### UI Controls

Use lightweight role-aware rendering in meeting page views.

#### Lobby (`status: 'lobby'`)

- If `isHost`, render primary action `Start Meeting`
- If non-host, render waiting message

#### Active (`status: 'active'`)

- If `isHost`, render danger/secondary action `End Meeting`
- Disable end action when `activeSpeakerId !== null`
- Show helper text: `End meeting is available when no speaker is active.`

---

### Integration: `app/meeting/[sessionId]/page.tsx`

1. Derive host role: `const isHost = userId === session.hostId`
2. Add action handlers with `try/catch` + loading state:
   - `handleStartMeeting`
   - `handleEndMeeting`
3. Place controls in:
   - `LobbyView` for start
   - `ActiveMeetingView` for end
4. Keep control state entirely derived from session snapshot and local loading flags.

---

## State Transition Rules

| Current Status | Actor | Action | Next Status |
|----------------|-------|--------|-------------|
| `lobby` | host | Start Meeting | `active` |
| `active` | host | End Meeting (no active speaker) | `finished` |
| `active` | host | End Meeting (active speaker exists) | blocked |
| any | non-host | Start/End actions | blocked |

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/meeting/[sessionId]/page.tsx` | Modify | Host-only lifecycle controls and handlers |
| `lib/session.ts` | Modify (if needed) | Ensure start/end session operations are exposed |

---

## Testing Notes

- Verify host can start from lobby and all clients transition to active
- Verify non-host cannot trigger start/end actions
- Verify host can end only when no active speaker
- Verify blocked end action displays clear helper text
- Verify loading and error states for both actions
- Verify transition to finished view after successful end
