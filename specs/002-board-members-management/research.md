# Research: Board Members & Settings Management

**Feature**: `002-board-members-management` | **Date**: 2026-05-30
**Inputs**: [spec.md](./spec.md), [constitution](../../.specify/memory/constitution.md)

This feature extends existing, well-established patterns in the codebase. No new
runtime dependencies. All Technical-Context unknowns are resolved below.

## What already exists (grounding)

**Backend**
- `POST /api/boards/{id}/members` (invite by email + role) — exists, owner-guarded,
  broadcasts `member.added`. Handles unknown-email (404 `user_not_found`),
  duplicate (409 `already_member`), and rejects assigning `owner`.
- `PATCH /api/boards/{id}` (edit name/description/color) — exists, editor-guarded,
  broadcasts `board.updated`.
- `GET /api/boards/{id}` returns `BoardDetail` including `members` (user + role).
- Role guards: `require_board_owner` / `require_board_editor` dependencies.
- Repo helpers: `board_repo.add_member`, `get_user_role`, `get_with_members`.

**Frontend**
- `boardsApi.update(id, data)` and `boardsApi.addMember(id, email, role)` exist.
- `useBoardDetail(boardId)` query already fetches members.
- Existing dialog/confirm primitives, i18n (`useT`), role badges.

## What is missing (must be built)

**Backend** — two new endpoints + service/repo helpers:
- Update a member's role (editor↔viewer).
- Remove a member.

**Frontend** — a board settings/members panel and the wiring:
- Open settings (owner only); edit board details; invite; list members; change role;
  remove member; all bilingual.

## Decision 1 — New backend endpoints (REST shape)

**Decision**: Add two owner-guarded routes under the existing members router:
- `PATCH /api/boards/{board_id}/members/{user_id}` — body `{ role: "editor"|"viewer" }`
  → returns updated `BoardMemberPublic`. Broadcasts `member.role_changed`.
- `DELETE /api/boards/{board_id}/members/{user_id}` — 204. Broadcasts `member.removed`.

**Rationale**: Mirrors the existing REST grouping (`/boards/{id}/members`) and the
column/task patterns (PATCH for update, DELETE for remove). Keys the member by
`user_id` (stable, already on `BoardMemberPublic.user.id`). Owner-guard via the
existing `require_board_owner` dependency — consistent with `add_member`.

**Alternatives**: keying by membership id (extra lookup, not exposed to the client) —
rejected; a single "manage members" RPC endpoint — rejected (non-RESTful, harder to
guard/test).

## Decision 2 — Owner protection (server-authoritative)

**Decision**: Enforce in the service layer: refuse to change the owner's role or
remove the owner; refuse to set any role to `owner` (already enforced for invite).
Return a clear domain error (`ForbiddenError`, code `owner_protected`). The frontend
also hides these controls, but the server is authoritative (constitution Principle IV).

**Rationale**: UI hiding is convenience; the rule must hold even against direct API
calls. Reuses the existing `AppError` shape `{ error, code, details? }`.

## Decision 3 — Real-time propagation

**Decision**: Broadcast member changes over the existing WebSocket channel via
`record_and_broadcast`, adding activity action types `member.role_changed` and
`member.removed` (the humanizer already covers `member.added`). Board edits already
broadcast `board.updated`; the frontend will subscribe so the board header/list and
member panel update live.

**Rationale**: Reuses the in-place real-time mechanism (constitution Principle III —
REST is source of truth, WS notifies). Activity entries also give a useful audit
trail. New humanizer keys are added on the frontend (bilingual) — no backend i18n.

**Gotcha**: A removed member who is currently connected should stop receiving board
data. v1 relies on their next REST/WS action being rejected by the role guard (the
spec's SC-005 is about access loss on next action, which the guards already enforce);
forcibly closing their socket is a future enhancement, noted as a TODO.

## Decision 4 — Frontend: board settings panel

**Decision**: A single owner-only "Board settings" dialog opened from the board
header (gear icon), with two sections: **Details** (name/description/color form,
reusing the create-board form fields) and **Members** (invite form + member list with
per-row role select and remove button). Non-owners do not see the gear.

**Rationale**: One discoverable entry point keeps the surface small (YAGNI). Reuses
existing dialog, form (RHF+Zod), color picker, and role-badge components. Consistent
with the create-board dialog already in the app.

**Alternatives**: a separate `/boards/{id}/settings` route — rejected (heavier, the
board is a single live view; a dialog keeps context and live updates simple).

## Decision 5 — Frontend data + cache

**Decision**: Add `boardsApi.updateMemberRole` and `boardsApi.removeMember`; add
mutation hooks that, on success, update the `useBoardDetail` cache (members) and the
boards-list cache where relevant, and invalidate as needed. Board-details edit reuses
the existing `boardsApi.update` and updates both the board-detail and snapshot/header.

**Rationale**: Follows the existing TanStack Query patterns (optimistic where safe,
invalidate on membership changes which are infrequent). Server stays the source of
truth (Principle I — server state in Query, not Zustand).

## Decision 6 — Bilingual + RTL

**Decision**: All new strings go into the existing `en`/`ar` dictionaries with typed
keys; the panel inherits direction from `<html>` and uses logical Tailwind utilities,
consistent with feature 001.

**Rationale**: The app is now fully bilingual; new UI must match (Principle from the
prior feature; spec FR-013).

## Net dependency impact

- **New runtime dependencies: none** (backend and frontend both extend existing libs).
- New activity action types: `member.role_changed`, `member.removed` (strings only).
