# Implementation Plan: Colored Labels Management

**Branch**: `003-labels-management` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-labels-management/spec.md`

## Summary

Let board members manage colored labels entirely from the UI: create a label
(name + color), delete a label, and apply/remove labels on tasks — with changes
propagating live to other viewers.

**Key finding from codebase research**: labels are already *partially* built. The
backend has the `Label`/`TaskLabel` models, repository, schemas, and
editor-guarded `GET/POST/DELETE /boards/{id}/labels` routes; tasks already accept
`label_ids` and render chips. What is **missing** is exactly the user-facing slice
this feature asks for: there is **no UI to create or delete labels** (the create
hook exists but is unused; no delete hook exists at all), **label changes are not
broadcast** over WebSocket (so they don't appear live), and **duplicate names hit
the DB constraint as a 500** instead of a friendly message. This plan completes
that thin slice. **No new model, no new table, no database migration, no new
dependencies.**

## Technical Context

**Language/Version**: Backend Python 3.11 (FastAPI, async SQLAlchemy 2.0, Pydantic
v2); Frontend TypeScript (strict), React 18.3, Next.js 14.2 (App Router).

**Primary Dependencies**: Existing only — FastAPI, SQLAlchemy, Pydantic (backend);
Tailwind, TanStack Query, React Hook Form + Zod, sonner, the in-repo i18n module
(frontend). No additions.

**Storage**: Existing PostgreSQL/SQLite schema (`labels`, `task_labels` tables
already present). No new tables, no migration. The `labels` table already enforces
`UniqueConstraint(board_id, name)`.

**Testing**: pytest (backend, isolated in-memory SQLite per `conftest.py`); Vitest
(frontend) + manual two-account verification for live updates.

**Target Platform**: Web (Next.js App Router frontend; FastAPI backend).

**Project Type**: Web application — changes in both `backend/` and `frontend/`.

**Performance Goals**: Create/delete/apply take effect immediately for the actor;
changes appear to other active viewers within ~2s via the existing WebSocket
channel.

**Constraints**: Edit-access guard enforced server-side (reuse
`require_board_editor`); duplicate names rejected with the standard error shape
`{ error, code, details? }` (`ConflictError`, `code="label_name_taken"`); delete
cascades to `task_labels` via the existing FK `ondelete="CASCADE"`; bilingual +
RTL for all new UI; case-insensitive name uniqueness.

**Scale/Scope**: Backend — new thin `label_service` (duplicate guard + broadcast),
case-insensitive existence check in `label_repo`, two routes rewired through the
service, ~5 new `label.*` realtime + WS-type additions, tests. Frontend — one new
label-management dialog, a delete hook + apply/remove already covered by task
update, WS handling for `label.*`, an entry point button, and bilingual strings.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Layered Architecture & Separation of Concerns | ✅ Pass | Introduces a `label_service` so business rules (duplicate-name check, broadcast) live in the service, not the route — bringing labels in line with tasks/boards (today the route calls the repo directly). Repo keeps all queries. Frontend keeps label data in TanStack Query (server state); dialog form state is local. |
| II. Test Discipline (NON-NEGOTIABLE) | ✅ Pass | New pytest cases: create label, duplicate-name 409 (case-insensitive), delete cascades chips off tasks, non-editor (viewer) rejected, label-not-found on delete. Backend coverage stays ≥70%. Frontend gates (tsc/eslint/vitest/build) stay green. |
| III. Real-Time Consistency & Optimistic UX | ✅ Pass | REST stays source of truth; new `label.created` / `label.deleted` events broadcast over the existing WS channel and the client ignores its own echo (actor-id match), consistent with task/column events. Deleting a label invalidates the task snapshot so chips disappear live. |
| IV. Security & Privacy by Default | ✅ Pass | Create/delete guarded by `require_board_editor`; list by `require_board_viewer`. Cross-board access blocked (label's `board_id` re-checked on delete). Standard error shape preserved; no internals leaked on the duplicate path. |
| V. Pragmatic Simplicity (YAGNI) | ✅ Pass | Reuses the existing model/table/schema/routes/hooks; adds only the genuinely missing UI + broadcast + duplicate guard. Label **rename/recolor** is deliberately out of scope (spec assumption), so the existing `LabelUpdate` schema is left unused rather than wired speculatively. |

**Result**: PASS — no violations; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/003-labels-management/
├── plan.md             # This file
├── spec.md             # Feature spec
├── research.md         # Phase 0 — decisions (what exists, what's missing, how to close the gap)
├── data-model.md       # Phase 1 — entities (reused schema, no migration)
├── quickstart.md       # Phase 1 — build/run/verify (two-account live check)
├── contracts/
│   └── labels-api.md   # Phase 1 — REST + frontend module + WS contract
├── checklists/
│   └── requirements.md # Spec quality checklist (from /speckit-specify)
└── tasks.md            # Phase 2 — created by /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── repositories/label_repo.py     # EDIT — add get_by_name_ci (case-insensitive existence check)
│   ├── services/label_service.py      # NEW — create_label (duplicate guard + broadcast), delete_label (broadcast)
│   ├── services/realtime.py           # EDIT — add label.* verbs to human_action
│   └── api/routes/labels.py           # EDIT — route create/delete through label_service; pass current user for broadcast
└── tests/
    └── test_labels.py                 # NEW — create, duplicate (409, case-insensitive), delete-cascade, viewer-forbidden, not-found

frontend/
└── src/
    ├── lib/endpoints.ts               # (labelsApi.list/create/remove already exist — no change expected)
    ├── lib/types.ts                   # EDIT — add WsMessage variants: label.created / label.deleted
    ├── hooks/use-board.ts             # EDIT — add useDeleteLabel; keep useCreateLabel (currently unused → now wired)
    ├── hooks/use-board-socket.ts      # EDIT — handle label.created / label.deleted (invalidate labels + snapshot)
    ├── components/kanban/
    │   ├── manage-labels-dialog.tsx   # NEW — create (name + color palette) & delete (with confirm) labels for the board
    │   └── kanban-board.tsx (or board header) # EDIT — "Manage labels" entry point (editor only)
    ├── components/kanban/task-dialog.tsx # EDIT — show an empty-state + link to manage labels when none exist
    └── lib/i18n/dictionaries.ts       # EDIT — new label.* keys in en + ar
```

**Structure Decision**: Full-stack change that *completes* an existing, half-built
feature rather than introducing a new domain. Backend adds a thin service to host
the duplicate-name rule and the realtime broadcast (aligning labels with the
route → service → repository layering the constitution requires), plus a
case-insensitive existence helper in the repo. Frontend adds one
label-management dialog and the delete hook, wires the already-present create hook,
and handles the new WS events. No new top-level modules, no migration.

## Complexity Tracking

> No constitution violations — section intentionally empty.
