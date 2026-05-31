---
description: "Task list for Design & UX Polish"
---

# Tasks: Design & UX Polish

**Input**: Design documents from `/specs/008-design-ux-polish/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: INCLUDED for new pure logic (Vitest) + the existing AR/EN i18n parity test auto-covers new keys. No component-test framework is introduced (none exists; YAGNI). Frontend-only feature — no backend tasks.

> **Implementation status (2026-05-31)**: All build/test tasks complete and verified by
> automated gates — frontend **63 vitest passing** (+7 new `stagger` tests; i18n parity
> auto-covers the new keys) + `eslint` clean + `tsc --noEmit` clean + `next build`
> succeeds. Backend untouched (coverage unaffected). **T035–T036** are manual/visual
> passes (throttled-load skeletons, open/close animations, reduced-motion, desktop-
> unchanged) and remain unchecked since this run is headless — left for a human to confirm.

**Organization**: Grouped by user story (P1 skeletons → P2 animations → P2 micro-interactions → P3 empty states). Each is an independently testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Paths are under `frontend/src/...`

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Confirm baseline gates green on branch `008-design-ux-polish`: `npm run lint`, `npx tsc --noEmit`, `npx vitest run`, `npm run build` (from `frontend/`)
- [X] T002 Confirm no new runtime dependencies are needed (reuse Tailwind/CSS keyframes, lucide-react, sonner already in `frontend/package.json`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared primitives every story builds on (keyframes, Skeleton primitive, exit-transition hook, stagger helper).

**⚠️ CRITICAL**: Stories depend on these.

- [X] T003 [P] Add new keyframes to `frontend/src/app/globals.css`: `skeleton-shimmer` (moving gradient), `fade-out`, `scale-out`, and a `slide-out` variant; ensure they sit under the existing `prefers-reduced-motion`/`prefers-reduced-transparency` handling (no per-rule motion needed since the global block neutralizes them)
- [X] T004 [P] Register the new animations in `frontend/tailwind.config.ts` (`animation`: `skeleton-shimmer`, `fade-out`, `scale-out`, `slide-out-*`) alongside existing `fade-in`/`scale-in`
- [X] T005 [P] Create `frontend/src/lib/stagger.ts`: pure `stagger(index, opts?)` → `min(index*step, cap)` ms (defaults step=40, cap=240; NaN/negative → 0)
- [X] T006 [P] Create `frontend/src/components/ui/skeleton.tsx`: base `Skeleton({ className })` block using existing tokens (`bg-bg-muted`) + `skeleton-shimmer`; `motion-reduce:animate-none` static fallback; legible under reduced-transparency
- [X] T007 [P] Create `frontend/src/hooks/use-exit-transition.ts`: `useExitTransition(open, durationMs)` → `{ mounted, closing }`; keeps element mounted during close animation, cancels pending unmount if reopened, treats reduced-motion as ~0 duration

**Checkpoint**: Primitives ready.

---

## Phase 3: User Story 1 - Skeleton loaders (Priority: P1) 🎯 MVP

**Goal**: Content-shaped skeletons replace spinners on the boards list, board snapshot, and task dialog (checklist + comments); no layout shift; static under reduced motion.

**Independent Test**: Throttle network → boards list shows card-grid skeleton, board shows column+card skeleton, task dialog shows line skeletons; content swaps in with no jump; reduce-motion → static.

### Tests for User Story 1

- [ ] T008 [P] [US1] Vitest in `frontend/src/lib/__tests__/stagger.test.ts` (foundational helper used by US2 too, but first needed here for list reveals) — covers step/cap/edge cases

### Implementation for User Story 1

- [X] T009 [P] [US1] Create `frontend/src/components/skeletons/board-card-skeleton.tsx`: a single card-shaped skeleton + a grid wrapper matching the boards grid (`grid-cols`/gap from boards/page.tsx)
- [X] T010 [P] [US1] Create `frontend/src/components/skeletons/board-snapshot-skeleton.tsx`: column-shaped skeletons (`w-72`, same spacing) each with header + a few task-card-shaped skeletons
- [X] T011 [P] [US1] Create `frontend/src/components/skeletons/thread-skeleton.tsx`: line-shaped skeletons for checklist rows and comment rows (reusable for both)
- [X] T012 [US1] Replace the loading `Spinner` in `frontend/src/app/(app)/boards/page.tsx` with the boards-grid skeleton (depends on T009)
- [X] T013 [US1] Replace the `FullPageSpinner` loading branch in `frontend/src/app/(app)/boards/[boardId]/page.tsx` with the board-snapshot skeleton (keep error/not-found handling intact) (depends on T010)
- [X] T014 [US1] Use `ThreadSkeleton` while loading in `frontend/src/components/kanban/checklist-section.tsx` (replace inline spinner) (depends on T011)
- [X] T015 [US1] Use `ThreadSkeleton` while loading in `frontend/src/components/kanban/comments-thread.tsx` (replace inline spinner) (depends on T011)
- [X] T016 [US1] Verify no layout shift: skeleton footprints match loaded content on all three surfaces (sized to real content; final visual confirm in T035)

**Checkpoint**: Skeletons live on all primary surfaces, CLS-free, reduced-motion-safe.

---

## Phase 4: User Story 2 - Smooth entrance & exit animations (Priority: P2)

**Goal**: Dialogs + both drawers animate on close (not just open); activity feed & boards grid reveal with a stagger; all instant under reduced motion.

**Independent Test**: Close a dialog/drawer → animates out; lists reveal staggered; reduce-motion → instant.

### Implementation for User Story 2

- [X] T017 [US2] Add exit animation to `frontend/src/components/ui/dialog.tsx` using `useExitTransition` (enter `scale-in`, exit `scale-out`/`fade-out`); ensure backdrop fades too; interruption-safe (depends on T007)
- [X] T018 [US2] Activity drawer (`frontend/src/components/kanban/activity-drawer.tsx`) already transform-animates on BOTH open and close (stays mounted, toggles translate/opacity) — verified compliant, no change needed
- [X] T019 [US2] Add exit animation to `frontend/src/components/mobile-nav.tsx` drawer + scrim (slide/fade out) via `useExitTransition` (depends on T007)
- [X] T020 [P] [US2] Apply staggered entrance in `frontend/src/components/kanban/activity-feed.tsx`: per-item `animationDelay` from `stagger(index)` on the existing `animate-fade-in` (depends on T005)
- [X] T021 [P] [US2] Apply staggered entrance to board cards in `frontend/src/components/boards/board-card.tsx` (per-index `stagger` delay via new `index` prop from boards/page.tsx mapper) (depends on T005)

**Checkpoint**: Open/close animations + list stagger working, reduced-motion-safe.

---

## Phase 5: User Story 3 - Consistent micro-interactions (Priority: P2)

**Goal**: A `loading` prop on the shared Button replaces ~13 hand-rolled spinner patterns; subtle success cue; consistent hover/press.

**Independent Test**: Trigger each mutating action → button shows in-button spinner + disabled, consistent everywhere; success toast appears.

### Implementation for User Story 3

- [X] T022 [US3] Extend `frontend/src/components/ui/button.tsx` with `loading?: boolean` (renders Spinner before children, combines with `disabled`, `aria-busy`, preserves label); keep existing variants/press/focus
- [X] T023 [P] [US3] Replace `{pending && <Spinner/>}` with `loading={...}` in `frontend/src/components/kanban/task-dialog.tsx` (depends on T022)
- [X] T024 [P] [US3] Same in `frontend/src/components/kanban/checklist-section.tsx` add-item button (depends on T022)
- [X] T025 [P] [US3] Same in `frontend/src/components/kanban/comments-thread.tsx` post button (depends on T022)
- [X] T026 [P] [US3] Same in `frontend/src/components/boards/create-board-dialog.tsx` and `frontend/src/components/kanban/manage-labels-dialog.tsx` (depends on T022)
- [X] T027 [P] [US3] Same in `frontend/src/components/boards/board-settings-dialog.tsx` (update + invite buttons) and `frontend/src/components/ui/confirm-dialog.tsx` (depends on T022)
- [X] T028 [P] [US3] Same in the auth screens: `frontend/src/app/(auth)/login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx` (depends on T022)
- [X] T029 [US3] Success cue satisfied by existing `toast.success` on mutating paths (research Decision 6) — no new component; removed all now-unused `Spinner` imports

**Checkpoint**: One consistent in-button loading pattern app-wide; success cues present.

---

## Phase 6: User Story 4 - Improved empty states (Priority: P3)

**Goal**: Board-level "no matching tasks" empty state when filters/search match nothing; tidy per-column placeholder.

**Independent Test**: Filter to zero → board-level empty state; empty column → placeholder; bilingual + both themes.

### Implementation for User Story 4

- [X] T030 [US4] In `frontend/src/app/(app)/boards/[boardId]/page.tsx`: when filters/search active AND total matched tasks across all columns is 0, render `EmptyState` (`board.filterEmpty.*`) instead of the columns (distinct from loading skeleton)
- [X] T031 [US4] `frontend/src/components/kanban/column.tsx` already shows a tidy per-column placeholder (`column.noTasks`) for empty/filtered-empty columns (filters reduce the tasks array) — verified, no change needed

**Checkpoint**: All four stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T032 [P] Add new AR + EN dictionary keys in `frontend/src/lib/i18n/dictionaries.ts` (`board.filterEmpty.title`, `board.filterEmpty.desc`); parity test auto-covers
- [X] T033 [P] Update `README.md` (Features) and `docs/ARCHITECTURE.md` (a UX/animation section) — skeletons, exit animations, Button loading, empty states (per constitution docs rule)
- [X] T034 Run frontend gates from `frontend/`: `npm run lint`, `npx tsc --noEmit`, `npx vitest run` (63 passing, incl. stagger test + i18n parity), `npm run build` — all green
- [ ] T035 Verify desktop ≥1280px settled state is visually unchanged (boards page, board, task dialog) — only loading/transition/hover/empty differ *(manual/visual — left for human; headless run)*
- [ ] T036 Run `quickstart.md` flows A–D manually (servers up) — record results; note any manual-only checks left unverified honestly *(manual — left for human; headless run)*

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (P1)**: no deps.
- **Foundational (P2)**: after Setup — provides keyframes, `Skeleton`, `useExitTransition`, `stagger`. **Blocks all stories.**
- **US1 (P1)**: needs `Skeleton` (T006) + skeleton compositions. MVP.
- **US2 (P2)**: needs `useExitTransition` (T007) + `stagger` (T005).
- **US3 (P2)**: needs Button `loading` (T022); call-site swaps are independent/parallel after.
- **US4 (P3)**: depends only on existing EmptyState + filter logic; independent.
- **Polish (P7)**: after stories.

### Within Each Story
- Foundational primitive → compositions → wire into surfaces. US3: extend Button first, then swap call sites in parallel.

### Parallel Opportunities
- Foundational T003–T007 all parallel (different files). US1 compositions T009–T011 parallel. US3 call-site swaps T023–T028 parallel after T022. US2 T020/T021 parallel.

---

## Parallel Example: Foundational

```text
Task: "Add keyframes to globals.css"                 # T003
Task: "Register animations in tailwind.config.ts"    # T004
Task: "Create lib/stagger.ts"                        # T005
Task: "Create components/ui/skeleton.tsx"            # T006
Task: "Create hooks/use-exit-transition.ts"          # T007
```

---

## Implementation Strategy

### MVP First (US1 only)
Setup → Foundational → US1 (skeletons) → STOP & VALIDATE (throttled load, reduced-motion) → demo.

### Incremental Delivery
Foundational → US1 (skeletons, MVP) → US2 (animations) → US3 (micro-interactions) → US4 (empty states). Run gates (T034) before commit.

---

## Notes
- [P] = different files, no dependency. [US#] maps to spec user stories.
- Frontend-only: no backend tasks, no migrations. Backend coverage unaffected (stays ≥70%).
- No new runtime dependencies. Desktop ≥1280px settled state must stay visually unchanged.
- Commit after logical groups; final commit + push at end of `/speckit-implement`.
