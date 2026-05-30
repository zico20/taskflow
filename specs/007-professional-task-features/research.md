# Phase 0 Research: Professional Task Features

All technical context was resolved by auditing the existing codebase; there are no open `NEEDS CLARIFICATION` items. This document records the key design decisions and why they were chosen, grounded in existing patterns.

## Decision 1: New entities mirror the `labels` vertical slice

- **Decision**: Implement `ChecklistItem` and `Comment` as full vertical slices: `model → repository → service → route → schema → test`, exactly like the existing `Label` feature (`backend/app/models/label.py`, `repositories/label_repo.py`, `services/label_service.py`, `api/routes/labels.py`, `tests/test_labels.py`).
- **Rationale**: Constitution Principle I mandates strict layering and "no SQL outside repositories". Reusing the proven labels structure minimizes risk and reviewer surprise.
- **Alternatives considered**: Putting checklist/comment logic directly in `task_service.py` — rejected: would bloat task service and blur entity boundaries.

## Decision 2: Reuse `record_and_broadcast()` for all real-time

- **Decision**: Every checklist/comment mutation calls the existing `backend/app/services/realtime.py::record_and_broadcast(db, board_id, actor, action_type, payload, ws_event, ws_data)`. New WS event strings: `checklist.created`, `checklist.updated`, `checklist.deleted`, `checklist.reordered`, `comment.created`, `comment.deleted`.
- **Rationale**: Principle III — REST is the source of truth, WS only notifies, self-echo ignored by `actor_id`. The existing task events already follow this; the frontend socket hook already filters self by actor id.
- **Alternatives considered**: A dedicated checklist/comment websocket channel — rejected (YAGNI; the board channel already fans out per board).

## Decision 3: Checklist & comment activity logging

- **Decision**: Mutations also write an `ActivityLog` row (via the same `record_and_broadcast`) using action types like `checklist.item_added`, `comment.added`. The activity feed already paginates and the `humanize-activity.ts` helper maps action types to localized strings.
- **Rationale**: Consistency with existing task/label activity; the activity drawer is already wired.
- **Alternatives considered**: No activity logging for these — rejected; the drawer exists and users expect a unified history. (Kept minimal: only meaningful actions logged, not every toggle, to avoid noise — toggles broadcast via WS but log only add/delete to respect Principle V.)

## Decision 4: Positional ordering for checklist items

- **Decision**: `ChecklistItem` gets an integer `position` and reorder is a "set new order" operation, mirroring `task.position` / `column.position` (which use a `POSITION_STEP` step in `task_repo.next_position`).
- **Rationale**: Existing, proven ordering approach. Reorder reconciles from server like task moves (Principle III).
- **Alternatives considered**: Linked-list ordering — rejected (more complex, no benefit at this scale; YAGNI).

## Decision 5: Filtering & sorting are client-only (Zustand)

- **Decision**: Filters (label / priority / due-status / text) and per-column sort (manual / due / priority / created) live in a new Zustand store keyed by board id. They transform the already-loaded board snapshot in a pure helper (`task-filter-sort.ts`) before render. No new server query params.
- **Rationale**: Principle I (UI-only state → Zustand, not TanStack Query), Principle V (the snapshot already returns all tasks; server-side filtering is unneeded now). FR-021 requires presentation-only with no cross-member effect — a client store guarantees this.
- **Alternatives considered**: Server-side filter/sort query params — rejected for now; explicitly deferred to the later performance feature (board pagination) with an in-code note, per Principle V.

## Decision 6: Drag-and-drop interaction with non-manual sort

- **Decision**: When sort = "manual" (default), `kanban-board.tsx` drag-and-drop behaves exactly as today. When a non-manual sort is active, drag reordering within a column is disabled (sensor short-circuited / drop ignored) so the app never persists an order that contradicts the visible sorted order (FR-022, FR-023). Cross-column moves may remain allowed (they change `column_id`, which is authoritative regardless of sort) — but to keep v1 simple and unambiguous, all drag is disabled under non-manual sort and the user is shown the sort is active.
- **Rationale**: Avoids a confusing "I dragged it but it snapped back / saved a wrong order" experience. Matches FR-023.
- **Alternatives considered**: Auto-switch to manual on drag — rejected (surprising; hidden state change).

## Decision 7: Due-status computed on the client

- **Decision**: A pure helper `due-status.ts` maps a task's `due_date` + the viewer's local "today" to one of `overdue | today | upcoming | none`, returning a status key and (for upcoming) day count. Card renders a badge from this. Uses existing `date-fns` (already a dependency) and the existing date-locale wiring.
- **Rationale**: "Today/overdue" must use the viewer's local day (Assumptions). No server round-trip needed; due_date is already in the snapshot. Pure helper is unit-testable (Principle II).
- **Alternatives considered**: Server-computed status — rejected; timezone-correctness is per-viewer and the data is already client-side.

## Decision 8: Comment delete authorization

- **Decision**: A comment may be deleted by its author OR by the board owner (moderation). Enforced in `comment_service`. Viewers cannot delete; editors can delete only their own.
- **Rationale**: Spec Assumptions documented this default. Owner moderation is a low-cost, expected capability.
- **Alternatives considered**: Author-only — still acceptable; chosen owner+author for moderation. No editing in v1 (YAGNI).

## Decision 9: Migration strategy

- **Decision**: Add a single Alembic migration `add_checklist_and_comments` with `down_revision = 19a101a6aad2` (current head). Local SQLite dev/tests auto-create tables via `Base.metadata.create_all`; production migrates. Both tables: FK to `tasks.id` with `ON DELETE CASCADE` so deleting a task removes its checklist items and comments (edge case in spec).
- **Rationale**: Constitution Technology Constraints — every model change ships an Alembic migration; cascade handles the "no orphans" edge case at the DB level.
- **Alternatives considered**: Two separate migrations — unnecessary; one logical change.

## Decision 10: No new frontend/backend dependencies

- **Decision**: Everything is built with the current stack. Badges/animations use existing Tailwind + CSS variable tokens and respect the existing `prefers-reduced-motion` block in `globals.css`.
- **Rationale**: Principle V (YAGNI) and the additive/desktop-unchanged constraint.
