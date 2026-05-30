---
description: "Task list for Colored Labels Management"
---

# Tasks: Colored Labels Management

**Input**: Design documents from `specs/003-labels-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/labels-api.md

**Tests**: Included. Constitution Principle II requires backend tests for new
services/routes (≥70% coverage). Test tasks precede their implementation within each
story.

**Organization**: Tasks are grouped by user story (US1–US3) for independent
implementation and testing.

**Context — this feature COMPLETES an existing half-built feature.** The `Label` /
`TaskLabel` models, `label_repo`, `LabelCreate`/`LabelPublic` schemas, the
`GET/POST/DELETE /boards/{id}/labels` routes, the `labelsApi` client, `useLabels` /
`useCreateLabel`, and the task-card chips + task-dialog toggle already exist. **No new
model, no new table, no DB migration, no new dependencies.** Tasks add only the
missing slice: a label-management UI, realtime `label.*` events, and a friendly
duplicate-name guard.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US3 (setup/foundational/polish carry no story label)

## Path Conventions

Full-stack web app: `backend/app/...`, `backend/tests/...`, `frontend/src/...`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing pieces this feature builds on; no new deps/migrations.

- [x] T001 Verify the existing label baseline is present and unchanged: `Label`/`TaskLabel` in `backend/app/models/label.py`, `label_repo.{get_by_id,list_for_board,create,delete}` in `backend/app/repositories/label_repo.py`, the `GET/POST/DELETE` routes in `backend/app/api/routes/labels.py`, `labelsApi.{list,create,remove}` in `frontend/src/lib/endpoints.ts`, and `useLabels`/`useCreateLabel` in `frontend/src/hooks/use-board.ts` (no code change — establishes the baseline the new work extends)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared realtime plumbing, types, and dictionary keys the stories depend on.

**⚠️ CRITICAL**: Complete before the user-story phases.

- [x] T002 [P] Add `label.created` and `label.deleted` verbs to `human_action` in `backend/app/services/realtime.py` (e.g. "added label '{name}'" / "deleted label '{name}'")
- [x] T003 [P] Add `label.created` and `label.deleted` variants to the `WsMessage` union in `frontend/src/lib/types.ts` (`{ type: "label.created"; data: Label; actor_id: number }` and `{ type: "label.deleted"; data: { id: number }; actor_id: number }`)
- [x] T004 [P] Add the new bilingual dictionary keys (en + ar) for the manage-labels dialog (title, name field, color, create/delete buttons, empty state, success/error toasts incl. the duplicate-name message) and the two activity templates `activity.label.created` / `activity.label.deleted`, in `frontend/src/lib/i18n/dictionaries.ts`
- [x] T005 [P] Extend `humanizeActivity` to handle `label.created` and `label.deleted` action types in `frontend/src/lib/i18n/humanize-activity.ts`

**Checkpoint**: Realtime verbs, WS types, and strings exist — user stories can begin.

---

## Phase 3: User Story 1 - Apply and remove labels on a task (Priority: P1) 🎯 MVP

**Goal**: A member with edit access can apply/remove existing labels on a task; chips
appear/disappear on the card and in the task detail, live for other viewers.

**Independent Test**: On a board with ≥1 label, open a task, tick a label → a colored
chip appears on the card; untick → it disappears; a second viewer sees the change live.

**Note**: The apply/remove path already works through `PATCH /tasks/{id}` with
`label_ids` and the task-dialog toggle. This story's remaining work is making that path
reachable when a board has zero labels (so a first label can be applied) and confirming
the live behavior.

### Tests for User Story 1

- [x] T006 [P] [US1] Backend test: creating/updating a task with `label_ids` returns those labels in `TaskPublic.labels`; applying a label id from another board is rejected/ignored (board-scoped), in `backend/tests/test_labels.py` (locks the EXISTING apply path before UI work)

### Implementation for User Story 1

- [x] T007 [US1] In the task dialog, replace the `labels.length > 0` gate with an always-visible Labels section that shows an empty-state hint + a link/button to open the manage-labels dialog when the board has no labels yet, in `frontend/src/components/kanban/task-dialog.tsx`

**Checkpoint**: Members can apply/remove labels on tasks, reachable even from an empty label set (US1 acceptance scenarios; SC-002 live behavior verified in Phase 6).

---

## Phase 4: User Story 2 - Create a label with a name and color (Priority: P1)

**Goal**: A member with edit access can create a label (name + color from a palette)
from a manage-labels dialog; it becomes immediately available to apply, with a clear
message on empty/duplicate name.

**Independent Test**: Open Manage labels, create a label with a name + color → it
appears in the board's label list and is selectable in a task's label picker; a
duplicate name (any case) shows a clear "already exists" message.

### Tests for User Story 2

- [x] T008 [P] [US2] Backend test: create label succeeds (201, returns `LabelPublic`); duplicate name same-case AND different-case → 409 `label_name_taken`; empty name → 422; viewer caller → 403, in `backend/tests/test_labels.py`

### Implementation for User Story 2 (backend)

- [x] T009 [US2] Add `get_by_name_ci(db, *, board_id, name)` (case-insensitive, `func.lower(Label.name) == name.strip().lower()`) to `backend/app/repositories/label_repo.py`
- [x] T010 [US2] Create `backend/app/services/label_service.py` with `create_label(db, *, board, actor, data)` that trims the name, raises `ConflictError(code="label_name_taken")` on a case-insensitive duplicate, creates via `label_repo`, and calls `record_and_broadcast` with `action_type/ws_event="label.created"` and `ws_data=LabelPublic`
- [x] T011 [US2] Rewire `POST /boards/{board_id}/labels` to call `label_service.create_label`, adding `user: User = Depends(get_current_user)` for the actor, in `backend/app/api/routes/labels.py`

### Implementation for User Story 2 (frontend)

- [x] T012 [US2] Create the editor-only `ManageLabelsDialog` with a create form (name input + preset color palette reusing the board color set; default `#58A6FF`) and the existing-labels list, in `frontend/src/components/kanban/manage-labels-dialog.tsx`
- [x] T013 [US2] Add a "Manage labels" entry point (editor only) on the board that opens `ManageLabelsDialog`, in `frontend/src/app/(app)/boards/[boardId]/page.tsx`
- [x] T014 [US2] Wire the create form → `useCreateLabel`; show localized success and the specific `label_name_taken` duplicate message via toasts; clear the form on success, in `frontend/src/components/kanban/manage-labels-dialog.tsx`

