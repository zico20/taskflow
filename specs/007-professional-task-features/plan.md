# Implementation Plan: Professional Task Features

**Branch**: `007-professional-task-features` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-professional-task-features/spec.md`

## Summary

Add four professional capabilities to tasks, all additive over the existing kanban board and without altering the ≥1280px desktop presentation:

1. **Subtasks / Checklist** — a new `checklist_items` entity owned by a task, with full CRUD + reorder + toggle, real-time broadcast, and a completed/total progress summary surfaced on the board card.
2. **Comments** — a new `comments` entity owned by a task, create + read + author/owner delete, real-time broadcast, author + timestamp display.
3. **Advanced Filtering & Sorting** — client-only view state (Zustand) layered over the existing board snapshot: conjunctive filters (label / priority / due-status / text) and per-column sort (manual / due / priority / created). Manual sort preserves existing drag-and-drop; non-manual sort disables persisting reorders.
4. **Due / Overdue badges** — extend the existing simple red-overdue text into explicit bilingual badges (Overdue / Due today / In N days) on the card.

Backend work follows the existing `route → service → repository → model` layering and the `record_and_broadcast()` real-time pattern. The two new entities get an Alembic migration. Frontend work extends the task dialog, the kanban card, and adds a board filter/sort toolbar, all using existing Liquid Glass tokens and the AR/EN dictionary (parity enforced by the existing Vitest test).

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript strict + Next.js 14 App Router (frontend)

**Primary Dependencies**: FastAPI, async SQLAlchemy 2.0, Pydantic v2, Alembic, slowapi (existing); TanStack Query, Zustand, dnd-kit, react-hook-form + zod, sonner, lucide-react, date-fns (existing). **No new runtime dependencies.**

**Storage**: PostgreSQL (prod/Docker) + SQLite/aiosqlite (dev/tests). Models stay DB-agnostic. Two new tables: `checklist_items`, `comments`.

**Testing**: pytest + pytest-asyncio against in-memory SQLite (fresh schema per test, existing `conftest.py` fixtures: `auth_client`, `client`, `db`). Vitest for frontend pure logic + i18n parity.

**Target Platform**: Linux server (backend), modern browsers (frontend), responsive 320px → desktop.

**Project Type**: Web application (separate `backend/` + `frontend/`).

**Performance Goals**: Real-time propagation ~1s (WS); filter/sort recompute < 1s on a 100-task board; no added horizontal overflow at any breakpoint.

**Constraints**: Desktop ≥1280px MUST NOT change visually except additive elements; backend coverage ≥70% (NON-NEGOTIABLE); REST = source of truth, WS notifies, self-echo ignored by actor id; error shape `{error, code, details?}`; AR/EN key parity.

**Scale/Scope**: Two new entities, ~6–8 new endpoints, ~4 new WS event types, ~5 new frontend components/sections, dictionary additions in AR + EN.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Compliance |
|-----------|------------|
| **I. Layered Architecture** | New `checklist_item` and `comment` get model → repository → service → route layers. No SQL outside repositories; routes only do validation/auth/status. Frontend: filter/sort = Zustand (UI state); checklist/comment data = TanStack Query (server state). ✅ |
| **II. Test Discipline (NON-NEGOTIABLE)** | New service/route code ships with pytest tests, including viewer-denied (403) and non-member (404) paths; coverage stays ≥70%. Frontend filter/sort ordering helper + due-status helper get Vitest tests; i18n parity test auto-covers new keys. ✅ |
| **III. Real-Time Consistency** | All mutations go through REST then `record_and_broadcast()`; new WS events (`checklist.*`, `comment.*`) follow the existing actor-id self-echo-ignore pattern. Reorder reconciles from server like task moves. ✅ |
| **IV. Security & Privacy** | Every new endpoint board-scoped: viewers read (200), viewers writing → 403, non-members → 404. Comment delete authorized to author or board owner. Error shape `{error, code, details?}`. No new secrets. ✅ |
| **V. Pragmatic Simplicity (YAGNI)** | No new runtime deps. Flat checklist (no nesting). No comment editing. Filtering/sorting client-side over existing snapshot (no new server query params) — server-side filtering deferred to the later performance feature with an in-code note if needed. ✅ |

**Result**: PASS — no violations; Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/007-professional-task-features/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (REST + WS contracts)
│   ├── checklist.md
│   ├── comments.md
│   └── websocket-events.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── models/
│   │   ├── checklist_item.py     # NEW — ChecklistItem model
│   │   ├── comment.py            # NEW — Comment model
│   │   └── task.py               # (relationships added: checklist_items, comments)
│   ├── schemas/
│   │   ├── checklist.py          # NEW — ChecklistItemCreate/Update/Public + reorder
│   │   ├── comment.py            # NEW — CommentCreate/Public
│   │   └── task.py               # (TaskPublic gains checklist summary)
│   ├── repositories/
│   │   ├── checklist_repo.py     # NEW
│   │   └── comment_repo.py       # NEW
│   ├── services/
│   │   ├── checklist_service.py  # NEW — business logic + broadcast
│   │   ├── comment_service.py    # NEW — business logic + broadcast
│   │   └── realtime.py           # (reused as-is)
│   └── api/routes/
│       ├── checklist.py          # NEW — /boards/{board_id}/tasks/{task_id}/checklist...
│       └── comments.py           # NEW — /boards/{board_id}/tasks/{task_id}/comments...
├── alembic/versions/
│   └── <new>_add_checklist_and_comments.py   # NEW migration
└── tests/
    ├── test_checklist.py         # NEW
    └── test_comments.py          # NEW

frontend/
├── src/
│   ├── components/kanban/
│   │   ├── task-dialog.tsx           # extended: checklist section + comments thread
│   │   ├── task-card.tsx             # extended: progress badge + due-status badge
│   │   ├── checklist-section.tsx     # NEW
│   │   ├── comments-thread.tsx       # NEW
│   │   ├── board-filter-bar.tsx      # NEW — filter + sort controls
│   │   └── kanban-board.tsx          # extended: apply filter/sort view state
│   ├── hooks/
│   │   ├── use-checklist.ts          # NEW — TanStack Query hooks
│   │   ├── use-comments.ts           # NEW
│   │   └── use-board-socket.ts       # extended: handle checklist.*/comment.* events
│   ├── stores/
│   │   └── board-view-store.ts       # NEW — Zustand filter/sort view state (per board)
│   ├── lib/
│   │   ├── types.ts                  # ChecklistItem, Comment, due-status types
│   │   ├── endpoints.ts              # checklistApi, commentsApi
│   │   ├── due-status.ts             # NEW — pure helper (overdue/today/upcoming)
│   │   ├── task-filter-sort.ts       # NEW — pure filter+sort helpers
│   │   └── i18n/dictionaries.ts      # AR/EN keys added
│   └── ...
└── (vitest tests colocated under src/lib/__tests__ or *.test.ts)
```

**Structure Decision**: Existing web-app split (`backend/` + `frontend/`). Each new entity is added as a full vertical slice (model → repo → service → route → schema → test) mirroring the existing `labels` feature. Frontend cleanly separates new server-state hooks (TanStack Query) from new UI-only view state (Zustand), per Principle I.

## Complexity Tracking

No constitution violations — section intentionally empty.
