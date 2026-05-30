# Phase 1 Data Model: Responsive Mobile & Tablet Support

Presentation/layout-only. **No database change, no migration, no API, no new persistent
entity.** The only relevant "model" is the set of viewport size buckets the layout responds
to, and the transient open/closed state of the mobile navigation drawer.

## Viewport buckets (presentation states, not data)

| Band | Width | Layout intent |
|------|-------|---------------|
| Small phone | 320–374px | Single column; hamburger nav; tight spacing; ≥16px inputs |
| Standard phone | 375–424px | Single column; hamburger nav |
| Large phone | 425–767px | Single column (2-col where sensible); hamburger nav |
| Tablet portrait | 768–1023px | Sidebar visible; 2-column board grid |
| Tablet landscape | 1024–1279px | Comfortable; 2–3 column grids |
| Desktop | ≥1280px | **Unchanged** — identical to today |

These map to default Tailwind breakpoints (`md`=768 nav switch, `xl`=1280 desktop boundary).

## Client state (new, transient)

- **Mobile nav open/closed**: a boolean controlling the off-canvas drawer below `md`. Local
  component state (or the existing Zustand UI store). Not persisted, not server state. Resets
  closed on route change / link select / outside tap / Escape.

## Validation / behavior rules

- **VR-1**: At every supported width, the page MUST NOT scroll horizontally; the kanban
  board's own horizontal scroll stays contained to the board area.
- **VR-2**: Below `md` (768px), the sidebar rail is hidden and the hamburger + drawer is the
  navigation; at `md`+ the sidebar shows; at `xl`+ (≥1280) everything is exactly as today.
- **VR-3**: Mobile form inputs render at ≥16px to prevent iOS zoom-on-focus.
- **VR-4**: Hover-only visual effects apply only under `@media (hover: hover)`.

## Non-changes (explicit)

- No tables/columns/migrations; no backend model changes.
- No API shape changes; `lib/types.ts` unchanged.
- No Tailwind config change (default breakpoints already match the bands).
- No new runtime dependency.
