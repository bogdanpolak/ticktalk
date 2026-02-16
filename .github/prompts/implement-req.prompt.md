---
name: implement-req
description: Implement a Tick-Talk project requirement based on its specification file.
---

Implement a Tick-Talk project requirement based on its specification file.

# Parameters

The user will provide one of the following:
- A **requirement ID** (e.g., `REQ-0007`) — look up the file at `docs/stories/REQ-XXXX-*.md`
- A **file link** to a requirement file in `docs/stories/` folder

# Context Files

Before starting implementation, read and understand these files: 

- **Requirement file** — the specific `docs/stories/REQ-XXXX-*.md` file containing acceptance criteria, implementation details, and file paths
- **Task Tracker** — [TASKS.md](/docs/TASKS.md) for current task status and dependencies

For UI and Next.JS component implementation, also reference:
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
  components/                   → Reusable UI components
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

## Post-Implementation Checklist

After implementing the requirement, perform all of the following steps:

### 1. Run ESLint
```bash
npm run lint
```
Fix all linting errors before proceeding.

### 2. Build the project
```bash
npm run build
```
Fix any build/type errors until the build succeeds.

### 3. Run unit tests (if they exist)
```bash
npm test
```
If test scripts exist, run them and fix any failures.

### 4. Validate UI design
For any UI components created or modified:
- Verify all colors use design system tokens from `docs/DESIGN_SYSTEM.md`
- Verify spacing uses only xs/s/m/l/xl/xxl values
- Verify typography follows the defined scale
- Verify interactive elements have focus states (2px outline, `--color-focus-ring`)
- Verify minimum 44px touch targets for buttons/inputs
- Verify dark mode is the primary theme

### 5. Mark task as completed

Perform these three updates:

**(a)** In the requirement file (`docs/stories/REQ-XXXX-*.md`), update the Status field:
```
**Status**: ✅ Completed
```

**(b)** Move the requirement file to the completed subfolder:
```bash
mv docs/stories/REQ-XXXX-*.md docs/stories/completed/
```

**(c)** In `docs/tasks.md`, update the task status from ⬜ or 🟨 to ✅:
```
| REQ-XXXX | Task description | ✅ |
```
