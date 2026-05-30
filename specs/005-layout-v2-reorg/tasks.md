---
description: "Task list for Layout v2 — Navigation & Layout Reorganization"
---

# Tasks: Layout v2 — Navigation & Layout Reorganization

**Input**: Design documents from `specs/005-layout-v2-reorg/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md

**Tests**: No new automated tests. Layout/presentation-only with **zero logic changes**
(hooks/lib/stores/types byte-identical). Verification is the existing Vitest suite (incl.
the AR/EN dictionary-parity test) + `tsc` + `eslint` + `build`, plus a manual nav × theme
× language pass (quickstart.md). Render tests for pure layout would be low-value churn
(Constitution Principle V).

**Organization**: Tasks grouped by user story (US1–US3).

**Context — file sync from `NewDesign1/` into `frontend/`.** A diff confirmed: 2 NEW
files (`sidebar.tsx`, `kanban/activity-drawer.tsx`), 9 restructured files, **1 deletion**
(`app-shell.tsx`, the old top bar). All logic/data/test files are byte-identical and MUST
NOT be touched. `tailwind.config.ts` unchanged from `004`. No new dependencies. Builds on
the already-adopted `004` Liquid Glass design.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US3 (setup/foundational/polish carry no story label)

## Path Conventions

Frontend-only: source under `frontend/src/`. Design source under `NewDesign1/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the integration surface before changing anything; no new deps.

- [x] T001 Verify the integration baseline with a diff of `NewDesign1/` vs `frontend/src/`: confirm logic/data/test files (`hooks/*`, `lib/{api,types,endpoints,board-logic,utils,demo-data}`, `lib/i18n/*` except `dictionaries.ts`, `stores/*`, all tests, `tailwind.config.ts`) are byte-identical; that the 2 new files import only already-present packages; and that `app-shell` is referenced only by `app/(app)/layout.tsx` (which the v2 version replaces with `Sidebar`) — establishes the "do not touch logic / no new deps / safe to delete app-shell" baseline

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The layout token + the new strings the stories depend on.

**⚠️ CRITICAL**: Complete before the user-story phases.

- [x] T002 [P] Replace `frontend/src/app/globals.css` with `NewDesign1/app/globals.css` (adds the `--sidebar-w` layout token; otherwise the `004` token system)
- [x] T003 [P] Update `frontend/src/lib/i18n/dictionaries.ts` to add the 5 new keys (`nav.allBoards`, `nav.boards`, `boards.group.owned`, `boards.group.editor`, `boards.group.viewer`) to BOTH `en` and `ar`, copying values from `NewDesign1/lib/i18n/dictionaries.ts`; remove no existing keys (the AR/EN parity test must stay green)

**Checkpoint**: Layout token and strings exist — the stories can render correctly.

---

## Phase 3: User Story 1 - Navigate via the persistent sidebar (Priority: P1) 🎯 MVP

**Goal**: A persistent sidebar replaces the top bar — brand, "All boards", the user's
boards quick-switch list (color + count), and bottom user/theme/language/logout — with an
icon-rail collapse and RTL mirroring.

**Independent Test**: Log in → sidebar shows All boards + your boards with counts +
bottom controls; click a board to open, "All boards" to go back; resize narrow → icon
rail; switch to Arabic → mirrors to the right.

### Implementation for User Story 1

- [x] T004 [US1] Add the new `frontend/src/components/sidebar.tsx` (brand, "All boards", boards quick-switch list with color + task count, bottom user/theme/language/logout; collapses to an icon rail under `lg`; RTL-aware) from `NewDesign1/`
- [x] T005 [US1] Replace `frontend/src/app/(app)/layout.tsx` with the `NewDesign1/` version (aurora → flex: `<Sidebar/>` + `<main>`; imports `Sidebar` instead of the old top bar) — depends on T004
- [x] T006 [US1] Delete `frontend/src/components/app-shell.tsx` (old top bar, now superseded by `Sidebar`; verify no remaining imports via `tsc`)

**Checkpoint**: The sidebar is the primary nav on every in-app screen; the old top bar is
gone (US1; SC-001, SC-004, SC-007).

---

## Phase 4: User Story 2 - Boards grouped by role (Priority: P2)

**Goal**: The boards page shows a thin context header and boards grouped into labeled
sections by the viewer's role (owned / shared-can-edit / shared-view-only) with counts;
empty groups omitted.

**Independent Test**: As a user with boards across roles, open the boards page → three
labeled groups with the right boards and counts; create/open/delete still work.

### Implementation for User Story 2

- [x] T007 [US2] Replace `frontend/src/app/(app)/boards/page.tsx` with the `NewDesign1/` version (context header + role-grouped sections using the existing per-board `role`; empty groups omitted) — uses the `boards.group.*` keys from T003

**Checkpoint**: Boards are grouped by role with counts; create/open/delete unchanged
(US2; SC-003).

---

## Phase 5: User Story 3 - Restructured board, activity drawer, dialogs (Priority: P2)

**Goal**: The board view gets a breadcrumb header + toolbar + full-width kanban; the
activity feed becomes a slide-over drawer (same `activityPanelOpen` flag); the task
dialog becomes two-column; board settings uses a side tab rail.

**Independent Test**: Open a board → breadcrumb header + toolbar + full-width kanban;
toggle activity → drawer slides over; open a task → two-column dialog; open settings →
side tab rail. Every action behaves as before.

