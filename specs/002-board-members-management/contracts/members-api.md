# Contract: Board Members & Settings API

**Feature**: `002-board-members-management` | **Date**: 2026-05-30

Existing endpoints are reused as-is. **Two new endpoints** are added. All responses
use the standard error shape `{ "error": string, "code": string, "details"?: object }`.
All member-management routes are **owner-guarded**.

## Existing (reused — no change)

### Invite a member
`POST /api/boards/{board_id}/members` — owner only
- Body: `{ "email": string, "role": "editor" | "viewer" }`
- 201 → `BoardMemberPublic` `{ user: UserPublic, role }`
- 404 `user_not_found` (no account for email) · 409 `already_member` ·
  403 `invalid_role` (owner not assignable) · 403 `insufficient_role` (non-owner)

### Edit board details
`PATCH /api/boards/{board_id}` — editor+ (owner in this feature's UI)
- Body: `{ "name"?: string, "description"?: string, "color"?: string }` (name non-empty)
- 200 → `BoardSummary` · broadcasts `board.updated`

### Get board (member list)
`GET /api/boards/{board_id}` — member only
- 200 → `BoardDetail` including `members: [{ user, role }]`

## New endpoints

### Change a member's role
`PATCH /api/boards/{board_id}/members/{user_id}` — owner only

- Body: `{ "role": "editor" | "viewer" }`
- 200 → `BoardMemberPublic` (updated)
- Errors:
  - 403 `owner_protected` — target is the board owner (cannot change owner role)
  - 403 `invalid_role` — attempting to set role to `owner`
  - 404 `member_not_found` — user is not a member of this board
  - 403 `insufficient_role` — caller is not the owner
- Side effect: broadcasts activity `member.role_changed` with
  `{ member_name, role }`.

### Remove a member
`DELETE /api/boards/{board_id}/members/{user_id}` — owner only

- 204 No Content
- Errors:
  - 403 `owner_protected` — cannot remove the board owner (incl. self)
  - 404 `member_not_found` — user is not a member of this board
  - 403 `insufficient_role` — caller is not the owner
- Side effect: broadcasts activity `member.removed` with `{ member_name }`. The
  removed member's subsequent board requests are rejected by the existing role guard.

## Frontend module additions (internal contract)

`frontend/src/lib/endpoints.ts` — `boardsApi`:

```ts
updateMemberRole: (boardId: number, userId: number, role: "editor" | "viewer")
  => Promise<BoardMemberPublic>   // PATCH .../members/{userId}
removeMember: (boardId: number, userId: number)
  => Promise<void>                // DELETE .../members/{userId}
// existing: update(id, {name?,description?,color?}), addMember(id, email, role)
```

Hooks (TanStack Query) update the `useBoardDetail` members cache on success and
invalidate the boards list where membership/details affect it.

## WebSocket events (existing channel)

| type | data | consumer behavior |
|------|------|-------------------|
| `board.updated` (existing) | `{ id, name, color }` | update header + boards list live |
| activity `member.role_changed` (new) | activity entry | append to feed; refresh member list |
| activity `member.removed` (new) | activity entry | append to feed; refresh member list |

## Acceptance mapping

- FR-001..FR-005 → invite endpoint (existing) + UI.
- FR-006, FR-007 → PATCH board + `board.updated` broadcast.
- FR-008 → GET board members.
- FR-009 → PATCH member role (new).
- FR-010 → DELETE member (new).
- FR-011 → `owner_protected` guard on both new endpoints.
- FR-012 → owner-only guards + UI hiding.
