# REQ-0039: Project Restructure — `src/` Folder Layout with Minimal Pages

**Status**: ✅ Completed
**Priority**: Medium (Developer Experience / Code Organisation)
**Dependencies**: REQ-0005, REQ-0006, REQ-0007

---

## Overview

Reorganize the project so that all application source code lives under a single `src/` folder, separating it cleanly from root-level configuration files. Hooks and utilities are promoted to top-level `src/` folders rather than living inside `app/`. Each `page.tsx` file becomes a thin router that delegates all UI and logic to dedicated view components colocated under `_components/` private folders.

---

## Acceptance Criteria

- [x] `src/app/`, `src/components/`, `src/lib/`, `src/hooks/` and `src/utils.tsx` exist under `src/`.
- [x] No application source files remain at the project root (only config files: `next.config.ts`, `tsconfig.json`, `vitest.config.mts`, `eslint.config.mjs`, `package.json`, etc.).
- [x] `tsconfig.json` path alias `@/*` resolves to `./src/*`.
- [x] `vitest.config.mts` alias and `setupFiles` path are updated to match `src/`.
- [x] `tests/` stays at the project root; all imports within it resolve correctly via the updated alias.
- [x] `app/hooks/` is removed; hooks now live at `src/hooks/`.
- [x] `app/utils.tsx` is removed; utility functions now live at `src/utils.tsx`.
- [x] `src/app/page.tsx` is ≤ 10 lines — renders `<HomeForm />` only.
- [x] `src/app/meeting/[sessionId]/page.tsx` is ≤ 35 lines — status switch routing to view components.
- [x] `src/app/join/[sessionId]/page.tsx` is ≤ 15 lines — delegates to `<JoinView />`.
- [x] All 55 existing tests pass with no changes to test logic.
- [x] `npx tsc --noEmit` reports no new errors (pre-existing `useAuth.test.ts` mock-type errors are unchanged).

---

## Implementation Details

### Directory Layout After Restructure

```
/                         ← config files only
src/
  app/
    _components/
      HomeForm.tsx        ← full home page UI (extracted from page.tsx)
      join/
        JoinView.tsx      ← full join page UI (extracted from meeting/[sessionId]/page.tsx)
      meeting/
        LoadingView.tsx         ← Loading spinner
        ErrorView.tsx           ← Error state with back link
        LobbyView.tsx           ← Pre-meeting waiting room
        ActiveMeetingView.tsx   ← Active meeting UI
        FinishedView.tsx        ← Post-meeting summary/ended state
    join/[sessionId]/
      page.tsx            ← thin: resolves sessionId, renders <JoinView>
    meeting/[sessionId]/
      page.tsx            ← thin: status switch → view component
    globals.css
    layout.tsx
    page.tsx              ← thin: renders <HomeForm />
  components/             ← shared UI components (unchanged behavior)
  hooks/                  ← moved from app/hooks/
  lib/                    ← moved from lib/
  utils.tsx               ← moved from app/utils.tsx
tests/                    ← stays at root, alias updated
```

### Config Changes

**`tsconfig.json`**
```diff
- "@/*": ["./*"]
+ "@/*": ["./src/*"]
```

**`vitest.config.mts`**
```diff
- '@': path.resolve(__dirname, '.')
+ '@': path.resolve(__dirname, './src')

- setupFiles: ['./lib/__tests__/setup.ts']
+ setupFiles: ['./src/lib/__tests__/setup.ts']
```

### Import Path Changes

| Old import | New import |
|---|---|
| `@/app/hooks/useAuth` | `@/hooks/useAuth` |
| `@/app/hooks/useLocalStorage` | `@/hooks/useLocalStorage` |
| `@/app/hooks/useSession` | `@/hooks/useSession` |
| `@/app/hooks/useTimer` | `@/hooks/useTimer` |
| `@/app/utils` | `@/utils` |
| `./utils` (relative in `CreateSessionTest.tsx`) | `@/utils` |

---

## Testing Strategy

### Automated

- `npx vitest run` — all 55 tests must pass
- `npx tsc --noEmit` — no new errors introduced

### Manual

1. Start dev server (`npm run dev`).
2. Verify `/` loads and the Create Session form works end-to-end.
3. Verify `/join/[sessionId]` loads and joining a session works.
4. Verify `/meeting/[sessionId]` cycles through lobby → active → finished states.

---

## Files Modified / Created

| File | Action | Notes |
|------|--------|-------|
| `tsconfig.json` | Modified | `@/*` alias → `./src/*` |
| `vitest.config.mts` | Modified | alias + `setupFiles` paths |
| `src/app/page.tsx` | Replaced | Now delegates to `HomeForm` |
| `src/app/_components/HomeForm.tsx` | Created | Full home page UI extracted from former `page.tsx` |
| `src/app/_components/join/JoinView.tsx` | Created | Full join UI extracted |
| `src/app/_components/meeting/LoadingView.tsx` | Created | Extracted from meeting page |
| `src/app/_components/meeting/ErrorView.tsx` | Created | Extracted from meeting page |
| `src/app/_components/meeting/LobbyView.tsx` | Created | Extracted from meeting page |
| `src/app/_components/meeting/ActiveMeetingView.tsx` | Created | Extracted from meeting page |
| `src/app/_components/meeting/FinishedView.tsx` | Created | Extracted from meeting page |
| `src/app/join/[sessionId]/page.tsx` | Replaced | Now delegates to `JoinView` |
| `src/app/meeting/[sessionId]/page.tsx` | Replaced | Status-switch router only |
| `src/components/Timer.tsx` | Modified | Import path `@/hooks/useTimer` |
| `src/components/MeetingSummary.tsx` | Modified | Import path `@/utils` |
| `src/components/ParticipantList.tsx` | Modified | Import path `@/utils` |
| `src/app/CreateSessionTest.tsx` | Modified | Import path `@/utils` |
| `tests/hooks/useAuth.test.ts` | Modified | Import path `@/hooks/useAuth` |
| `tests/hooks/useLocalStorage.test.ts` | Modified | Import path `@/hooks/useLocalStorage` |
| `tests/hooks/useTimer.test.ts` | Modified | Import path `@/hooks/useTimer` |
| `tests/lib/utils.test.ts` | Modified | Import path `@/utils` |
| `app/` (root) | Deleted | Moved to `src/app/` |
| `components/` (root) | Deleted | Moved to `src/components/` |
| `lib/` (root) | Deleted | Moved to `src/lib/` |
