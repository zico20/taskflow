# Phase 0 Research: Responsive Mobile & Tablet Support

Grounded in a read of the current frontend. Findings and the decisions that resolve the
spec's requirements into a concrete, low-risk approach.

## Current state (verified)

- **No viewport meta**: `app/layout.tsx` declares no `viewport` — mobile browsers will not
  render at device width. This is the single biggest cause of "broken on mobile."
- **Tailwind breakpoints** (default, unchanged): `sm`=640, `md`=768, `lg`=1024, `xl`=1280,
  `2xl`=1536. These already match the spec's bands — **no config change needed**. `md` is the
  nav-switch boundary (768) and `xl` is the desktop-untouched boundary (1280).
- **Sidebar** (`components/sidebar.tsx`): an always-present `aside` at `w-[var(--sidebar-w)]`
  that collapses to a `max-lg:w-[72px]` icon rail — it never hides, so on a 320px phone a
  72px rail consumes ~22% of the width and the nav labels are gone. There is **no hamburger**.
- **App layout** (`(app)/layout.tsx`): `flex h-screen overflow-hidden` with `Sidebar` +
  `main`. Good base; needs the sidebar to become an off-canvas drawer below `md`.
- **Inputs** (`ui/input.tsx`): `text-sm` (14px) → **iOS zoom-on-focus risk**; needs ≥16px on
  mobile.
- **Reduced motion**: already handled globally in `globals.css` (good); extend, don't replace.
- **Hover**: no `@media (hover: hover)` guard → hover styles can stick on touch.
- **Kanban** (`kanban-board.tsx`/`column.tsx`): `w-72` columns inside `overflow-x-auto` — the
  board's horizontal scroll is **intended** and contained; the page itself must not scroll.
- **Body**: no `overflow-x` guard.

## Decisions

### D1 — Desktop-untouched is enforced by breakpoint scoping (≥1280 / `xl`)
- **Decision**: Write responsive rules to apply only below `xl`. Use `max-xl:`/`max-md:`
  variants (and `md:`/`xl:` to restore desktop values) so the ≥1280px render path is
  identical to today.
- **Rationale**: The spec's hard rule is "do not modify desktop." Scoping below `xl` makes
  that structural rather than a matter of testing diligence.
- **Alternatives considered**: Mobile-first rewrite (unprefixed = mobile, `xl:` = desktop) —
  rejected: higher risk of inadvertently changing desktop; the codebase is desktop-first
  today, so additive `max-*` scoping is safer and smaller.

### D2 — Mobile nav: hamburger + off-canvas drawer reusing Sidebar contents
- **Decision**: Below `md` (768px), hide the sidebar rail and show an accessible hamburger
  that opens an off-canvas drawer containing the **same** navigation (extract `Sidebar`'s
  inner content into a shared piece used by both the desktop rail and the mobile drawer).
  The drawer: smooth open/close, closes on link select, on outside tap (scrim), and on
  Escape; the trigger is a real `<button>` with `aria-label`/`aria-expanded`, keyboard
  operable; focus moves into the drawer and is restored on close.
- **Rationale**: Satisfies FR-007/FR-008 with one source of truth for nav (Principle V).
  Reuses existing primitives — no UI library.
- **Alternatives considered**: Keep the 72px icon rail on phones — rejected (wastes width,
  loses labels, fails the "single readable column" intent). A new nav model — rejected (the
  spec says surface the existing destinations).

### D3 — No new dependency; nav state is local UI state
- **Decision**: Build the drawer with React state (or the existing Zustand UI store) + CSS
  transitions; no `headlessui`/`radix`/etc. added.
- **Rationale**: YAGNI (Principle V); the interaction is simple and the project already has
  dialog/drawer patterns (the activity drawer) to mirror.
- **Alternatives considered**: Add a headless menu lib — rejected (new dependency for a
  single component).

### D4 — Viewport meta via Next.js `viewport` export
- **Decision**: Add `export const viewport` (width=device-width, initial-scale=1) in
  `app/layout.tsx` (the App Router idiom).
- **Rationale**: Required (FR-005); the App Router prefers the typed `viewport` export over a
  hand-written `<meta>`.
- **Alternatives considered**: Raw `<meta>` in `<head>` — works but is not the App Router
  convention.

### D5 — Fluid type + 16px mobile inputs, within the existing hierarchy
- **Decision**: Apply `clamp()`-based fluid sizing to a few high-impact headings (landing
  hero, board title) and ensure a comfortable mobile base line-height; bump inputs/textareas
  to ≥16px below `md` (e.g. `text-base max-md:` while keeping desktop `text-sm` at `md:`+).
  Keep the established type hierarchy.
- **Rationale**: FR-006/FR-012 (legibility + no iOS zoom) without redesigning the type scale.
- **Alternatives considered**: Global fluid type on everything — rejected (risk of shifting
  desktop hierarchy; do it surgically on the elements that need it).

### D6 — Global responsive CSS layer (overflow guard, hover guard, touch states)
- **Decision**: In `globals.css`: add a page-level `overflow-x` guard (without breaking the
  kanban's contained scroll), wrap hover-only effects in `@media (hover: hover)`, ensure
  `:focus-visible`/`:active` feedback on interactive elements, and confirm min 44×44 tap
  targets on primary controls (mostly via padding/size utilities). Extend the existing
  reduced-motion block to cover any new animations.
- **Rationale**: FR-003/FR-010/FR-013 in one place where it's global, component classes where
  it's local.
- **Alternatives considered**: `overflow-x: hidden` on `body` globally — used cautiously; the
  guard must not clip the kanban's own scroll container, so it's applied at the page wrapper
  level, not by hiding overflow on a scroll ancestor of the board.

### D7 — Boards grid reflows via auto-fit/minmax; tablets get 2–3 columns
- **Decision**: The role-grouped board sections use a grid that reflows from 1 column (phone)
  to 2 (tablet portrait) to 3 (tablet landscape/desktop) using `auto-fit`/`minmax` or
  breakpoint column counts; cards size fluidly.
- **Rationale**: FR-004 + US3 tablet comfort without per-width hand-tuning.

### D8 — Verification: gates + manual multi-width pass (+ optional Playwright shots)
- **Decision**: Rely on `tsc`/`eslint`/`vitest`/`build` + a manual pass at 320/375/425/768/
  1024/1280 across Dark/Light × AR/EN; optionally capture Playwright screenshots at those
  widths. Explicitly confirm desktop (≥1280) is unchanged (SC-003).
- **Rationale**: No logic changed; the risk is visual/layout, best caught by real widths.

## Risk review

- **Desktop regression** — mitigated by scoping rules below `xl` and an explicit desktop
  diff/check.
- **No new dependency / no logic change** — keeps blast radius to CSS + one component.
- **i18n** — if the hamburger needs new aria-label strings, add them to both `en`/`ar`; the
  parity test enforces sync.
- **Kanban scroll** — the page-level overflow guard must not wrap the board's own scroll
  container; applied at the right level.

## Open questions

None. The spec's bands map to default Tailwind breakpoints and the desktop boundary is fixed
at 1280px; the approach is fully determined.