**Checkpoint**: Members can create labels with a color and immediately apply them; duplicates are rejected clearly (US2 acceptance scenarios; SC-001, SC-003).

---

## Phase 5: User Story 3 - Delete a label (Priority: P2)

**Goal**: A member with edit access can delete a label; it leaves the board's label set
and its chips disappear from every task it was applied to, with a confirmation when in
use, live for other viewers.

**Independent Test**: Create a label, apply it to ≥2 tasks, delete it → it leaves the
label list and its chips vanish from all those tasks (a confirm prompt appears first);
a second viewer sees the same live.

### Tests for User Story 3

- [x] T015 [P] [US3] Backend test: delete label → 204 and the label is gone from `list_for_board`; a task that had it no longer returns it in `TaskPublic.labels` (cascade); deleting a missing/cross-board label → 404 `label_not_found`; viewer caller → 403, in `backend/tests/test_labels.py`

### Implementation for User Story 3 (backend)

- [x] T016 [US3] Add `delete_label(db, *, board, actor, label_id)` to `backend/app/services/label_service.py` that re-checks `label.board_id == board.id` (else `NotFoundError(code="label_not_found")`), deletes via `label_repo` (FK cascade clears `task_labels`), and calls `record_and_broadcast` with `action_type/ws_event="label.deleted"` and `ws_data={"id": label_id}`
- [x] T017 [US3] Rewire `DELETE /boards/{board_id}/labels/{label_id}` to call `label_service.delete_label`, adding `user: User = Depends(get_current_user)`, in `backend/app/api/routes/labels.py`

### Implementation for User Story 3 (frontend)

- [x] T018 [P] [US3] Add `useDeleteLabel(boardId)` mutation hook that invalidates the `labels` query AND the task `snapshot` query on success, in `frontend/src/hooks/use-board.ts`
- [x] T019 [US3] In `ManageLabelsDialog`, add a per-label delete control wired to `useDeleteLabel`, gated behind the existing confirm dialog (`frontend/src/components/ui/confirm-dialog.tsx`) with localized text and a success toast, in `frontend/src/components/kanban/manage-labels-dialog.tsx`

**Checkpoint**: Members can delete labels with confirmation; chips cascade off tasks (US3 acceptance scenarios; SC-004).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Live event handling, visibility rules, RTL, quality gates, verification, docs.

