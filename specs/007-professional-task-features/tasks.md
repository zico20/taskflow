---
description: "Task list for Professional Task Features"
---

# Tasks: Professional Task Features

**Input**: Design documents from `/specs/007-professional-task-features/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

> **Implementation status (2026-05-30)**: All build/test tasks complete and verified by
> automated gates — backend `pytest` **83 passing, 79% coverage** (≥70% gate met) +
> `ruff` clean; frontend **56 vitest passing** (incl. new `due-status`, `task-filter-sort`,
> and AR/EN parity) + `eslint` clean + `tsc --noEmit` clean + `next build` succeeds; the
> Alembic migration applies cleanly to a fresh DB (`checklist_items`, `comments` created).
> Tasks **T049–T050** are manual/visual passes (run the app, eyeball desktop-unchanged +
> the four flows) and remain unchecked since this run is headless — they are honestly left
> for a human to confirm. No new config keys were introduced (**T046** confirmed).

**Tests**: INCLUDED — the spec mandates backend coverage ≥70% (NON-NEGOTIABLE) incl. viewer-denied/non-member paths, plus Vitest for new pure helpers and i18n parity.

**Organization**: Grouped by user story (P1 checklist → P2 comments → P2 filter/sort → P3 due badges). Each story is an independently testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Paths follow the project web-app split: `backend/app/...`, `backend/tests/...`, `frontend/src/...`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm environment is ready; no new dependencies are introduced.

- [X] T001 Verify backend venv + `pytest`/`ruff` run and frontend `npm` scripts (lint/tsc/vitest/build) run green on branch `007-professional-task-features` (baseline before changes)
- [X] T002 Confirm no new runtime dependencies are needed (reuse FastAPI/SQLAlchemy/date-fns/dnd-kit/Zustand/TanStack Query already in `backend/pyproject.toml` and `frontend/package.json`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema + shared types/serialization that BOTH new entities and the snapshot summary depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 [P] Create `ChecklistItem` model in `backend/app/models/checklist_item.py` (task_id FK CASCADE, content String(500), is_done bool default False, position int default 0, TimestampMixin)
- [X] T004 [P] Create `Comment` model in `backend/app/models/comment.py` (task_id FK CASCADE, user_id FK CASCADE, content Text, TimestampMixin; `author` relationship to User)
- [X] T005 Add relationships to `backend/app/models/task.py`: `checklist_items` (ordered by position, `cascade="all, delete-orphan"`) and `comments` (ordered by created_at, `cascade="all, delete-orphan"`); register both new models in `backend/app/models/__init__.py` (depends on T003, T004)
- [X] T006 Create Alembic migration `backend/alembic/versions/<rev>_add_checklist_and_comments.py` with `down_revision = "19a101a6aad2"` creating `checklist_items` and `comments` tables with FK cascades and indexes (depends on T005)
- [X] T007 Extend `backend/app/schemas/task.py`: add `checklist_done: int` and `checklist_total: int` to `TaskPublic`; update the snapshot serialization so each task carries these counts (depends on T005)

**Checkpoint**: Schema + task summary fields ready — user stories can begin.

---

## Phase 3: User Story 1 - Subtasks / Checklist (Priority: P1) 🎯 MVP

**Goal**: Editors/owners add, toggle, reorder, delete checklist items on a task; viewers read-only; progress (done/total) shows on the card; all changes broadcast live.

**Independent Test**: Add 3 items to a task, toggle one → card shows 1/3; reorder persists; second session sees changes within ~1s; viewer is read-only.

### Tests for User Story 1 (write first, expect FAIL)

- [X] T008 [P] [US1] Backend tests in `backend/tests/test_checklist.py`: list/create/toggle/update/reorder/delete happy paths; empty/whitespace + over-length rejection (422); viewer write → 403; non-member → 404; deleting a task cascades its items; create returns next position
- [X] T009 [P] [US1] Vitest for the card progress display logic (done/total → "n/m", hidden when total=0) colocated in `frontend/src/lib/__tests__/` (pure helper if extracted) — assert no "0/0"

### Implementation for User Story 1

- [X] T010 [P] [US1] Create `backend/app/schemas/checklist.py`: `ChecklistItemCreate` (content), `ChecklistItemUpdate` (content?, is_done?), `ChecklistReorder` (item_ids: list[int]), `ChecklistItemPublic`; trim + length validators
- [X] T011 [P] [US1] Create `backend/app/repositories/checklist_repo.py`: `list_for_task`, `get_by_id`, `next_position`, `create`, `update`, `set_order`, `delete`
- [X] T012 [US1] Create `backend/app/services/checklist_service.py`: create/update/toggle/reorder/delete with validation, role checks, and `record_and_broadcast` (events `checklist.created/updated/reordered/deleted`; activity `checklist.item_added/item_removed`) (depends on T010, T011)
- [X] T013 [US1] Create `backend/app/api/routes/checklist.py`: routes under `/boards/{board_id}/tasks/{task_id}/checklist` (GET viewer+, POST/PATCH/reorder/DELETE editor+); wire into the API router (depends on T012)
- [X] T014 [US1] Extend task snapshot/read path so `checklist_done`/`checklist_total` are populated efficiently (avoid N+1: aggregate counts) (depends on T007, T011)
- [X] T015 [P] [US1] Frontend: add `ChecklistItem` type to `frontend/src/lib/types.ts`; add `checklistApi` (list/create/update/reorder/remove) to `frontend/src/lib/endpoints.ts`; add `checklist_done`/`checklist_total` to the `Task` type
- [X] T016 [P] [US1] Create `frontend/src/hooks/use-checklist.ts`: TanStack Query hook(s) for fetching a task's items and mutations (optimistic where simple), invalidating/patching the open dialog + snapshot card counts
- [X] T017 [US1] Create `frontend/src/components/kanban/checklist-section.tsx`: add-item input, item rows (toggle, edit, delete), drag-reorder via dnd-kit; read-only when not editor; Liquid Glass tokens; RTL/LTR + reduced-motion safe (depends on T015, T016)
- [X] T018 [US1] Integrate checklist section into `frontend/src/components/kanban/task-dialog.tsx` (additive; desktop layout unchanged) (depends on T017)
- [X] T019 [US1] Add progress indicator (done/total) to `frontend/src/components/kanban/task-card.tsx`, hidden when total=0 (depends on T015)
- [X] T020 [US1] Handle `checklist.*` WS events in `frontend/src/hooks/use-board-socket.ts` (ignore self by actor id; patch dialog items + snapshot card counts) (depends on T015)
- [X] T021 [P] [US1] Add AR + EN dictionary keys for checklist UI in `frontend/src/lib/i18n/dictionaries.ts`; add `checklist.item_added/item_removed` to `frontend/src/lib/i18n/humanize-activity.ts` (parity test auto-covers)

**Checkpoint**: Checklist fully functional, real-time, role-gated, with card progress.

---

## Phase 4: User Story 2 - Comments (Priority: P2)

**Goal**: Editors/owners post text comments; everyone (incl. viewer) reads them with author + timestamp oldest-first; author or board owner deletes; changes broadcast live.

**Independent Test**: Post 2 comments → show author + relative time, oldest first; viewer read-only; live append in second session; delete own comment removes it everywhere.

### Tests for User Story 2 (write first, expect FAIL)

- [X] T022 [P] [US2] Backend tests in `backend/tests/test_comments.py`: list ordered oldest→newest; create happy path; empty/whitespace + over-length → 422; viewer create → 403; non-member → 404; delete by author OK; delete by other editor → 403; delete by board owner OK; deleting a task cascades comments

### Implementation for User Story 2

- [X] T023 [P] [US2] Create `backend/app/schemas/comment.py`: `CommentCreate` (content, trim+length), `CommentPublic` (id, task_id, content, author=UserPublic, created_at)
- [X] T024 [P] [US2] Create `backend/app/repositories/comment_repo.py`: `list_for_task` (ordered), `get_by_id`, `create`, `delete`
- [X] T025 [US2] Create `backend/app/services/comment_service.py`: create (editor+), list (viewer+), delete (author OR board owner else 403) with `record_and_broadcast` (events `comment.created/deleted`; activity `comment.added/removed`) (depends on T023, T024)
- [X] T026 [US2] Create `backend/app/api/routes/comments.py`: routes under `/boards/{board_id}/tasks/{task_id}/comments` (GET viewer+, POST editor+, DELETE author/owner); wire into API router (depends on T025)
- [X] T027 [P] [US2] Frontend: add `Comment` type to `frontend/src/lib/types.ts`; add `commentsApi` (list/create/remove) to `frontend/src/lib/endpoints.ts`
- [X] T028 [P] [US2] Create `frontend/src/hooks/use-comments.ts`: TanStack Query fetch + create/delete mutations for a task's thread
- [X] T029 [US2] Create `frontend/src/components/kanban/comments-thread.tsx`: thread list (author, relative time, oldest-first), compose box (editor+), delete affordance only on own comments (or owner); Liquid Glass; RTL/LTR (depends on T027, T028)
- [X] T030 [US2] Integrate comments thread into `frontend/src/components/kanban/task-dialog.tsx` (additive; desktop unchanged) (depends on T029)
- [X] T031 [US2] Handle `comment.*` WS events in `frontend/src/hooks/use-board-socket.ts` (ignore self; append/remove in open thread) (depends on T027)
- [X] T032 [P] [US2] Add AR + EN dictionary keys for comments UI in `frontend/src/lib/i18n/dictionaries.ts`; add `comment.added/removed` to `humanize-activity.ts`

**Checkpoint**: Comments fully functional, real-time, role-gated, author/owner delete.

---

## Phase 5: User Story 3 - Advanced Filtering & Sorting (Priority: P2)

**Goal**: Client-only conjunctive filters (label / priority / due-status / text) + per-column sort (manual default / due / priority / created); manual preserves drag-and-drop; non-manual disables persisting reorders; no effect on other members.

**Independent Test**: Combine label + priority + overdue filters → only matches show; sort by due reorders within columns (no-date last); other member unaffected; switch to manual → drag works again.

### Tests for User Story 3 (write first, expect FAIL)

- [X] T033 [P] [US3] Vitest in `frontend/src/lib/__tests__/task-filter-sort.test.ts`: conjunctive filter logic across label/priority/due/text; each sort mode incl. no-date-last and manual passthrough; empty-result handling

### Implementation for User Story 3

- [X] T034 [P] [US3] Create `frontend/src/lib/due-status.ts`: pure helper mapping due_date + local today → `overdue|today|upcoming|none` (+ days for upcoming) using date-fns
- [X] T035 [P] [US3] Create `frontend/src/lib/task-filter-sort.ts`: pure functions to filter (conjunctive) and sort a `ColumnWithTasks[]` given view state + search (depends on T034)
- [X] T036 [P] [US3] Create `frontend/src/stores/board-view-store.ts`: Zustand store keyed by board id holding labelFilter/priorityFilter/dueFilter/sort with reset action
- [X] T037 [US3] Create `frontend/src/components/kanban/board-filter-bar.tsx`: filter controls (labels, priority, due status) + sort selector + clear-all; uses Liquid Glass; responsive (no overflow); RTL/LTR (depends on T036)
- [X] T038 [US3] Wire filter bar + view state into `frontend/src/app/(app)/boards/[boardId]/page.tsx`, combining with existing `search`; pass filtered/sorted columns to `KanbanBoard` (depends on T035, T037)
- [X] T039 [US3] Update `frontend/src/components/kanban/kanban-board.tsx`: when sort !== "manual", disable drag reorder (no persisted order contradicting sort); when "manual", behave exactly as before (depends on T038)
- [X] T040 [US3] Per-column empty state when filters match nothing (no layout break) in `kanban-board.tsx`/column render (depends on T038)
- [X] T041 [P] [US3] Add AR + EN dictionary keys for filter/sort UI + due-status labels in `frontend/src/lib/i18n/dictionaries.ts`

**Checkpoint**: Filtering & sorting work client-side, drag preserved in manual mode, no cross-member effect.

---

## Phase 6: User Story 4 - Due / Overdue Badges (Priority: P3)

**Goal**: Replace simple red overdue text with explicit badges (Overdue / Due today / In N days), bilingual, RTL/LTR, light/dark, reduced-motion-safe; none for no-date tasks.

**Independent Test**: Tasks due past/today/+3d show correct badges + wording in AR & EN, both themes, no overflow; no-date task shows no badge.

### Tests for User Story 4 (write first, expect FAIL)

- [X] T042 [P] [US4] Vitest in `frontend/src/lib/__tests__/due-status.test.ts`: past→overdue, today→today, future→upcoming(+days), null→none (reuses helper from T034)

### Implementation for User Story 4

- [X] T043 [US4] Add a `DueBadge` rendering in `frontend/src/components/kanban/task-card.tsx` driven by `due-status.ts`: urgent/warning/neutral variants via existing CSS-var tokens; no badge when none; RTL/LTR placement; respects prefers-reduced-motion (depends on T034)
- [X] T044 [P] [US4] Ensure due-status label keys exist in AR + EN in `frontend/src/lib/i18n/dictionaries.ts` (shared with T041; add any missing: overdue/today/inNDays)

**Checkpoint**: All four stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification, docs, and gates across all stories.

- [X] T045 [P] Update `README.md` and `docs/ARCHITECTURE.md` to document checklist, comments, filtering/sorting, and due badges (per constitution docs rule)
- [X] T046 [P] Update `backend/.env.example` only if any new config key was introduced (none introduced — confirmed)
- [X] T047 Run backend gates from `backend/`: `pytest -q` (coverage ≥70%, incl. new suites) and `ruff check .`
- [X] T048 Run frontend gates from `frontend/`: `npm run lint`, `npx tsc --noEmit`, `npx vitest run` (incl. new helpers + i18n parity), `npm run build`
- [ ] T049 Verify desktop ≥1280px is visually unchanged except additive elements (checklist section, comments thread, progress + due badges) — spot check board + task dialog *(manual/visual — left for human; headless run)*
- [ ] T050 Run `quickstart.md` flows A–D manually (servers up) — record results; note any manual-only checks left unverified honestly *(manual — left for human; headless run)*

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)**: no deps.
- **Foundational (P2)**: after Setup — **BLOCKS all stories** (models, migration, snapshot fields).
- **User Stories (P3–P6)**: after Foundational. US1 (checklist) and US2 (comments) are independent backend slices. US3 (filter/sort) and US4 (due badges) are frontend-only and depend only on existing data + the `due-status` helper (US4 reuses US3's helper).
- **Polish (P7)**: after desired stories complete.

### User Story Dependencies

- **US1 (P1)**: needs Foundational (model+migration+snapshot counts). Independent of US2–US4.
- **US2 (P2)**: needs Foundational (Comment model+migration). Independent of US1/US3/US4.
- **US3 (P2)**: frontend-only over existing snapshot; independent. Shares `due-status.ts` with US4.
- **US4 (P3)**: frontend-only; reuses `due-status.ts` (T034). Can ship after US3 or standalone if T034 done.

### Within Each Story

- Tests first (expect FAIL) → schemas/repos (parallel) → service → route → frontend types/api → hooks → components → WS wiring → i18n.

### Parallel Opportunities

- T003/T004 (models) parallel; T008/T009 (US1 tests) parallel; T010/T011 (US1 schema+repo) parallel; T015/T016/T021 parallel-ish (different files).
- US1 and US2 backend slices can be built in parallel by different developers after Foundational.
- US3 and US4 frontend work can proceed in parallel with the backend stories.

---

## Parallel Example: User Story 1

```text
# Tests (write first):
Task: "Backend tests in backend/tests/test_checklist.py"        # T008
Task: "Vitest for card progress display logic"                  # T009

# Then schema + repo together:
Task: "Create backend/app/schemas/checklist.py"                 # T010
Task: "Create backend/app/repositories/checklist_repo.py"       # T011
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational (CRITICAL) → 3. Phase 3 US1 → **STOP & VALIDATE** checklist end-to-end → demo.

### Incremental Delivery

Foundational → US1 (MVP, checklist) → US2 (comments) → US3 (filter/sort) → US4 (due badges). Each adds value without breaking prior stories. Run gates (T047–T048) before commit.

---

## Notes

- [P] = different files, no dependency. [US#] maps to spec user stories.
- Tests are mandatory here (constitution ≥70% backend coverage; include viewer-403 and non-member-404 paths).
- No new runtime dependencies. Desktop ≥1280px must stay visually unchanged except the additive elements.
- Commit after each logical group; final commit + push at end of `/speckit-implement` (per established workflow).
