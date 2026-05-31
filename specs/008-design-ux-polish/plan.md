# Implementation Plan: Design & UX Polish

**Branch**: `008-design-ux-polish` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-design-ux-polish/spec.md`

## Summary

Frontend-only polish in four additive slices, none of which change the settled desktop (≥1280px) view and all of which respect `prefers-reduced-motion`:

1. **Skeleton loaders** — a reusable `Skeleton` primitive + content-shaped skeletons for the boards grid, the board snapshot (columns + task cards), and the task dialog (checklist + comments). Replaces the current `Spinner`/`FullPageSpinner` on those surfaces; sized to match real content (no CLS).
2. **Animations & transitions** — add exit (close) transitions to the dialog and the two drawers (activity, mobile nav) via a small mount/unmount-with-delay pattern, plus a CSS-only staggered entrance for the activity feed and boards grid. New `slide-out`/`fade-out` keyframes alongside the existing `fade-in`/`scale-in`.
3. **Micro-interactions** — a `loading` prop on the shared `Button` (built-in spinner + disabled), replacing the ~13 hand-rolled `{pending && <Spinner/>}` patterns; a subtle success cue; consistent hover/press already largely present, normalized where inconsistent.
4. **Empty states** — render the already-existing `filter.empty` board-level empty state when filters/search match nothing, and a tidy per-column placeholder for empty columns.

Everything reuses the existing Liquid Glass tokens, the existing `prefers-reduced-motion`/`prefers-reduced-transparency` global blocks, the existing `EmptyState`, and the existing toast system. **No new runtime dependencies.**

## Technical Context

**Language/Version**: TypeScript (strict) + Next.js 14 App Router (frontend only)

**Primary Dependencies**: Tailwind CSS, existing CSS-variable token system, lucide-react, sonner, TanStack Query, dnd-kit (all already present). **No new deps** — animations via Tailwind keyframes + CSS; skeletons via CSS.

**Storage**: N/A (no data, no backend, no migrations)

**Testing**: Vitest for any new pure logic (e.g. a stagger-delay helper) + the existing AR/EN dictionary parity test (auto-covers new keys). No component tests exist in the project; not introducing a new test framework (YAGNI).

**Target Platform**: Modern browsers, responsive 320px → desktop.

**Project Type**: Web application (frontend slice only this feature).

**Performance Goals**: No added layout shift (CLS ~0 on skeleton→content swap); animations short (~150–300ms) and GPU-friendly (opacity/transform only).

**Constraints**: Desktop ≥1280px **settled** state visually unchanged; additive-only; all motion gated by `prefers-reduced-motion`; legible under `prefers-reduced-transparency`; AR/EN parity; tsc/eslint/build clean.

**Scale/Scope**: 1 new `Skeleton` primitive + ~3–4 skeleton compositions, ~2 new keyframes + an exit-transition hook, a `loading` Button prop applied at ~13 call sites, 2 empty-state renders, a few new dictionary keys.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance |
|-----------|------------|
| **I. Layered Architecture** | Frontend-only. No backend layers touched. UI state stays local/React; no server-state misuse. Pure helpers (stagger delay) isolated in `lib/`. ✅ |
| **II. Test Discipline (NON-NEGOTIABLE)** | Backend untouched → backend coverage unaffected (stays ≥70%). New pure logic gets Vitest; i18n parity test covers new keys. No bug-fix regressions needed (greenfield polish). ✅ |
| **III. Real-Time Consistency** | No data flow changes; real-time path untouched. Skeletons/animations are pure presentation over existing TanStack Query loading states. ✅ |
| **IV. Security & Privacy** | No auth, roles, endpoints, or error-shape changes. ✅ |
| **V. Pragmatic Simplicity (YAGNI)** | No new runtime deps (no framer-motion); reuse existing keyframes/tokens/EmptyState/toast. Exit animations via a tiny CSS-class-toggle pattern, not a library. ✅ |

**Result**: PASS — no violations; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/008-design-ux-polish/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A entities — documents UI states)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (UI contracts, not REST)
│   └── ui-states.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/ui/
│   │   ├── skeleton.tsx              # NEW — base Skeleton primitive (shimmer, reduced-motion safe)
│   │   ├── button.tsx               # extended: `loading` prop (built-in spinner + disabled)
│   │   └── dialog.tsx               # extended: exit (close) animation
│   ├── components/skeletons/        # NEW — content-shaped skeleton compositions
│   │   ├── board-card-skeleton.tsx
│   │   ├── board-snapshot-skeleton.tsx
│   │   └── thread-skeleton.tsx      # checklist + comments line skeletons
│   ├── components/kanban/
│   │   ├── activity-drawer.tsx      # extended: exit animation
│   │   ├── activity-feed.tsx        # extended: staggered entrance
│   │   ├── kanban-board.tsx         # board-level "no matching tasks" empty state
│   │   ├── column.tsx               # per-column empty placeholder
│   │   ├── checklist-section.tsx    # skeleton while loading; Button loading prop
│   │   └── comments-thread.tsx      # skeleton while loading; Button loading prop
│   ├── components/
│   │   ├── mobile-nav.tsx           # extended: exit animation
│   │   └── boards/board-card.tsx    # stagger entrance (index-based delay)
│   ├── hooks/
│   │   └── use-exit-transition.ts   # NEW — mount/animate-out/unmount helper (reduced-motion aware)
│   ├── lib/
│   │   ├── stagger.ts               # NEW — pure: index → delay (capped), reduced-motion → 0
│   │   └── i18n/dictionaries.ts     # new AR/EN keys (e.g. board.filterEmpty.title/desc)
│   ├── app/(app)/boards/page.tsx              # boards grid skeleton on load
│   ├── app/(app)/boards/[boardId]/page.tsx    # board snapshot skeleton on load
│   ├── app/globals.css              # new keyframes (skeleton shimmer, fade-out/slide-out); reduced-motion already global
│   └── tailwind.config.ts           # register new animations
└── (vitest tests colocated under src/lib/__tests__)
```

**Structure Decision**: Existing frontend structure. A single `Skeleton` primitive composes into content-shaped skeletons (avoids duplication). Exit animations use one small reusable hook (`use-exit-transition`) so dialog + both drawers share one tested pattern rather than three ad-hoc timers. The `Button` `loading` prop centralizes the pattern currently copy-pasted in ~13 places. All keyframes live in the existing globals.css / tailwind.config, governed by the already-present `prefers-reduced-motion` block.

## Complexity Tracking

No constitution violations — section intentionally empty.
