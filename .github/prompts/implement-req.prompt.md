---
name: implement-req
description: Implement a Tick-Talk project requirement based on its specification file.
---

Implement a Tick-Talk project requirement based on its specification file.

# Important

1. Requirement, implementation story, and task are all the same thing, and can be used interchangeably. 
  - They all refer to the `/docs/stories/REQ-XXXX-*.md` files 
  - They should contain the requirement specifications, acceptance criteria, and implementation details.
2. Multiple stories.
  - When user provides multiple requirement to implement, implement them in the order provided.
  - Execute each requirement sequentially.
3. Order of execution steps for each requirement:
  1. Check [Task Tracker](/docs/tasks.md) status.
  2. Analyze the requirement.
  3. Check the dependencies listed in the requirement file. Make sure all dependent tasks are completed before you begin implementation. If not do not start the implementation, notify user and cancel the task.
  4. If dependencies are not met, notify user and cancel the task.
  5. If dependencies are met, implement the requirement.
  6. Run lint and fix errors.
  7. Build the project and fix errors.
  8. Do not run tests, they don't exist yet.
  9. Validate UI design for any created/modified components.
    - For any UI components created or modified:
      - Verify all colors use design system tokens from `docs/DESIGN_SYSTEM.md`
      - Verify spacing uses only xs/s/m/l/xl/xxl values
      - Verify typography follows the defined scale
      - Verify interactive elements have focus states (2px outline, `--color-focus-ring`)
      - Verify minimum 44px touch targets for buttons/inputs
      - Verify dark mode is the primary theme
  10. Validate acceptance criteria in the requirement file.
  11. Move requirement file to completed folder. Use script provided bellow.
  12. Mark task as completed in the requirement file (only in completed folder)
  13. Mark task as completed in task tracker
  14. Git commit with message `#REQ-XXXX: Requirement title`

# Parameters

The user will provide one of the following:
- A **requirement ID** (e.g., `REQ-0007`) — look up the file at `docs/stories/REQ-XXXX-*.md`
- A **file link** to a requirement file in `docs/stories/` folder
- Multiple requirement IDs or file links — implement them in the order provided, but only if their dependencies are met

# References

- **Requirement file** — `docs/stories/REQ-XXXX-*.md`
- **Task Tracker** — [TASKS.md](/docs/tasks.md) for current task status and dependencies
- For UI and Next.JS component implementation, also reference:
  - **Design System** — [DESIGN_SYSTEM.md](/docs/DESIGN_SYSTEM.md)
  - **AI Component Generator Guide** — [AI_COMPONENT_GENERATOR_GUIDE.md](/docs/AI_COMPONENT_GENERATOR_GUIDE.md) for component creation rules and patterns

# Project Structure

This is a Next.js 16 (App Router) project with React 19, Tailwind CSS 4, and Firebase Realtime Database.

```
app/
  page.tsx                      → Home / Create Session
  join/[sessionId]/page.tsx     → Join session (enter name)
  meeting/[sessionId]/page.tsx  → Lobby + Meeting Room
  hooks/                        → Custom React hooks
components/                     → Reusable UI components
lib/
  firebase.ts                   → Firebase app initialization
  session.ts                    → Session CRUD operations
  auth.ts                       → Anonymous auth helper
docs/
  stories/                      → Requirement specification files
  DESIGN_SYSTEM.md              → UI design tokens and rules
  AI_COMPONENT_GENERATOR_GUIDE.md → Component generation patterns
```

## Implementation Rules

1. **Follow the requirement file exactly** — implement all acceptance criteria listed in the requirement
2. **Use design system tokens** — never invent colors, spacing, or typography values; always reference DESIGN_SYSTEM.md file
3. **Follow component patterns** — use  AI_COMPONENT_GENERATOR_GUIDE.md for any UI components
4. **Check dependencies** — Verify that required tasks (listed in the requirement's Dependencies field) are completed before proceeding
5. **Use existing libs** — import from `lib/firebase.ts`, `lib/session.ts`, `lib/auth.ts` and `app/hooks/` as needed
6. **TypeScript strict** — all code must be properly typed, no `any` types
7. **Server vs Client components** — use `'use client'` directive only when component needs browser APIs, hooks, state or event handlers

# Scripts

**Run ESLint**
```bash
npm run lint
```

**Build the project**
```bash
npm run build
```
**Run unit tests**
```bash
npm test
```

**Move the requirement file to the completed subfolder**
```bash
mv docs/stories/REQ-XXXX-*.md docs/stories/completed/
```
