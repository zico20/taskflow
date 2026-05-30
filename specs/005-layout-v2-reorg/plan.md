# Implementation Plan: Layout v2 — Navigation & Layout Reorganization

**Branch**: `005-layout-v2-reorg` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-layout-v2-reorg/spec.md`

## Summary

Adopt the "Layout v2" reorganization prepared in `NewDesign1/` as the project's live
layout. Same features, data, actions, and Liquid Glass styling — only **placement**
changes: a persistent **sidebar** replaces the top bar; the activity feed becomes a
slide-over **drawer**; the boards page is **grouped by role**; the board view gets a
breadcrumb header + toolbar over a full-width kanban; the task dialog becomes
**two-column**; board settings uses a **side tab rail**.

This is a **layout/presentation-only** change. Verified against the current frontend:
all logic/data files (hooks, `lib/*`, types, stores, i18n logic) are byte-identical;
i18n changes are **additive only** (5 keys); **no new dependencies**. The work is a
**deterministic file sync** from `NewDesign1/` into `frontend/src/` — 9 restyled files,
2 new files (`sidebar.tsx`, `kanban/activity-drawer.tsx`) — plus **deleting the old
`app-shell.tsx`** (top bar). Verified by the existing test suite + typecheck + build +
a manual nav/RTL/theme pass.

## Technical Context

**Language/Version**: Frontend only — TypeScript (strict), React 18.3, Next.js 14.2
(App Router), Tailwind CSS. No backend work.

**Primary Dependencies**: Existing only — Tailwind, TanStack Query, Zustand, sonner,
lucide-react, react-hook-form, zod, date-fns, the in-repo i18n module. **No new
dependencies** (the two new files import only `lucide-react`, `next/link`,
`next/navigation`, all already present).

**Storage**: N/A. No data change. The only client state involved is the existing
`activityPanelOpen` UI-store flag (now drives the drawer) and the existing
`localStorage` theme preference — both unchanged.

**Testing**: Vitest (existing suite, incl. the AR/EN dictionary-parity test) +
`tsc --noEmit` + `eslint` + `next build` + a manual pass (sidebar nav, board grouping,
drawer, two-column dialog, settings rail) across Dark/Light × AR/EN.

**Target Platform**: Web (Next.js App Router frontend).

**Project Type**: Web application — **frontend-only** change.

**Performance Goals**: Navigation via the sidebar is one click; the activity drawer
opens/closes via the existing toggle; no added network or compute (layout-only).

**Constraints**: Zero functional regressions across every existing flow; full bilingual
AR/EN + RTL preserved (sidebar mirrors to the right in Arabic) with no lost strings;
both themes render correctly; sidebar collapses to an icon rail on narrow viewports.
The Tailwind config is unchanged from `004`.

**Scale/Scope**: 9 restyled files (4 `app/` routes incl. `(app)/layout.tsx`, 3
components, `globals.css`, `dictionaries.ts`), 2 new files (`sidebar.tsx`,
`kanban/activity-drawer.tsx`), and 1 deletion (`app-shell.tsx`). All other files
unchanged.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Layered Architecture & Separation of Concerns | ✅ Pass | Purely presentational/layout. Server state stays in TanStack Query; the drawer reuses the existing `activityPanelOpen` Zustand UI flag (UI state, correctly separated). No backend layering touched. |
| II. Test Discipline (NON-NEGOTIABLE) | ✅ Pass | No backend change (coverage unaffected). Frontend gates (`tsc`/`eslint`/`vitest`/`build`) must stay green; the AR/EN dictionary-parity test guards the i18n additions. No logic changed → no new logic tests required; verified by build + manual pass. |
| III. Real-Time Consistency & Optimistic UX | ✅ Pass | `use-board-socket.ts` and all hooks byte-identical; real-time/presence/activity behavior unchanged — only where the activity feed renders (drawer) changes. |
| IV. Security & Privacy by Default | ✅ Pass | No auth/data/API changes. Role-based grouping on the boards page is purely visual, using the role already returned per board; no new authorization surface. |
| V. Pragmatic Simplicity (YAGNI) | ✅ Pass | Adopts the prepared layout as-is; reuses existing tokens/components/UI-store flags; removes the now-unused top bar rather than leaving dead code. No speculative abstractions. |

**Result**: PASS — no violations; Complexity Tracking not required.

### Constitution alignment notes

- The activity **drawer** is driven by the **same** `activityPanelOpen` UI-store flag the
  current inline panel uses — no new state model, consistent with Principle I/V.
- Removing `app-shell.tsx` (the top bar) is required because it is replaced by `Sidebar`;
  leaving it would be dead code (Principle V). Only `app/(app)/layout.tsx` imports it
  today, and the new layout imports `Sidebar` instead — no dangling references.

## Project Structure

### Documentation (this feature)

```text
specs/005-layout-v2-reorg/
├── plan.md             # This file
├── spec.md             # Feature spec
├── research.md         # Phase 0 — integration strategy & decisions
├── data-model.md       # Phase 1 — (no data entities; UI-state note)
├── quickstart.md       # Phase 1 — build/run/verify (sidebar, grouping, drawer, dialogs)
├── contracts/
│   └── ui-contract.md  # Phase 1 — layout/nav contract + i18n additions
├── checklists/
│   └── requirements.md # Spec quality checklist (from /speckit-specify)
└── tasks.md            # Phase 2 — created by /speckit-tasks
```

### Source Code (repository root)

Sync from `NewDesign1/` into `frontend/src/`. Files grouped by action:

```text
frontend/src/
├── app/
│   ├── globals.css                       # EDIT (restyle) <- adds --sidebar-w layout token
│   ├── (app)/layout.tsx                  # REPLACE <- aurora → flex: <Sidebar/> + <main>; imports Sidebar (not TopBar)
│   ├── (app)/boards/page.tsx             # REPLACE <- context header + role-grouped sections
│   ├── (app)/boards/[boardId]/page.tsx   # REPLACE <- breadcrumb header + toolbar + full-width kanban + activity drawer
│   └── demo/page.tsx                     # REPLACE (restyle)
├── components/
│   ├── sidebar.tsx                       # NEW  <- persistent nav rail (brand, All boards, board list, user/theme/lang/logout)
│   ├── kanban/activity-drawer.tsx        # NEW  <- slide-over activity (driven by activityPanelOpen UI flag)
│   ├── app-shell.tsx                     # DELETE <- old top bar, replaced by Sidebar
│   ├── boards/board-settings-dialog.tsx  # REPLACE <- side tab rail (Details/Members)
│   ├── kanban/task-dialog.tsx            # REPLACE <- two-column (content ǀ properties)
│   └── landing/landing-page.tsx          # REPLACE (restyle)
└── lib/i18n/dictionaries.ts              # EDIT <- add nav.allBoards, nav.boards, boards.group.owned/editor/viewer (en + ar); no removals

# UNCHANGED (verified byte-identical, do NOT touch):
#   all hooks/*, lib/{api,types,endpoints,board-logic,utils,demo-data}, stores/*,
#   lib/i18n/* (except dictionaries), all tests, tailwind.config.ts,
#   components/{backdrop,theme-switcher,language-switcher,providers}.tsx,
#   components/ui/*, components/kanban/{column,task-card,presence-bar,activity-feed,
#   add-column-dialog,kanban-board,manage-labels-dialog}.tsx,
#   components/boards/{board-card,create-board-dialog}.tsx,
#   app/layout.tsx, app/(auth)/**, app/page.tsx
```

After integration, **`NewDesign1/` is removed** (staging area; content now in `frontend/`).

**Structure Decision**: Frontend-only adoption via a file sync, identical in approach to
the `004` adoption. Because `NewDesign1/` was authored against the current codebase
(identical aliases/props/logic, additive i18n only), copy the 11 differing/new files
verbatim into `frontend/src/`, delete the superseded `app-shell.tsx`, then prove no
regression with the existing tests + typecheck + build + a manual nav/RTL/theme pass. No
new modules; no backend.

## Complexity Tracking

> No constitution violations — section intentionally empty.
