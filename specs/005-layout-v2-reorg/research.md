# Phase 0 Research: Layout v2 — Navigation & Layout Reorganization

The reorganization is prepared in `NewDesign1/` (a workspace-level mirror of
`frontend/src/`, the "Layout v2" pass). A full file-by-file comparison against the
current `frontend/` was performed; results and decisions below.

## File delta (verified by diff)

### NEW — no counterpart in `frontend/src/` (2)
- `components/sidebar.tsx` — persistent navigation rail: brand, "All boards", the user's
  boards quick-switch list (color + task count), and bottom controls (user, theme,
  language, log out). Collapses to a 72px icon rail under `lg`. Imports only
  `lucide-react`, `next/link`, `next/navigation`.
- `components/kanban/activity-drawer.tsx` — slide-over activity panel, driven by the
  existing `activityPanelOpen` UI-store flag.

### DIFFERENT — restructured existing file (9)
- `app/globals.css` (adds the `--sidebar-w` layout token).
- `app/(app)/layout.tsx` (aurora → flex: `<Sidebar/>` + `<main>`; imports `Sidebar`
  instead of the old top bar).
- `app/(app)/boards/page.tsx` (context header + role-grouped sections).
- `app/(app)/boards/[boardId]/page.tsx` (breadcrumb header + toolbar + full-width kanban
  + activity drawer).
- `app/demo/page.tsx` (restyle).
- `components/boards/board-settings-dialog.tsx` (side tab rail).
- `components/kanban/task-dialog.tsx` (two-column).
- `components/landing/landing-page.tsx` (restyle).
- `lib/i18n/dictionaries.ts` (+5 keys, additive).

### DELETE — superseded (1)
- `components/app-shell.tsx` — the old sticky top bar; replaced by `Sidebar`. Only
  `app/(app)/layout.tsx` imports it today, and the new layout imports `Sidebar` instead.

### IDENTICAL — do not touch (verified byte-identical)
All `hooks/*`; `lib/{api,types,endpoints,board-logic,utils,demo-data}`; `stores/*`;
`lib/i18n/*` except `dictionaries.ts`; all tests; `tailwind.config.ts`; and the unchanged
components (`backdrop`, `theme-switcher`, `language-switcher`, `providers`, all `ui/*`,
`kanban/{column,task-card,presence-bar,activity-feed,add-column-dialog,kanban-board,
manage-labels-dialog}`, `boards/{board-card,create-board-dialog}`), plus `app/layout.tsx`,
`app/(auth)/**`, `app/page.tsx`.

## Decisions

### D1 — Adopt by file sync + one deletion
- **Decision**: Copy the 11 differing/new files verbatim from `NewDesign1/` into the
  matching `frontend/src/` paths, then delete `frontend/src/components/app-shell.tsx`.
- **Rationale**: The package was authored against this exact codebase (identical
  `@/…` aliases, identical props/logic, additive i18n). A verbatim sync is lower-risk
  than hand-patching; the gates + typecheck + build catch any mismatch, including a
  dangling import if app-shell were referenced anywhere it shouldn't be.
- **Alternatives considered**: Hand-apply each diff — rejected (more error-prone, no
  benefit). Keep `app-shell.tsx` "just in case" — rejected (dead code, Principle V).

### D2 — Activity drawer reuses the existing UI-store flag
- **Decision**: The new `activity-drawer.tsx` is toggled by the same `activityPanelOpen`
  flag in `stores/ui-store.ts` that the current inline panel uses (verified the store is
  unchanged). No new state.
- **Rationale**: The activity feed is moving location, not behavior. Reusing the flag
  keeps the toggle, persistence, and keyboard behavior identical (Principle I/V).
- **Alternatives considered**: A separate drawer-open state — rejected (duplicate state
  for the same concept).

### D3 — Role grouping uses the existing per-board role
- **Decision**: The boards page groups by the `role` already present on each board
  summary (owner / editor / viewer) into owned / shared-can-edit / shared-view-only
  sections; empty groups are omitted. This is pure client-side presentation over data
  already fetched.
- **Rationale**: No new endpoint or field — `lib/types.ts`/`endpoints.ts` are identical,
  and the boards query already returns the role. Grouping is a render concern.
- **Alternatives considered**: A new "grouped boards" API — rejected (YAGNI; the data is
  already there).

### D4 — Remove `NewDesign1/` after integration
- **Decision**: Once synced and gates pass, delete the `NewDesign1/` staging folder so
  `frontend/` is the single source of truth (same as the `004` adoption).
- **Rationale**: Avoids a confusing duplicate tree / second `globals.css`.
- **Alternatives considered**: Keep for reference — rejected (the spec + git history
  preserve provenance; a stale mirror invites drift).

### D5 — Verification (no new logic tests)
- **Decision**: Rely on the existing Vitest suite (incl. AR/EN parity), `tsc`, `eslint`,
  `next build`, plus a manual pass (sidebar nav + collapse, role grouping, drawer,
  two-column dialog, settings rail) across Dark/Light × AR/EN.
- **Rationale**: No logic changed (Principle II); the risk is layout/build, covered by
  build + parity test + manual pass. Render tests for pure layout would be low-value.
- **Alternatives considered**: Visual-regression snapshots — rejected for v1 as
  disproportionate to a one-time adoption.

## Risk review

- **No new dependencies** — the two new files import only already-present packages.
- **No logic regression** — logic/data/test files byte-identical; behavior preserved by
  construction.
- **Dangling reference risk** — only `app/(app)/layout.tsx` imports `app-shell`, and its
  replacement imports `Sidebar`; `tsc`/`build` will fail loudly if any reference remains.
- **i18n parity** — additive keys only in both `en`/`ar`; the parity test enforces sync.
- **State continuity** — the drawer reuses `activityPanelOpen`, so the activity toggle
  keeps working unchanged.

## Open questions

None. The user's intent ("changed positions only — nothing added or removed") matches the
verified delta; scope is fully bounded.
