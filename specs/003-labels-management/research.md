# Phase 0 Research: Colored Labels Management

The spec assumed labels were a greenfield feature. Codebase investigation showed
labels are **already partially implemented**, which shrinks scope to completing the
user-facing slice. This document records what exists, the gaps against the spec, and
the decisions for closing each gap.

## What already exists (verified)

| Area | File | State |
|------|------|-------|
| Model | `backend/app/models/label.py` | `Label` (board_id FK CASCADE, name, color default `#58A6FF`, `UniqueConstraint(board_id, name)`) + `TaskLabel` association (both PKs FK CASCADE). |
| Repo | `backend/app/repositories/label_repo.py` | `get_by_id`, `list_for_board` (ordered by name), `create`, `delete`. No name lookup. |
| Schemas | `backend/app/schemas/label.py` | `LabelCreate` (name 1–60, color default), `LabelUpdate` (unused), `LabelPublic`. |
| Routes | `backend/app/api/routes/labels.py` | `GET` (viewer), `POST` (editor), `DELETE` (editor). Routes call the **repo directly** — no service layer, **no broadcast**. |
| Task↔label | `backend/app/schemas/task.py`, `task_service.py`, `task_repo.py` | Tasks accept `label_ids` on create/update; `TaskPublic.labels` returns chips. Apply/remove already works via task update. |
| Frontend API | `frontend/src/lib/endpoints.ts` | `labelsApi.list / create / remove` all present. |
| Frontend hooks | `frontend/src/hooks/use-board.ts` | `useLabels` (query) and `useCreateLabel` (mutation, **currently unused**). No delete hook. |
| Frontend UI | `task-card.tsx`, `task-dialog.tsx` | Chips render on cards; task dialog toggles labels — but only when `labels.length > 0`, and there is **no UI to create the first label**. |
| i18n | `dictionaries.ts` | `task.labels` exists (en "Labels" / ar "التصنيفات"). No management strings. |

## Gaps against the spec

1. **No way to create or delete a label from the UI** (US2, US3). The create hook is
   orphaned; no delete hook or management surface exists.
2. **No live propagation** of label create/delete (FR-011, SC-002). The routes never
   call `record_and_broadcast`, and there are no `label.*` WS message types.
3. **Duplicate name → 500, not a friendly 409** (FR-002, SC-003). `label_repo.create`
   relies on the DB `UniqueConstraint`, surfacing as an IntegrityError.
4. **No delete confirmation** for an applied label (FR-008).
5. **No entry point to create the first label** — the task dialog hides the label
   section entirely when the board has zero labels.

## Decisions

### D1 — Introduce a thin `label_service`
- **Decision**: Add `backend/app/services/label_service.py` with `create_label` and
  `delete_label`; route the two mutating endpoints through it. List can stay direct
  (read-only, no business rule) or also move — keep it on the route for minimal churn.
- **Rationale**: Constitution Principle I requires `route → service → repository`;
  the duplicate-name rule and the broadcast are business logic and belong in a
  service, not the route. This also aligns labels with tasks/boards.
- **Alternatives considered**: Put the duplicate check + broadcast inline in the
  route — rejected as a layering leak the constitution forbids.

### D2 — Case-insensitive duplicate-name guard
- **Decision**: Add `label_repo.get_by_name_ci(db, board_id, name)` using
  `func.lower(Label.name) == name.strip().lower()`; `create_label` raises
  `ConflictError("...", code="label_name_taken")` when a match exists.
- **Rationale**: Spec FR-002 mandates case-insensitive uniqueness and a clear message.
  Checking in the service yields the friendly `{ error, code }` shape; the DB
  constraint remains as a backstop (it is case-sensitive, so the service check is the
  real guard).
- **Alternatives considered**: Rely solely on the DB constraint — rejected: it is
  case-sensitive and produces a 500, failing SC-003.

### D3 — Broadcast `label.created` and `label.deleted`
- **Decision**: After create/delete, call `record_and_broadcast` with
  `ws_event="label.created"` (data = `LabelPublic`) / `"label.deleted"` (data =
  `{ id }`). Add matching verbs to `human_action`. Routes pass the current user as
  `actor` (the create/delete routes must add `user: User = Depends(get_current_user)`).
- **Rationale**: Mirrors the established task/column event pattern; gives live updates
  (SC-002) and an activity-feed entry for free.
- **Alternatives considered**: Frontend polling — rejected; inconsistent with the
  app's real-time model (Principle III).

### D4 — Client handling of label events (delete cascades chips)
- **Decision**: In `use-board-socket.ts`, on `label.created`/`label.deleted` (and not
  self-originated), invalidate the `labels` query. On `label.deleted` **also**
  invalidate the task snapshot so chips for the removed label disappear live.
- **Rationale**: Deleting a label removes `task_labels` rows server-side (FK cascade);
  the cheapest correct client reaction is a snapshot refetch, consistent with how
  `task.moved` already invalidates the snapshot.
- **Alternatives considered**: Surgically strip the deleted label id from cached
  tasks — rejected for v1 as more code for no UX gain over a refetch.

### D5 — Apply/remove labels reuses the existing task-update path
- **Decision**: No new endpoint for applying labels. US1 (apply/remove on a task) is
  already served by `PATCH /tasks/{id}` with `label_ids`. This feature ensures labels
  *exist to apply* and that the task dialog is reachable even from an empty state.
- **Rationale**: YAGNI (Principle V); the association is already modeled and wired.
- **Alternatives considered**: Dedicated `POST/DELETE /tasks/{id}/labels/{labelId}` —
  rejected as redundant with task update.

### D6 — Color input: curated preset palette
- **Decision**: The manage-labels dialog offers a fixed palette (reuse the board
  color set used by `board-settings-dialog.tsx`), not a free color field. Default to
  the model default `#58A6FF` if somehow none chosen.
- **Rationale**: Spec assumption — consistent, on-brand chips; matches the existing
  board color-picker pattern.
- **Alternatives considered**: Free hex input — rejected for v1 (visual consistency,
  validation cost).

### D7 — Rename/recolor out of scope
- **Decision**: Do not wire `LabelUpdate` / add a PATCH route. Create + delete +
  apply/remove only, per the spec.
- **Rationale**: Matches the spec's explicit v1 boundary; avoids speculative work
  (Principle V). Leaving `LabelUpdate` unused is acceptable (pre-existing).

## Open questions

None. All spec `[NEEDS CLARIFICATION]` were resolved at the spec stage; the
edit-access (owner+editor) management model is confirmed by the existing
`require_board_editor` guard on the label routes.
