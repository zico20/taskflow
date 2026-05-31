# Contract: UI States & Components (frontend)

This feature exposes no network interface. Its "contracts" are the component APIs and the observable UI behaviors that the implementation and its verification depend on.

## Component: `Skeleton` (new)

```tsx
<Skeleton className="h-4 w-32 rounded" />
```
- Renders a placeholder block. `className` sets shape/size. Animated shimmer by default; **static** under `prefers-reduced-motion: reduce`. Uses existing tokens (no new colors). Legible under `prefers-reduced-transparency`.

## Composition skeletons (new)

- `BoardCardSkeleton` / boards-grid skeleton — same `grid-cols`/gap as the real boards grid; N card-shaped blocks.
- `BoardSnapshotSkeleton` — same column width (`w-72`) and spacing as the real board; each column shows a header block + a few task-card-shaped blocks.
- `ThreadSkeleton` — line-shaped blocks for the checklist and comments sections inside the task dialog.

**Behavioral contract**: each skeleton occupies the same footprint as the content it precedes → swapping to real content causes no visible layout shift (SC-002).

## Component: `Button` (extended)

```tsx
<Button loading={mutation.isPending}>Save changes</Button>
```
- New optional `loading?: boolean`. When `true`: shows the in-button `Spinner` before the label, and the button is disabled (combined with any existing `disabled`). Label text is preserved (no width collapse). All existing variants/sizes, focus ring, and `active:translate-y-px` press feedback are unchanged.
- **Contract**: every targeted mutating-action button uses `loading`; no call site renders its own `{pending && <Spinner/>}` anymore (SC-004).

## Hook: `useExitTransition(open, durationMs)` (new)

Returns `{ mounted, closing }`. Drives mount-with-exit-animation for the dialog and the two drawers. See data-model.md for the state-transition contract. Components render only when `mounted`, and apply an exit class while `closing`.

## Behavior: animations

- **Dialog**: animates in (existing `scale-in`) AND out (new `scale-out`/`fade-out`) on close.
- **Activity drawer & mobile nav**: animate in AND out (slide/fade).
- **Lists (activity feed, boards grid)**: items enter with a brief stagger (`stagger(index)` → `animationDelay`).
- **All**: instant (no motion) under `prefers-reduced-motion: reduce`. Interruption-safe (FR-011).

## Behavior: empty states

- **Board-level**: when filters/search are active and zero tasks match across all columns, the board area renders `EmptyState` with the `filter.empty` / `board.filterEmpty.*` text instead of empty columns.
- **Per-column**: a column with zero tasks renders a tidy placeholder (existing `column.noTasks`) rather than blank space.
- **Distinct from loading**: a resolved-but-empty state never shows a skeleton (FR-019).

## Non-goals (explicit)

- No route/page transition animations.
- No new motion library.
- No change to the settled desktop (≥1280px) appearance of existing elements.
- No backend/API/data changes.
