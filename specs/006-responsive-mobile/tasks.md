---
description: "Task list for Responsive Mobile & Tablet Support"
---

# Tasks: Responsive Mobile & Tablet Support

**Input**: Design documents from `specs/006-responsive-mobile/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/responsive-contract.md

**Tests**: No new automated tests. Presentation/layout-only with **zero logic changes**.
Verification is the existing Vitest suite (incl. AR/EN dictionary-parity) + `tsc` + `eslint`
+ `build`, plus a manual responsive pass at 320/375/425/768/1024/1280px across Dark/Light ×
AR/EN (quickstart.md). The AR/EN parity test guards any new aria-label strings.

**Organization**: Tasks grouped by user story (US1–US4).

**Context — additive responsive layering.** Default Tailwind breakpoints already match the
spec bands (`md`=768 nav switch, `xl`=1280 desktop boundary) → **no tailwind.config change**.
Rules that must not affect desktop are scoped below `xl`. The one structural addition is a
mobile nav (hamburger + off-canvas drawer) reusing the existing `Sidebar` contents. No new
dependency, no backend, no logic changes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US4 (setup/foundational/polish carry no story label)

## Path Conventions

Frontend-only: source under `frontend/src/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the breakpoint baseline; no new deps.

- [x] T001 Confirm the responsive baseline: default Tailwind breakpoints in `frontend/tailwind.config.ts` (`md`=768, `xl`=1280) match the spec bands so no config change is needed; note current gaps (no viewport meta in `frontend/src/app/layout.tsx`, no hamburger, `text-sm` inputs, no `@media (hover: hover)`) — establishes the "additive, desktop-scoped below xl" baseline

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Viewport + the global responsive CSS layer every screen depends on.

**⚠️ CRITICAL**: Complete before the user-story phases.

- [x] T002 Add a mobile viewport to `frontend/src/app/layout.tsx` via `export const viewport = { width: "device-width", initialScale: 1 }` (App Router idiom) so devices render at device width with no forced zoom
- [x] T003 Add a responsive global layer to `frontend/src/app/globals.css`: a page-level horizontal-overflow guard that does NOT clip the kanban's own scroll container; wrap hover-only effects behind `@media (hover: hover)`; ensure a comfortable mobile base line-height; and extend the existing `prefers-reduced-motion` block to cover any new transitions

**Checkpoint**: The app renders at device width with no page-level horizontal scroll and
hover effects no longer misfire on touch — the stories can build on this.

---

## Phase 3: User Story 1 - Use the app on a phone without breakage (Priority: P1) 🎯 MVP

**Goal**: Every screen fits 320–767px: single-column reflow where appropriate, legible text,
no horizontal page scroll, nothing clipped/overlapping; core flows completable by touch.

**Independent Test**: At 320/375/425px open every screen → no horizontal page scroll, no
clipping, readable; complete log in → open board → open/edit task by touch.

### Implementation for User Story 1

- [x] T004 [P] [US1] Reflow the boards list to a single column on phones (grid columns adapt by width) and reduce page padding at small widths, in `frontend/src/app/(app)/boards/page.tsx`
- [x] T005 [P] [US1] Make the board view fit phones: header/breadcrumb + toolbar wrap and shrink padding at small widths; keep the kanban scroll contained to its own area, in `frontend/src/app/(app)/boards/[boardId]/page.tsx`
- [x] T006 [P] [US1] Reflow the landing page (hero + feature/CTA sections) to a single column with fluid `clamp()` heading sizes on phones, in `frontend/src/components/landing/landing-page.tsx`
- [x] T007 [P] [US1] Ensure dialogs fit small/short viewports — full-width with margins and scroll-within (no trapped content) — in `frontend/src/components/ui/dialog.tsx`; verify the two-column task dialog stacks on phones in `frontend/src/components/kanban/task-dialog.tsx`
- [x] T008 [US1] Keep the kanban board's horizontal scroll contained and comfortable on phones (column widths sensible, no page overflow) in `frontend/src/components/kanban/kanban-board.tsx` and `frontend/src/components/kanban/column.tsx`

**Checkpoint**: Phones render every screen with no horizontal page scroll and reflowed
content; core flows work by touch (US1; SC-001, SC-002).

---

## Phase 4: User Story 2 - Navigate via a mobile menu (Priority: P1)

**Goal**: Below 768px the sidebar rail is hidden and an accessible hamburger opens an
off-canvas drawer (same destinations/controls), closing on select/outside/Escape.