### Implementation for User Story 3

- [x] T008 [P] [US3] Add the new `frontend/src/components/kanban/activity-drawer.tsx` (slide-over activity panel driven by the existing `activityPanelOpen` UI-store flag) from `NewDesign1/`
- [x] T009 [US3] Replace `frontend/src/app/(app)/boards/[boardId]/page.tsx` with the `NewDesign1/` version (breadcrumb context header + toolbar row + full-width kanban; renders the activity drawer) — depends on T008
- [x] T010 [P] [US3] Replace `frontend/src/components/kanban/task-dialog.tsx` with the `NewDesign1/` version (two-column: content ǀ properties — same fields/actions)
- [x] T011 [P] [US3] Replace `frontend/src/components/boards/board-settings-dialog.tsx` with the `NewDesign1/` version (side tab rail for Details/Members — same fields/actions)

**Checkpoint**: Board view, activity drawer, task dialog, and settings all reflect Layout
v2 with unchanged behavior (US3).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Remaining restyles, remove staging, run gates, verify, docs.

- [x] T012 [P] Replace `frontend/src/components/landing/landing-page.tsx` and `frontend/src/app/demo/page.tsx` with their `NewDesign1/` versions (restyle)
- [x] T013 Delete the `NewDesign1/` staging folder now that its content lives in `frontend/` (single source of truth)
- [x] T014 Run the frontend gates: `npm run lint && npx tsc --noEmit && npm run test && npm run build`; fix any failures (the AR/EN dictionary-parity Vitest test must pass; `tsc`/`build` confirm no dangling `app-shell` import)
- [ ] T015 Manual verification per `quickstart.md`: sidebar nav + collapse + RTL mirror (SC-001/004/007); boards grouped by role (SC-003); breadcrumb header + full-width kanban + activity drawer + two-column task dialog + side-tab settings (US3); existing actions unchanged (SC-002); Dark/Light × AR/EN (SC-005); AR strings intact (SC-006)
- [x] T016 [P] Update `README.md` (features table) to note the sidebar navigation + role-grouped boards + activity drawer layout

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — baseline diff check.
- **Foundational (Phase 2)**: `globals.css` token + strings — blocks the stories.
- **US1 (P1, MVP)**: after Foundational. Sidebar + app layout + delete the top bar.
- **US2 (P2)**: after Foundational; the boards page uses the `boards.group.*` strings.
- **US3 (P2)**: after Foundational; the board page (T009) depends on the new drawer
  (T008).
- **Polish (Phase 6)**: after the stories; T013 (delete NewDesign1) must follow every
  copy task; T014/T015 verify the whole thing.

### User Story Dependencies

- US1 → the structural core (sidebar replaces top bar). MVP.
- US2 → independent page change; needs the group strings (Foundational).
- US3 → board-view restructure; its board page depends on US3's new drawer.

### Within Each Story

- Different files → parallel `[P]`. T005 depends on T004 (layout imports Sidebar);
  T006 (delete app-shell) after T005; T009 depends on T008 (page renders the drawer).

### Parallel Opportunities

- Phase 2: T002 ∥ T003 (different files).
- US3: T008 ∥ T010 ∥ T011 (distinct files); T009 after T008.
- Polish: T012 ∥ T016 (distinct files); T013 after all copies; T014 after T013.

---

## Parallel Example: User Story 3 (independent file copies)

```bash
Task: "Add kanban/activity-drawer.tsx"                 # T008
Task: "Replace kanban/task-dialog.tsx (two-column)"    # T010
Task: "Replace boards/board-settings-dialog.tsx (rail)"# T011
# then:
Task: "Replace boards/[boardId]/page.tsx (renders drawer)"  # T009
```

---

## Implementation Strategy

### MVP First (Foundational + US1)

1. Phase 1 (baseline) → Phase 2 (token + strings).
2. US1 — sidebar + app layout + remove the top bar. **STOP & VALIDATE**: the app
   navigates via the new sidebar on every screen — the headline "Layout v2" change.

### Incremental Delivery

1. Setup + Foundational.
2. US1 → sidebar navigation (MVP, SC-001/004/007).
3. US2 → role-grouped boards (SC-003).
4. US3 → board view + drawer + dialogs + settings rail.
5. Polish → restyle landing/demo, remove NewDesign1, gates, manual RTL/theme pass
   (SC-005/006), README.

---

## Notes

- [P] = different files, no dependencies.
- **Layout/presentation-only**: do NOT modify hooks/lib/stores/types/tests (verified
  identical). **No new dependencies.** `tailwind.config.ts` unchanged. No backend.
- The activity drawer reuses the existing `activityPanelOpen` UI-store flag (Principle I).
- Deleting `app-shell.tsx` removes dead code once `Sidebar` replaces it (Principle V);
  `tsc`/`build` guard against any dangling import.
- Keep all frontend gates green (Principle II); commit after each phase or logical group.

## Implementation status

All tasks complete except **T015** (manual sidebar/nav × theme × language walkthrough),
which was not run in this headless session. Correctness is otherwise covered by the green
gates (T014): `tsc --noEmit` (also confirms no dangling `app-shell` import), `eslint`, 36
Vitest tests (incl. the AR/EN dictionary-parity test), and a clean `next build` (9 routes,
unchanged set). The visual/RTL/theme pass per `quickstart.md` remains for a manual check.
```
