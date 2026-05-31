# Phase 1 Data Model: Design & UX Polish

This feature introduces **no data entities** — no models, no tables, no migrations, no API shapes. It is purely presentational. What follows documents the **UI states** and the small client-side contracts the implementation relies on, in lieu of a data model.

## UI states (per surface)

Each targeted surface moves through these states; this feature only changes how `loading` and `empty` are presented.

| Surface | loading (NEW: skeleton) | empty (NEW/improved) | ready | error |
|---------|-------------------------|----------------------|-------|-------|
| Boards list | boards-grid skeleton | existing "no boards" EmptyState | board cards (staggered) | existing error/redirect |
| Board snapshot | columns+cards skeleton | per-column placeholder; board-level "no match" when filtered to zero | kanban board | existing "board not found" |
| Task dialog · checklist | line skeletons | existing "no checklist items" text | checklist rows | n/a |
| Task dialog · comments | line skeletons | existing "no comments" text | comment thread | n/a |

**Rule (FR-019)**: `loading` and `empty` are mutually exclusive and visually distinct — a resolved load with zero items shows `empty`, never the skeleton.

## Client-only contracts (no persistence)

### `stagger(index, opts?)` — pure helper
- **Input**: `index: number` (item position), optional `{ step?: number; cap?: number }`.
- **Output**: `number` (milliseconds of `animation-delay`).
- **Rules**: `delay = min(index * step, cap)`; default `step=40`, `cap=240`. Negative/NaN index → 0. Used as inline `animationDelay`. The global reduced-motion block makes the underlying animation instant regardless, so no special-casing is required in the helper, but callers may pass `0` when they detect reduced motion.

### `useExitTransition(open, durationMs)` — hook contract
- **Input**: `open: boolean`, `durationMs: number` (matches the CSS exit animation).
- **Output**: `{ mounted: boolean; closing: boolean }`.
- **State transitions**:
  - `open` false→true: `mounted=true`, `closing=false` (enter animation plays).
  - `open` true→false: `closing=true`, remains `mounted` for `durationMs`, then `mounted=false`.
  - `open` flips back to true mid-close: cancel pending unmount, `closing=false`, stay mounted (FR-011 — no stuck overlay).
  - Reduced motion: `durationMs` treated as ~0 so unmount is immediate.

### Skeleton primitive — prop contract
- `Skeleton({ className })` renders a token-colored block with the shimmer animation; `className` controls size/shape (height/width/rounded) so callers shape it to the content. No state.

## i18n keys (new)

Additive, AR + EN parity (enforced by the existing Vitest parity test). Expected additions:
- `board.filterEmpty.title`, `board.filterEmpty.desc` — board-level "no tasks match your filters" empty state.
- (Reuse existing `filter.empty`, `column.noTasks`, `boards.empty.*`, `board.empty.*`, `checklist.empty`, `comments.empty` where already present.)

## No schema / migration impact

Backend, database, Alembic, and API contracts are untouched. The `/speckit-tasks` output will contain no backend tasks.
