# Implementation Plan: Board Members & Settings Management

**Branch**: `002-board-members-management` | **Date**: 2026-05-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-board-members-management/spec.md`

## Summary

Let board owners manage collaboration from the UI: invite members by email with a
role (editor/viewer), edit board details (name/description/color), change member
roles, and remove members — with owner protection enforced server-side and changes
propagating live to active viewers. The backend already supports invite and board
edit; this feature adds two new owner-guarded endpoints (change role, remove member)
plus an owner-only "Board settings" dialog on the frontend. **No new dependencies; no
database migrations.**

## Technical Context

**Language/Version**: Backend Python 3.11 (FastAPI, async SQLAlchemy 2.0, Pydantic v2);
Frontend TypeScript (strict), React 18.3, Next.js 14.2 (App Router).

**Primary Dependencies**: Existing only — FastAPI, SQLAlchemy, Pydantic, slowapi
(backend); Tailwind, TanStack Query, Zustand, React Hook Form + Zod, the in-repo i18n
module (frontend).

**Storage**: Existing PostgreSQL/SQLite schema (`boards`, `board_members`). No new
tables, no migrations.

**Testing**: pytest (backend, isolated in-memory DB); Vitest (frontend) + manual /
Playwright two-account verification.

**Target Platform**: Web (SSR via Next.js App Router; FastAPI backend).

**Project Type**: Web application — changes in both `backend/` and `frontend/`.

**Performance Goals**: Invite/role/remove take effect immediately; board edits appear
to other active viewers within ~2s via the existing real-time channel.

**Constraints**: Owner protection enforced server-side (not just hidden in UI); reuse
existing roles/real-time/i18n; consistent error shape `{ error, code, details? }`;
bilingual + RTL for all new UI.

**Scale/Scope**: 2 new backend endpoints + service/repo helpers + tests; 1 frontend
settings dialog (details + members) + API/hooks + dictionary keys.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Layered Architecture & Separation of Concerns | ✅ Pass | New logic flows route → service → repository; owner-protection rules live in the service, not the route. Frontend keeps board/member data in TanStack Query (server state), UI state local. |
| II. Test Discipline (NON-NEGOTIABLE) | ✅ Pass | New pytest cases for role change, removal, owner protection, member_not_found, non-owner rejection; backend coverage stays ≥70%. Frontend gates (tsc/eslint/vitest/build) stay green. |
| III. Real-Time Consistency & Optimistic UX | ✅ Pass | REST remains source of truth; member/board changes broadcast over the existing WS channel (`board.updated`, new `member.*` activity). |
| IV. Security & Privacy by Default | ✅ Pass | Both new endpoints owner-guarded; owner protection server-authoritative (`owner_protected`); standard error shape; non-members still get 404 (existence hidden). |
| V. Pragmatic Simplicity (YAGNI) | ✅ Pass | Reuses existing endpoints/roles/dialogs/i18n; adds only the two genuinely missing endpoints. Force-disconnect of removed sockets deferred as a TODO, not built. |

**Result**: PASS — no violations; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/002-board-members-management/
├── plan.md            # This file
├── spec.md            # Feature spec
├── research.md        # Phase 0 — decisions (endpoints, owner protection, UI panel)
├── data-model.md      # Phase 1 — entities (reused schema, no migration)
├── quickstart.md      # Phase 1 — build/run/verify (two-account)
├── contracts/
│   └── members-api.md  # Phase 1 — REST + frontend module + WS contract
└── tasks.md           # Phase 2 — created by /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── repositories/board_repo.py   # EDIT — add update_member_role, remove_member, get_member
│   ├── services/board_service.py    # EDIT — change_member_role, remove_member (owner-protection rules)
│   └── api/routes/boards.py         # EDIT — PATCH/DELETE /{board_id}/members/{user_id}
│   └── services/realtime.py         # EDIT (humanizer not needed server-side; activity action types only)
└── tests/
    └── test_members.py              # NEW — role change, removal, owner protection, rejection

frontend/
└── src/
    ├── lib/endpoints.ts             # EDIT — updateMemberRole, removeMember
    ├── hooks/use-boards.ts          # EDIT — useUpdateBoard, useInviteMember, useUpdateMemberRole, useRemoveMember
    ├── components/boards/
    │   ├── board-settings-dialog.tsx   # NEW — owner-only: Details + Members sections
    │   └── (board-card.tsx / board header) # EDIT — gear entry point (owner only)
    ├── app/(app)/boards/[boardId]/page.tsx # EDIT — settings gear in header
    └── lib/i18n/{dictionaries.ts,humanize-activity.ts} # EDIT — new keys + member.role_changed/removed templates
```

**Structure Decision**: Full-stack change extending existing patterns. Backend adds two
owner-guarded member endpoints and the service/repo helpers behind them; frontend adds
one owner-only settings dialog plus the API/hooks and bilingual strings. No new
top-level modules.

## Complexity Tracking

> No constitution violations — section intentionally empty.
