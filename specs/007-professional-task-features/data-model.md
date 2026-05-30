# Phase 1 Data Model: Professional Task Features

Two new entities. Both are children of `Task` and cascade-delete with it. Field types are DB-agnostic (work on PostgreSQL and SQLite).

## Entity: ChecklistItem

Table: `checklist_items`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | int | PK, autoincrement | |
| `task_id` | int | FK → `tasks.id`, `ON DELETE CASCADE`, NOT NULL, indexed | parent task |
| `content` | str | `String(500)`, NOT NULL | trimmed; non-empty (validated in schema/service) |
| `is_done` | bool | NOT NULL, default `False` | completion state |
| `position` | int | NOT NULL, default `0` | order within the task (positional, like `task.position`) |
| `created_at` | datetime | from `TimestampMixin` | |
| `updated_at` | datetime | from `TimestampMixin` | |

**Relationships**:
- `task: Mapped[Task]` (back_populates `checklist_items`)
- On `Task`: `checklist_items: Mapped[list[ChecklistItem]]` (back_populates `task`, `cascade="all, delete-orphan"`, ordered by `position`)

**Validation rules**:
- `content`: required, trimmed, 1–500 chars after trim (reject empty/whitespace-only) → `FR-008`.
- `position`: assigned by repository (`next_position`-style) on create; updated atomically on reorder.

**Derived (not stored)** — surfaced on `TaskPublic`:
- `checklist_total`: count of items for the task.
- `checklist_done`: count of items where `is_done = True`.
(These power the board card progress indicator `FR-005`/`FR-006`; computed in the snapshot query/serializer.)

**State transitions**: `is_done` toggles `False ⇄ True`. No other states.

## Entity: Comment

Table: `comments`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | int | PK, autoincrement | |
| `task_id` | int | FK → `tasks.id`, `ON DELETE CASCADE`, NOT NULL, indexed | parent task |
| `user_id` | int | FK → `users.id`, `ON DELETE CASCADE`, NOT NULL, indexed | author |
| `content` | str | `Text`, NOT NULL | trimmed; non-empty |
| `created_at` | datetime | from `TimestampMixin` | also used as the displayed timestamp |
| `updated_at` | datetime | from `TimestampMixin` | unused for now (no edit) |

**Relationships**:
- `task: Mapped[Task]` (back_populates `comments`)
- `author: Mapped[User]` (the writing user; relationship to `User`)
- On `Task`: `comments: Mapped[list[Comment]]` (back_populates `task`, `cascade="all, delete-orphan"`, ordered by `created_at` ascending)

**Validation rules**:
- `content`: required, trimmed, 1–2000 chars (reject empty/whitespace-only) → `FR-015`.

**Authorization** (enforced in service, not the model):
- Create: board editor or owner (viewer → 403) → `FR-010`, `FR-016`.
- Read: any board member incl. viewer (200) → `FR-011`.
- Delete: comment author OR board owner; otherwise 403 → `FR-014`.

**State transitions**: none (no edit in v1). Create → (optionally) Delete.

## Existing entity touched: Task (no stored-field change)

`Task` gains two relationships (`checklist_items`, `comments`) and its public serialization gains the two derived checklist counts. No existing column is modified. The board snapshot (`BoardSnapshot` → `ColumnWithTasks` → `TaskPublic`) is extended so each `TaskPublic` carries `checklist_done` and `checklist_total` for the card. Comments and full checklist item lists are fetched on demand when a task dialog opens (not embedded in the snapshot, to keep the snapshot lean — Principle V).

## Client-only view state (not persisted)

**BoardViewState** (Zustand, keyed by board id; never sent to server):

| Field | Type | Notes |
|-------|------|-------|
| `labelFilter` | `number[]` | selected label ids (empty = all) |
| `priorityFilter` | `("low"\|"medium"\|"high")[]` | empty = all |
| `dueFilter` | `("overdue"\|"today"\|"upcoming"\|"none")[]` | empty = all |
| `sort` | `"manual"\|"due"\|"priority"\|"created"` | default `"manual"` |

Text search remains the existing local `search` state on the board page (combined with the above by the pure filter helper). Filters are conjunctive across categories (`FR-018`).

## Cascade & integrity summary

- Deleting a `Task` → cascade-deletes its `checklist_items` and `comments` (DB-level `ON DELETE CASCADE` + ORM `delete-orphan`) → satisfies the "no orphans" edge case.
- Deleting a `User` → cascade-deletes their `comments` (acceptable; comments without an author are not meaningful). Activity log keeps its own `SET NULL` behavior unchanged.
