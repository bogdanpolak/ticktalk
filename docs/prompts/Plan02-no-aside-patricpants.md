References: [PRD.md](/docs/PRD.md), [plan.md](/docs/plan.md), [tasks.md](/docs/tasks.md)

Your job is to review PRD document, plan document, tasks, existing requirements and the code generate compressive list of the clarification questions and save them into the file. Fill out the Answers section in that file. I will add answers you questions here and rerun. For each question provide 3 suggestion for the answers If [Answer section](#answers) is filled with questions and each question is addressed in that file go to [Next stage](#next-stage)

# New ideas

1. I do not need Participants section to be displayed aside (in the right panel) on bigger screens. See attached image
2. Display participants section bellow the Active Speaker and above the Timer section
3. I do not need Active speaker view. who is speaking is visible in Participants section
4. Display total time used by a participant in the Participant Row, without highlighting over-time, just total time
4. I do not need turns. One session should be just a single turn. Last speaker should not be able to pass voice forward.


# Answers

Q1. Should the participant list move into the main column for all breakpoints, or only for desktop widths?
A1. All breakpoints (single-column stack everywhere).

Q2. Desired order in the meeting active view when no Active Speaker panel exists?
A2. Participants list -> Timer -> Meeting controls -> Hand raise -> Speaker selector -> Host end meeting.

Q3. Remove the Active Speaker component entirely or keep a minimal inline label inside the Participants list header?
A3. Remove component entirely; only per-row "Speaking" badge remains.

Q4. Single-turn session: once everyone has spoken, should the session auto-finish or wait for host to end?
A4: Wait for host to click End Meeting (no further selection allowed).

Q5. When the last speaker ends their slot and no one remains, should the "Select Next Speaker" UI disappear or show a disabled state?
A5. Hide the selector entirely.

Q6. Should the active speaker still be allowed to end their slot manually (as today), or should the host be able to end any slot once time expires?
A6. Keep current behavior: only active speaker ends their slot.

Q7. Total time in Participant row: display format preference?
A7. "Total: 3:24" (mm:ss).

Q8. Where should the total time appear within each participant row?
A7. Right-aligned badge next to status chips.

Q9. Remove overtime highlighting: should Meeting Summary also drop overtime labels and red highlights?
A1. Keep overtime in summary only, not in participant list.
- Suggestion C: Keep overtime in summary but neutral styling (no red).

Q10. Without turns, should we still keep `speakingHistory` entries for each slot for analytics/future use?
A10. Keep `speakingHistory` as-is.

Q11. End meeting warning: should the "unspoken participants" warning still appear if the host tries to end early?
A11. Yes, keep warning until everyone has spoken.

Q12. Participant list layout change: should we remove the aside grid and use a single-column layout everywhere?
A12. Yes, switch to a single-column layout.

Q13. Do you want to keep Time component functionality?
A14. Yes, do not change it.


# Next stage

When answers will be provided proceed with:

Your job is to update PRD, plan, tasks. Do not start requirements creation!
Use [New ideas](#new-ideas) and [answers](#answers)

# Important! 
- Do not change existing/completed requirements, but create new ones that will modify completed requirements.