**Independent Test**: At <768px a labeled hamburger is visible; open (smooth) → navigate →
closes; reopen → outside tap closes; keyboard operable + screen-reader labeled.

### Implementation for User Story 2

- [x] T009 [US2] Extract the `Sidebar` inner content into a shared piece so the same nav (brand, All boards, board list, user/theme/language/logout) can render in both the desktop rail and the mobile drawer, and hide the rail below `md`, in `frontend/src/components/sidebar.tsx`
- [x] T010 [US2] Create `frontend/src/components/mobile-nav.tsx`: an accessible hamburger `<button>` (aria-label + aria-expanded, keyboard operable) that opens an off-canvas drawer (smooth animation) rendering the shared sidebar content; closes on link select, outside-scrim tap, and Escape; moves focus into the drawer and restores it on close; shown only below `md` and mirrored for RTL
- [x] T011 [US2] Mount the mobile nav in `frontend/src/app/(app)/layout.tsx` below `md` (hamburger in a slim top strip or floating trigger) while keeping the desktop sidebar flex layout at `md`+ and unchanged at `xl`+
- [x] T012 [P] [US2] Add the menu aria-label strings (e.g. `nav.openMenu`, `nav.closeMenu`) to BOTH `en` and `ar` in `frontend/src/lib/i18n/dictionaries.ts` (parity test must stay green)

**Checkpoint**: Mobile navigation works end-to-end and is accessible; desktop sidebar
unchanged at ≥1280px (US2; SC-004).

---

## Phase 5: User Story 3 - Comfortable, mobile-friendly tablets (Priority: P2)

**Goal**: 768–1279px use space sensibly (between phone single-column and desktop), with
multi-column grids and comfortable proportions, no page scroll.

**Independent Test**: At 768px → 2-column boards grid + sidebar visible; at 1024–1279px →
board/grids comfortably proportioned, no horizontal page scroll.

### Implementation for User Story 3

- [x] T013 [P] [US3] Tune the boards grid for tablet portrait (2 cols, 768–1023px) and tablet landscape (2–3 cols, 1024–1279px) via auto-fit/minmax or breakpoint column counts in `frontend/src/app/(app)/boards/page.tsx`
- [x] T014 [P] [US3] Verify/adjust board-card fluid sizing within the tablet grid in `frontend/src/components/boards/board-card.tsx`, and confirm the board view proportions at 1024–1279px in `frontend/src/app/(app)/boards/[boardId]/page.tsx`

**Checkpoint**: Tablets are comfortable in both orientations with no overflow (US3; SC-007).

---

## Phase 6: User Story 4 - Touch & input quality (Priority: P2)

**Goal**: Comfortable tap targets + visible pressed/focus states; no hover-only blockers; no
form zoom-on-focus; correct mobile keyboards; reduced motion respected.

**Independent Test**: On touch, controls are easy to tap with pressed/focus feedback and no
hover requirement; focusing a field doesn't zoom; reduced-motion removes non-essential anim.

### Implementation for User Story 4

- [x] T015 [US4] Bump form inputs/textarea to a ≥16px font on mobile (prevent iOS zoom) while keeping desktop sizing at `md`+, full-width on mobile, in `frontend/src/components/ui/input.tsx`
- [x] T016 [P] [US4] Ensure primary interactive elements meet a ~44×44px tap target on touch and have visible `:active` / `:focus-visible` states in `frontend/src/components/ui/button.tsx` (and the mobile-nav trigger/items)
- [x] T017 [P] [US4] Set appropriate input `type`s for native keyboards where applicable (e.g. email fields use `type="email"`) across the auth/forms screens (`frontend/src/app/(auth)/login/page.tsx`, `signup/page.tsx`, `forgot-password/page.tsx`) — verify, adjust only where missing

**Checkpoint**: Touch interaction and forms are mobile-quality; reduced-motion honored (US4;
SC-005, SC-006).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify the desktop-unchanged guarantee, run gates, manual multi-width pass, docs.