- [x] T020 Handle inbound `label.created` (invalidate `labels` query) and `label.deleted` (invalidate `labels` AND `snapshot`) WebSocket events, skipping self-originated echoes by `actor_id`, in `frontend/src/hooks/use-board-socket.ts` (FR-011, SC-002)
- [x] T021 [P] Ensure the "Manage labels" entry point and create/delete controls are editor-only (hidden for viewers) while chips still render on cards for viewers; verify across roles, in `frontend/src/app/(app)/boards/[boardId]/page.tsx` and `frontend/src/components/kanban/manage-labels-dialog.tsx` (FR-010, SC-005)
- [x] T022 [P] Apply logical Tailwind utilities + `dir`-correct layout so `ManageLabelsDialog` renders correctly in Arabic/RTL, in `frontend/src/components/kanban/manage-labels-dialog.tsx`
- [x] T023 Run backend gate: `pytest --cov=app` (≥70%) and `ruff check app tests`; fix any failures
- [x] T024 Run frontend gate: `npm run lint && npx tsc --noEmit && npm run test && npm run build`; fix any failures
- [ ] T025 Run the `quickstart.md` two-account verification (create, duplicate, apply, remove, delete-cascade with confirm, editor-only visibility, board scope, Arabic/RTL)
- [x] T026 [P] Update `README.md` (features table) to note board labels / categorization

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — baseline check.
- **Foundational (Phase 2)**: realtime verbs + WS types + strings — blocks all stories.
- **US1 (P1, MVP)**: after Foundational. Small frontend change to the task dialog.
- **US2 (P1)**: after Foundational. Backend service/route + the new manage-labels dialog
  (creates the dialog file US3 then extends).
- **US3 (P2)**: after Foundational; backend (T016–T017) independent and can run in
  parallel with US1/US2; frontend delete control (T019) extends the US2 dialog, so run
  after US2's T012.
- **Polish (Phase 6)**: after the targeted stories (T020 WS handling needs the events
  from US2/US3 to be observable end-to-end).

### User Story Dependencies

- US1 → independent (MVP): uses the already-wired apply path.
- US2 → independent backend (new service over existing repo/route); frontend introduces
  the manage-labels dialog.
- US3 → backend independent; frontend delete control extends the US2 dialog.

### Within Each User Story

- Tests before implementation. Repo → service → route (backend). API/hooks → UI
  (frontend).

### Parallel Opportunities

- Phase 2: T002 ∥ T003 ∥ T004 ∥ T005 (different files).
- US3 backend (T016→T017) can proceed in parallel with US1/US2 frontend.
- Tests T006/T008/T015 are `[P]` (same new test file but independent cases — if worked
  by one agent, append sequentially).
- `useDeleteLabel` (T018) is a different file from the dialog and runs parallel to T012.

---

## Parallel Example: User Story 2 (backend ∥ frontend)

```bash
# Backend chain (one track):
Task: "Add get_by_name_ci to label_repo.py"                        # T009
Task: "Create label_service.create_label w/ duplicate guard+broadcast"  # T010
Task: "Rewire POST /labels through the service"                    # T011

# Frontend track (parallel, different files):
Task: "Create ManageLabelsDialog with create form + palette"      # T012
Task: "Add Manage labels entry point (editor only)"               # T013
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 + Phase 2 → 2. US1 (make the apply/remove path reachable from any state).
3. **STOP & VALIDATE**: a member can tag tasks with existing labels and others see it
   live — the day-to-day value of labels.

### Incremental Delivery

1. Setup + Foundational.
2. US1 → apply/remove labels on tasks (MVP).
3. US2 → create labels with a color (SC-001, SC-003).
4. US3 → delete labels with cascade + confirm (SC-004).
5. Polish → live WS handling (SC-002), editor-only visibility (SC-005), RTL, gates, docs.

---

## Notes

- [P] = different files, no dependencies.
- **No new model, no new table, no DB migration, no new dependencies** — existing label
  schema/routes/hooks reused.
- The duplicate-name guard and broadcast live in the new `label_service` (route →
  service → repository), bringing labels in line with Principle I.
- Edit-access is enforced server-side via the existing `require_board_editor` guard —
  Principle IV. Keep all gates green (Principle II); commit after each task or group.

## Implementation status

All tasks complete except **T025** (manual two-account/Playwright walkthrough), which
was not run in this headless environment. Its behavior is covered by automated tests
(`backend/tests/test_labels.py` — 14 cases) and the green frontend gates; the live
two-account check remains for a manual pass per `quickstart.md`.
