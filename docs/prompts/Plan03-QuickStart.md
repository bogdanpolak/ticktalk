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

-

# Next stage

When answers will be provided proceed with:

Your job is to update PRD, plan, tasks. Do not start requirements creation!
Use [New ideas](#new-ideas) and [answers](#answers)

# Important! 
- Do not change existing/completed requirements, but create new ones that will modify completed requirements.
