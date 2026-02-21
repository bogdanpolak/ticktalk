# REQ-0030: Meeting Summary Overtime Styling Update

**Status**: 🟨 Requirements created  
**Priority**: Medium (UI/UX Polish)  
**Dependencies**: REQ-0023, REQ-0020

---

## Overview

Simplify the Meeting Summary display by removing the red highlight styling for participants who exceeded their slot duration. While the system still tracks whether participants went over time, the visual presentation should be minimal and non-judgmental.

This change focuses on keeping the Meeting Summary clean and informative without stigmatizing participants who spoke longer than their allocated time. The overtime indicator remains visible but no longer uses aggressive styling.

---

## Acceptance Criteria

### Visual Styling Updates

- [ ] Remove red background/border highlighting from participant rows in Meeting Summary
- [ ] Remove any red text color for overtime participants
- [ ] Keep standard row styling consistent for all participants (spoken or overtime)
- [ ] Maintain readability and clarity without color-based warnings

### Overtime Indicator

- [ ] Keep overtime indicator visible (e.g., "⏱️ +1:23" or similar)
- [ ] Display overtime amount next to total speaking time
- [ ] Use neutral styling for overtime indicator (gray or muted color)
- [ ] Overtime indicator should be subtle, not alarming

### Data Display

- [ ] Total speaking time remains unchanged and accurate
- [ ] Format: "Total: M:SS" for participants who stayed within slot duration
- [ ] Format: "Total: M:SS (+M:SS)" or similar for participants who exceeded
- [ ] Number of turns displayed if participant spoke multiple times (future-proof)

### Component Consistency

- [ ] MeetingSummary.tsx is the only component affected
- [ ] Participant list (during active meeting) remains unchanged
- [ ] Timer component overtime display (red background) remains unchanged
- [ ] Only Meeting Summary receives this styling update

---

## Implementation Details

### Updated MeetingSummary Component

Modify `components/MeetingSummary.tsx` to remove red styling:

```tsx
// Before (remove this):
<div className={cn(
  "participant-summary-row",
  isOvertime && "bg-red-100 border-red-300"  // REMOVE THIS
)}>
  <span className={cn(
    "participant-name",
    isOvertime && "text-red-700"  // REMOVE THIS
  )}>
    {participant.name}
  </span>
  <span className="total-time">
    {formatTime(participant.totalSpokeDurationSeconds)}
  </span>
</div>

// After (simplified):
<div className="participant-summary-row">
  <span className="participant-name">
    {participant.name}
  </span>
  <span className="total-time">
    {formatTime(participant.totalSpokeDurationSeconds)}
    {isOvertime && (
      <span className="overtime-indicator text-muted">
        {' '}(+{formatOvertime(overtimeSeconds)})
      </span>
    )}
  </span>
</div>
```

---

### Overtime Calculation (No Changes)

The overtime calculation logic remains the same, but styling changes:

```ts
// Calculate if participant exceeded their allocated slot duration
const isOvertime = participant.speakingHistory?.some((entry) => {
  return entry.durationSeconds > session.slotDurationSeconds
})

// Calculate total overtime amount (optional, for display)
const overtimeSeconds = participant.speakingHistory?.reduce((total, entry) => {
  const excess = Math.max(0, entry.durationSeconds - session.slotDurationSeconds)
  return total + excess
}, 0) || 0
```

---

### Styling Classes

Update Tailwind classes or CSS for neutral styling:

```css
/* Before (remove aggressive styling): */
.bg-red-100 { background-color: #fee; }
.border-red-300 { border-color: #faa; }
.text-red-700 { color: #c00; }

/* After (use subtle neutral styling): */
.overtime-indicator {
  color: #6b7280; /* gray-500 */
  font-size: 0.875rem; /* smaller text */
  font-weight: normal;
}

.participant-summary-row {
  /* Keep standard styling for all rows */
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}
```

---

### Format Helper Functions

Add or update formatting helpers:

```ts
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

function formatOvertime(overtimeSeconds: number): string {
  const minutes = Math.floor(overtimeSeconds / 60)
  const secs = overtimeSeconds % 60
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
```

---

## User Flow

```
Meeting ends (status = 'finished' or End Meeting clicked)
        ↓
MeetingSummary component displays
        ↓
For each participant:
  - Show name
  - Show total speaking time
  - If overtime: show subtle overtime indicator in parentheses
  - Use consistent neutral styling (no red highlights)
        ↓
Host reviews summary
        ↓
Host closes summary or ends session
```

---

## UI/UX Mockup

### Before (with red styling)

```
Meeting Summary
───────────────────────────────────────
| Alice        Total: 2:30 (⏱️ +0:30) | ← RED BACKGROUND
| Bob          Total: 1:45             |
| Charlie      Total: 3:15 (⏱️ +1:15) | ← RED BACKGROUND
───────────────────────────────────────
```

### After (neutral styling)

```
Meeting Summary
───────────────────────────────────────
| Alice        Total: 2:30 (+0:30)     | ← Normal background
| Bob          Total: 1:45             |
| Charlie      Total: 3:15 (+1:15)     | ← Normal background
───────────────────────────────────────
```

---

## Technical Considerations

### Styling Removal

- Remove all conditional CSS classes based on overtime status
- Keep overtime detection logic (still needed for indicator display)
- Ensure consistent row heights and spacing

### Accessibility

- Overtime indicator should not rely solely on color (already addressed with text indicator)
- Maintain sufficient contrast for all text elements
- Screen readers should announce overtime information clearly

### Performance

- No performance impact (removing conditional styling is simpler)
- Formatting functions remain lightweight

---

## Testing Requirements

### Visual Tests

- [ ] Verify no red styling appears in Meeting Summary for overtime participants
- [ ] Verify overtime indicator displays correctly with neutral styling
- [ ] Verify all participant rows have consistent styling
- [ ] Test with various overtime amounts (short and long)
- [ ] Test with participants who stayed within time limit
- [ ] Test with mix of overtime and on-time participants

### Functional Tests

- [ ] Overtime detection still works correctly
- [ ] Total time displays accurately for all participants
- [ ] Overtime amount calculates correctly
- [ ] Component renders correctly with 0, 1, or many participants

### Regression Tests

- [ ] Timer component still shows red background for overtime (unchanged)
- [ ] Participant list during meeting shows correct indicators (unchanged)
- [ ] MeetingSummary data accuracy unchanged

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `components/MeetingSummary.tsx` | Modify | Remove red styling for overtime participants |
| `app/globals.css` or Tailwind config | Update | Remove or update overtime-specific classes |

---

## Success Criteria

At completion:

- Meeting Summary displays clean, neutral styling for all participants
- No red highlights, borders, or text for overtime participants  
- Overtime indicator remains visible but subtle
- Consistent visual presentation across all summary rows
- Data accuracy maintained (no functional changes)
- Code is simpler (fewer conditional styles)

---

## References

- [REQ-0023: Meeting Summary with Speaking Times](/docs/stories/completed/REQ-0023-meeting-summary.md)
- [REQ-0020: Speaking Duration Tracking](/docs/stories/completed/REQ-0020-speaking-duration-tracking.md)
- [Plan Section 3.3: Meeting Page](/docs/plan.md#meeting-page)