- [x] T018 Verify **desktop is unchanged** at ≥1280px: confirm responsive rules are scoped below `xl` and the layout/spacing/visuals at 1280px+ match pre-feature (no hamburger appears, sidebar exactly as before) across all screens (SC-003)
- [x] T019 Run the frontend gates: `npm run lint && npx tsc --noEmit && npm run test && npm run build`; fix any failures (AR/EN dictionary-parity test must pass)
- [ ] T020 Manual responsive pass per `quickstart.md` at 320/375/425/768/1024/1280px across Dark/Light × AR/EN: no horizontal page scroll (SC-001), phone usability (SC-002), hamburger nav (SC-004), tablets (SC-007), touch/forms/no-zoom (SC-005/006), RTL mirroring, no regressions (SC-008)
- [x] T021 [P] Update `README.md` (features table) to note full mobile/tablet responsiveness (hamburger nav, fluid layouts) with the desktop experience unchanged

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — baseline check.
- **Foundational (Phase 2)**: viewport + global CSS layer — blocks all stories (without the
  viewport meta nothing renders correctly on devices).
- **US1 (P1, MVP)**: after Foundational. Per-screen reflow + no-scroll.
- **US2 (P1)**: after Foundational; T011 (mount) depends on T009 (shared content) + T010
  (drawer). Can run alongside US1 (different files mostly).
- **US3 (P2)**: after Foundational; refines the boards grid/board proportions (builds on US1).
- **US4 (P2)**: after Foundational; touch/forms polish (independent files; can parallel US3).
- **Polish (Phase 7)**: after the stories; T018 desktop check + T019 gates + T020 manual.

### User Story Dependencies

- US1 → structural reflow (MVP).
- US2 → mobile nav; its mount depends on its own extract+drawer tasks.
- US3 → tablet tuning on top of US1's grid.
- US4 → touch/form quality; independent.

### Within Each Story

- Different files → parallel `[P]`. T011 after T009+T010. Files touched by multiple stories
  (boards page in US1+US3, board page in US1+US3) run sequentially in story order.

### Parallel Opportunities

- Phase 2: T002 (layout) ∥ T003 (globals.css) — different files.
- US1: T004 ∥ T005 ∥ T006 ∥ T007 (distinct files); T008 after (board/column pair).
- US2: T009 → T010 → T011; T012 (i18n) parallel.
- US3: T013 ∥ T014. US4: T015, T016 ∥ T017.

---

## Parallel Example: User Story 1 (independent screens)

```bash
Task: "Reflow boards list (boards/page.tsx)"            # T004
Task: "Fit board view header/toolbar (boards/[id])"     # T005
Task: "Reflow landing page + fluid headings"            # T006
Task: "Dialogs fit short viewports (ui/dialog.tsx)"     # T007
```

---

## Implementation Strategy

### MVP First (Foundational + US1 + US2)

1. Phase 1 (baseline) → Phase 2 (viewport + global layer).
2. US1 — every screen fits phones with no horizontal scroll. US2 — mobile nav.
3. **STOP & VALIDATE**: the app is genuinely usable on a phone (read, navigate, act) — the
   headline ask.

### Incremental Delivery

1. Setup + Foundational (viewport is the unlock).
2. US1 → phone usability (MVP, SC-001/002).
3. US2 → hamburger navigation (SC-004).
4. US3 → tablet comfort (SC-007).
5. US4 → touch/forms quality (SC-005/006).
6. Polish → desktop-unchanged check (SC-003), gates, manual pass (SC-008), README.

---

## Notes

- [P] = different files, no dependencies.
- **Additive + presentation-only**: no backend, no migration, **no new dependency**, no
  tailwind.config change, no logic changes. Desktop (≥1280px) untouched by scoping below `xl`.
- Mobile nav reuses the existing `Sidebar` contents (one source of truth) — Principle V.
- The kanban board keeps its own contained horizontal scroll; the page never scrolls sideways.
- Keep all frontend gates green (Principle II); commit after each phase or logical group.

## Implementation status

All tasks complete except **T020** (manual multi-width walkthrough), which was not run in
this headless session. Correctness is otherwise covered by the green gates (T019):
`tsc --noEmit`, `eslint`, 36 Vitest tests (incl. AR/EN dictionary parity), and a clean
`next build`. Desktop-unchanged (T018) is enforced structurally — every responsive rule is
scoped below `sm`/`md`/`xl` and the mobile nav is `md:hidden`, so the ≥1280px render path is
untouched. Notes on scope: several content screens (boards grid, landing, task-dialog
two-column) were **already responsive** via existing breakpoint prefixes; the substantive new
work was the viewport meta, the hamburger + off-canvas drawer (replacing the always-on rail),
16px mobile inputs, the global overflow/hover guards, and comfortable touch targets. The
visual/RTL/theme pass per `quickstart.md` remains for a manual check.
```
