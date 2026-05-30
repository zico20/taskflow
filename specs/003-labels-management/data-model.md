# Phase 1 Data Model: Colored Labels Management

**No schema change. No migration.** Both tables already exist
(`backend/app/models/label.py`). This document records the existing model the
feature builds on and the validation rules enforced above it.

## Entities

### Label (`labels` table — existing)

| Field | Type | Rules |
|-------|------|-------|
| `id` | int, PK | auto |
| `board_id` | int, FK → `boards.id` `ON DELETE CASCADE`, indexed | required; scopes the label to one board |
| `name` | str, `String(60)` | required, 1–60 chars after trim; **unique per board, case-insensitive** (enforced in service; DB has case-sensitive `UniqueConstraint(board_id, name)` as backstop) |
| `color` | str, `String(20)` | required at the DB level; defaults to `#58A6FF`; UI supplies a value from the preset palette |
| `created_at` / `updated_at` | datetime | from `TimestampMixin` |

Relationships:
- `board` → the owning board (`back_populates="labels"`, board cascades delete to its labels).
- `tasks` → many-to-many via `task_labels`.

### TaskLabel (`task_labels` table — existing association)

| Field | Type | Rules |
|-------|------|-------|
| `task_id` | int, PK, FK → `tasks.id` `ON DELETE CASCADE` | part of composite PK |
| `label_id` | int, PK, FK → `labels.id` `ON DELETE CASCADE` | part of composite PK |

The composite PK makes each (task, label) pair unique — applying an already-applied
label is a no-op, satisfying the spec edge case. Deleting a label removes its
`task_labels` rows automatically (FK cascade), so chips disappear from every task.

## State & lifecycle

- **Create**: service checks case-insensitive name uniqueness within the board →
  inserts → broadcasts `label.created`.
- **Apply / remove on a task**: handled by the existing task-update flow
  (`label_ids` on `PATCH /tasks/{id}`); the task service reconciles `task_labels` to
  match the provided id set, validating each id belongs to the same board.
- **Delete**: service re-checks the label belongs to the board → deletes (FK cascade
  clears `task_labels`) → broadcasts `label.deleted`.

## Validation rules (enforced in service/schema, not new columns)

- **VR-1** Name required, non-empty after trim (schema `min_length=1`; service trims).
- **VR-2** Name unique within board, case-insensitive (service `get_by_name_ci` →
  `ConflictError code="label_name_taken"`).
- **VR-3** Color always present (schema default `#58A6FF`; UI sends a palette value).
- **VR-4** Cross-board safety: on delete, the label's `board_id` must equal the
  guarded board, else `NotFoundError code="label_not_found"`.
- **VR-5** Label ids applied to a task must belong to that task's board (already
  enforced by `task_repo.get_labels_by_ids(..., board_id=...)`).
