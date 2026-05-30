# Contract: Responsive Behavior

No REST/WS API. The "contract" is the responsive behavior the UI must honor at each width,
plus the mobile-navigation interaction. Keeping desktop unchanged is part of the contract.

## 1. Breakpoints (default Tailwind — no config change)

| Token | Min width | Role |
|-------|-----------|------|
| (base) | 0 | small phone |
| `sm` | 640px | — |
| `md` | 768px | **navigation switch** (hamburger below, sidebar at/above) |
| `lg` | 1024px | tablet-landscape tuning |
| `xl` | 1280px | **desktop boundary — nothing changes at/above this** |

Rules that must not affect desktop are scoped below `xl` (`max-xl:` / restored by `xl:`).

## 2. Layout

- No horizontal **page** scroll at any width ≥320px. The kanban board's own horizontal
  scroll is allowed and contained to the board's scroll container.
- Multi-column desktop layouts reflow to single column (or sensible 2-col) below `md`;
  board-card grids reflow 1→2→3 columns from phone→tablet→desktop via auto-fit/minmax or
  breakpoint column counts.
- Relative/fluid sizing (%, rem, vw, clamp/min/max) replaces fixed widths where they would
  otherwise overflow on small screens.
- Viewport meta declares `width=device-width, initial-scale=1`.

## 3. Navigation (below `md`)

- The sidebar rail is hidden; a visible, labeled **hamburger** button appears.
- Activating it opens an **off-canvas drawer** (smooth animation) containing the same
  destinations/controls as the sidebar (All boards, board list, user, theme, language,
  logout).
- The drawer closes on: selecting a destination, tapping/clicking the outside scrim, and
  pressing Escape.
- Accessibility: the trigger is a `<button>` with an `aria-label` and `aria-expanded`,
  keyboard-focusable and operable; focus moves into the drawer when open and is restored on
  close.
- At `md`+ the sidebar shows and no hamburger appears; at `xl`+ the sidebar is exactly as
  today.

## 4. Typography

- Fluid sizing via `clamp()` on high-impact headings (landing hero, board title); the
  established hierarchy is preserved.
- Body text never below a comfortable readable minimum on mobile; readable line-height.

## 5. Touch & interaction

- Primary interactive elements present a comfortable tap target (≈44×44px) on touch and a
  visible `:focus-visible` / `:active` state.
- Hover-only visual effects are wrapped in `@media (hover: hover)` so they don't misfire on
  touch; any hover-only affordance has a non-hover equivalent.

## 6. Forms

- Inputs/textareas render at ≥16px font on mobile (no iOS zoom-on-focus), are comfortably
  wide (full-width in mobile forms), and use the appropriate `type` for the native keyboard
  where applicable.

## 7. Media

- Images scale within their container (`max-width:100%`); below-the-fold images load lazily;
  embedded media preserves aspect ratio.

## 8. Motion / performance

- `prefers-reduced-motion` reduces/removes non-essential animation (existing block extended
  to cover any new transitions); heavy desktop-only motion does not run on mobile.

## 9. Invariants (regression contract)

- **Desktop ≥1280px is unchanged** — layout, spacing, visuals identical to before.
- All existing flows (auth, boards, columns, tasks, drag-and-drop, labels, members,
  real-time, presence, activity, themes, bilingual RTL/LTR) behave identically at every
  width.
- Both themes and both languages render correctly at every band; RTL mirrors the nav/drawer
  and reflowed layouts.
- The AR/EN dictionary-parity test stays green (any new aria-label strings added to both).
