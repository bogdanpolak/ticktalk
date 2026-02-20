# REQ-0013: Participant List with Status Indicators

**Status**: ⬜ Not Started  
**Priority**: High (MVP Visibility)  
**Dependencies**: REQ-0007, REQ-0008, REQ-0011

---

## Overview

Implement a realtime participant list for the meeting page that clearly communicates each participant state:
- currently speaking (`🎤`)
- hand raised (`✋`)
- already spoke in current round (`✅`)

The list must remain synchronized with Firebase session data and serve as the central context panel during active meetings.

---

## Acceptance Criteria

- [ ] Component: `components/ParticipantList.tsx` created
- [ ] Displays all participants from `session.participants`
- [ ] Shows host label for session host participant
- [ ] Shows speaking indicator (`🎤`) for `activeSpeakerId`
- [ ] Shows hand-raised indicator (`✋`) when `participant.isHandRaised === true`
- [ ] Shows spoken indicator (`✅`) when participant id is in `spokenUserIds`
- [ ] Uses deterministic ordering:
  - [ ] Active speaker first
  - [ ] Hand-raised participants next
  - [ ] Remaining participants alphabetically by name
- [ ] Displays participant count in header
- [ ] Supports empty participants fallback text
- [ ] Integrates into `ActiveMeetingView`
- [ ] Uses design system spacing/typography/colors
- [ ] Mobile-responsive without overflow issues

---

## Implementation Details

### Component: `components/ParticipantList.tsx`

**Props**:

```tsx
import type { Participant } from '@/lib/session'

interface ParticipantListProps {
  participants: Record<string, Participant>
  activeSpeakerId: string | null
  spokenUserIds: string[]
  hostId: string
}
```

**Derived model**:

```tsx
interface ParticipantRow {
  userId: string
  name: string
  role: 'host' | 'participant'
  isHandRaised: boolean
  isActiveSpeaker: boolean
  hasSpoken: boolean
}
```

**Sort rules**:

1. `isActiveSpeaker` descending
2. `isHandRaised` descending
3. `name` ascending (`localeCompare`)

**Rendering guidance**:

- Header: `Participants (N)`
- Row left: participant name + optional `Host` badge
- Row right: compact status chips/icons in priority order:
  1. `🎤 Speaking`
  2. `✋ Hand raised`
  3. `✅ Spoke`

---

### Integration: `app/meeting/[sessionId]/page.tsx`

In active meeting layout, render list adjacent to primary speaker/timer section.

Example placement:

```tsx
<div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
  <section>{/* Active speaker + timer + controls */}</section>
  <aside>
    <ParticipantList
      participants={session.participants}
      activeSpeakerId={session.activeSpeakerId}
      spokenUserIds={session.spokenUserIds || []}
      hostId={session.hostId}
    />
  </aside>
</div>
```

---

## Visual States

| Participant State | Indicator | Notes |
|------------------|-----------|-------|
| Active speaker | `🎤` | Highest emphasis row |
| Hand raised | `✋` | Highlight interest to be selected |
| Already spoke | `✅` | Not eligible until round reset |
| Host | `Host` badge | Independent of speaking state |

Multiple indicators can coexist (example: host currently speaking).

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `components/ParticipantList.tsx` | Create | Participant status panel for active meeting |
| `app/meeting/[sessionId]/page.tsx` | Modify | Render participant list in active meeting view |

---

## Testing Notes

- Verify list updates when participants join/leave
- Verify active speaker icon changes immediately after selection
- Verify spoken indicator reflects `spokenUserIds` updates
- Verify raised-hand indicator changes without page refresh
- Verify sorting order rules for mixed participant states
- Verify layout on narrow mobile screens
