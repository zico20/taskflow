# Phase 0 Research: Design & UX Polish

All technical context was resolved by auditing the existing frontend; no open `NEEDS CLARIFICATION`. Decisions below are grounded in what already exists.

## Decision 1: CSS-only skeletons (no library)

- **Decision**: Build a base `Skeleton` primitive as a `div` with the existing token background (`bg-bg-muted`) and a shimmer via a new Tailwind keyframe (`skeleton-shimmer`, a moving gradient). Reduced-motion → static block (no shimmer). Compose content-shaped skeletons from it.
- **Rationale**: Principle V (YAGNI) — no runtime dep needed. The existing global `prefers-reduced-motion` block already neutralizes `animation`, so a static fallback is automatic; we add `motion-reduce:` for clarity/legibility.
- **Alternatives considered**: `react-loading-skeleton` — rejected (new dep for ~30 lines of CSS).

## Decision 2: Skeleton must match content footprint (no CLS)

- **Decision**: Each skeleton composition mirrors the real component's box dimensions/spacing — boards grid uses the same `grid-cols`/gap; board snapshot uses the same column width (`w-72`) and card paddings; checklist/comments use line heights matching the rows. Render the skeleton in the exact container the content will occupy.
- **Rationale**: FR-004/SC-002 require negligible layout shift. Matching the footprint is the mechanism.
- **Alternatives considered**: Generic full-page spinner overlay (current) — rejected; it causes a visible jump when content pops in.

## Decision 3: Exit animations via a small reusable hook

- **Decision**: Add `use-exit-transition.ts`: given `open`, it returns `{ mounted, closing }`. On `open=false` it sets `closing=true`, keeps the element mounted for the animation duration, then unmounts. Components apply an `animate-fade-in`/`animate-scale-in` on enter and a new `fade-out`/`scale-out`/`slide-out` class while `closing`. Under reduced motion the delay is 0 (instant unmount).
- **Rationale**: Dialog + activity drawer + mobile nav all currently unmount instantly. One tested hook beats three ad-hoc `setTimeout`s (FR-007/008/011). Interruption handled by keying off the latest `open` value (FR-011).
- **Alternatives considered**: framer-motion `AnimatePresence` — rejected (new dep, Principle V). React Transition Group — rejected (new dep for a 30-line hook).

## Decision 4: Staggered entrance is CSS-only, index-driven

- **Decision**: A pure `stagger(index)` helper returns an `animationDelay` (e.g. `index * 40ms`, capped at ~240ms so long lists don't lag). Applied as inline style on each list item that already has `animate-fade-in` (activity feed, boards grid). Reduced-motion → delay 0 (and the global block already kills the animation).
- **Rationale**: FR-009 wants subtle stagger; doing it with the existing `fade-in` + a delay is the smallest change. Pure helper is unit-testable (Principle II).
- **Alternatives considered**: JS-orchestrated sequential reveal — rejected (heavier, needs effects/timers).

## Decision 5: `loading` prop on the shared Button

- **Decision**: Extend `components/ui/button.tsx` with `loading?: boolean`. When true: render the existing `Spinner` before children, set `disabled` (combined with existing `disabled` prop), and keep the label (so width doesn't collapse). Replace the ~13 `disabled={pending}>{pending && <Spinner/>}` call sites with `loading={pending}`.
- **Rationale**: FR-012/013 — one consistent indicator + placement everywhere, removing copy-paste drift. `Button` already has `active:translate-y-px` press feedback and focus rings to keep.
- **Alternatives considered**: Leave per-call-site spinners — rejected; that's the inconsistency we're removing.

## Decision 6: Success cue via existing toast (subtle), no new surface

- **Decision**: The "brief success cue" is satisfied by the existing `sonner` success toasts already fired on mutations (e.g. `toast.success(t("task.updated"))`). Where a success path currently fires no toast, add a subtle one using existing keys. Optionally a tiny inline check on the button is out of scope unless trivial. No new component required.
- **Rationale**: FR-014 wants subtle + non-blocking; toasts already are. Principle V — reuse.
- **Alternatives considered**: Custom inline success animation everywhere — rejected as over-engineering for v1.

## Decision 7: Empty states reuse `EmptyState` + existing keys

- **Decision**: Board-level "no matching tasks": when `applyView` yields zero tasks across all columns AND a filter/search is active, render `EmptyState` (icon + `filter.empty` text) instead of the columns. Per-column empty: `column.tsx` already shows a "No tasks" line; keep/tidy it and ensure it shows for filtered-empty columns too. Add `filter.empty.desc` if a description is wanted (the title key `filter.empty` already exists).
- **Rationale**: FR-017/018/019 — reuse the existing component and the already-present key; only wire the render path.
- **Alternatives considered**: A brand-new empty component — rejected (EmptyState exists and is on-brand).

## Decision 8: Reduced-motion & reduced-transparency are already global

- **Decision**: Rely on the existing `globals.css` blocks: `@media (prefers-reduced-motion: reduce)` neutralizes all animation/transition durations; `@media (prefers-reduced-transparency: reduce)` swaps glass to solid. New keyframes/skeletons inherit this automatically; add explicit `motion-reduce:` utilities where a static fallback needs to stay legible (e.g. skeleton shows a flat block).
- **Rationale**: FR-005/010/016 — leverage existing handling instead of re-implementing.
- **Alternatives considered**: Per-component `matchMedia` JS checks — rejected (the CSS already covers it; the hook only needs a reduced-motion check for unmount timing).

## Decision 9: Desktop settled-state parity

- **Decision**: All additions are either (a) transient (loading/opening/closing), (b) interaction-only (hover/press/success), or (c) in previously-blank areas (empty columns). The idle ≥1280px layout's existing elements get no new classes that alter their resting appearance.
- **Rationale**: FR-021/SC-008 — the desktop production look must not change at rest.
- **Alternatives considered**: None — this is a hard constraint, verified by before/after spot check.
