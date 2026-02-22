References: [PRD.md](/docs/PRD.md), [plan.md](/docs/plan.md), [tasks.md](/docs/tasks.md)

Your job is to review PRD document, plan document, tasks, existing requirements and the code generate compressive list of the clarification questions and save them into the file. Fill out the Answers section in that file. I will add answers you questions here and rerun. For each question provide 3 suggestion for the answers If [Answer section](#answers) is filled with questions and each question is addressed in that file go to [Next stage](#next-stage)

# New ideas

I want to sped up application start on the Home page and the Join page. Previously accepted settings should be pre-loaded and star button should be focused. User need only click Enter button to star or join.

1. Custom Duration (Home page)
    - Host is able to set custom slot duration: number of seconds between 40 and 3600 seconds
    - Duration Selector will have following options:
        - 60 seconds (1:00)
        - 75 seconds (1:15)
        - 90 seconds (1:30)
        - 105 seconds (1:45)
        - 120 seconds (2:00)
        - 135 seconds (2:15)
        - 150 seconds (2:30)
        - 165 seconds (2:45)
        - 180 seconds (3:00)
        - Custom ...
    - New input will be displayed when user selects custom duration
        - bellow the input text will be displayed: "Enter custom duration in seconds (30-3600)"
        - Mockup image `Plan03-custom-duration.png` attached
2. Persist settings from local storage
    - Store:
        - Your Name
        - Speaking Time Per Person (including custom or selected duration) (optional, only host can define duration)
    - Preload stored setting when Join or Home page is loaded
    - Save setting if the user changed any of them
3. Hide Meeting Controls (MeetingControls.tsx component)
    - Show MeetingControls only when the user is a last speaking user
    - Foe other user SpeakerSelector will be enough to select next speaker
4. Timer - Speaking Time Per Person - warning and critical
    - Change Speaking Time Per Person status to:
        - `warning` when 25% time left, for example 25% is 30 seconds when slot duration is 120 seconds
        - `critical` when 12.5% time left


# Answers

## 1. Custom Duration Implementation

**Q1.1: Should the custom duration input be validated in real-time or on submit?**
Answer: Validation on submit only (before creating session)

**Q1.2: When "Custom..." option is selected, should the previously selected standard duration be pre-populated in the custom input field?**
Answer: pre-populate it with the default value 120 seconds

**Q1.3: After user enters a custom duration and creates a session, should this custom value persist in local storage as the default for future sessions?**
Answer:  Yes, persist exact custom value and pre-select "Custom..." option with that value

**Q1.4: Should the custom duration validation accept edge cases like 30 seconds (below 40s mentioned) or enforce strict 40-3600 range?**
Answer: Flexible: Allow 30-3600 seconds (min 30s seems more practical)

## 2. Local Storage Persistence

**Q2.1: Should settings be stored per-user (identified by Firebase userId) or globally for the browser?**
Answer: Store globally per browser (no user association, simpler but shared across all users on same device)

**Q2.2: When should settings be saved to local storage?**
Answer: Only when session is successfully created/joined (confirmed action)

**Q2.3: For the Join page, should we also persist "Your Name" separately, or use the same stored name as Home page?**
Answer: Use same stored name for both Home and Join pages (single "userName" key)

**Q2.4: Should there be a way for users to clear stored settings (e.g., "Reset to defaults" button)?**
Answer: No explicit UI, but document that clearing browser data will reset

## 3. Hide Meeting Controls

**Q3.1: What exactly should be hidden from non-active participants?**
Answer: Hide entire MeetingControls component (End My Slot + End Meeting buttons)

**Q3.2: Should the hidden controls area show any placeholder/message for non-active participants?**
Answer: No

**Q3.3: For the host who is not currently speaking, should they still see the "End Meeting" button?**
Answer: Yes, host always sees "End Meeting" regardless of speaker status (already implemented per REQ-0024)

## 4. Timer Warning and Critical Thresholds

**Q4.1: How should the 25% warning threshold be calculated and displayed?**
Answer: Calculate as 75% elapsed (show warning when 75% of time has passed)

**Q4.2: Should the critical (12.5% remaining) and warning (25% remaining) states replace the existing critical (≤5s) and warning (≤15s) states?**
Answer: Yes, completely replace with new percentage-based thresholds

**Q4.3: Should the timer state transitions include visual/audio cues at 25% and 12.5% boundaries?**
Answer: Yes, add subtle sound notification at each threshold transition (like existing expired sound)

**Q4.4: For very short slots (e.g., 60s or 75s), would 12.5% critical threshold (~7-9s) still make sense, or should there be a minimum threshold?**
Answer: Use minimum of 5 seconds: critical = max(12.5% of slot, 5s)

## 5. Focus Management and Quick Start

**Q5.1: After settings are pre-loaded from local storage, which element should receive focus?**
Answer: The "Create Session" or "Join" button (allows immediate Enter to proceed)

**Q5.2: Should the focus behavior differ if no settings are stored (first-time user) vs. settings exist?**
Answer: Yes: first-time focus on Name field, returning users focus on action button

## 6. General Integration Questions

**Q6.1: Should custom duration value be visible in the meeting page header/info panel for participants?**
Answer: No change, current display is sufficient

**Q6.2: For Meeting Controls visibility change, should this affect mobile layout differently?**
Answer: Same behavior on mobile: hide controls for non-active speakers

# Next stage

When answers will be provided proceed with:

Your job is to update PRD, plan, tasks. Do not start requirements creation!
Use [New ideas](#new-ideas) and [answers](#answers)

# Important! 
- Do not change existing/completed requirements, but create new ones that will modify completed requirements.
