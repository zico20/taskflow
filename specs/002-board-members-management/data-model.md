# Data Model: Board Members & Settings Management

**Feature**: `002-board-members-management` | **Date**: 2026-05-30

This feature reuses the **existing** schema — there are **no new tables and no
migrations**. It exposes and manages data that already exists (`board_members`,
`boards`). The model below documents the entities and the rules this feature enforces.

## Entities (existing — no schema change)

### BoardMember (existing `board_members` table)

| Field | Type | Notes |
|-------|------|-------|
| id | int PK | membership id (internal) |
| board_id | int FK → boards | the board |
| user_id | int FK → users | the member |
| role | enum | `owner` \| `editor` \| `viewer` |

**Rules enforced by this feature**:
- Unique `(board_id, user_id)` — no duplicate memberships (already constrained).
- Exactly one `owner` per board; the owner row is **protected**: its role cannot be
  changed and it cannot be removed.
- `role` may be set to `editor` or `viewer` only via invite/role-change; `owner` is
  never assignable through these actions.

### Board (existing `boards` table) — editable fields

| Field | Type | Editable | Validation |
|-------|------|----------|------------|
| name | string | yes | required, non-empty, ≤120 chars |
| description | string \| null | yes | optional, ≤2000 chars |
| color | string | yes | a theme color value |

## Operations (this feature)

| Operation | Actor | Effect | Guard |
|-----------|-------|--------|-------|
| Invite member | owner | create `board_members` row (editor/viewer) | owner-only; reject unknown email, duplicate, owner role |
| Edit board details | owner | update name/description/color | owner-only (server); name required |
| Change member role | owner | update `board_members.role` (editor↔viewer) | owner-only; reject owner row, reject `owner` target |
| Remove member | owner | delete `board_members` row | owner-only; reject owner row |
| List members | any member | read members + roles | member-only (existing `GET /boards/{id}`) |

## State / access transitions

```text
non-member ──invite(editor)──> editor ──change role──> viewer
                                  │                        │
                                  └────── remove ──────────┴──> non-member (no access)

owner ── (protected: cannot be demoted or removed) ── owner
```

- A member demoted editor→viewer loses edit ability immediately (enforced by the
  role guard on the next request).
- A removed member loses all access immediately (role guard returns 404/403 on next
  request).

## Activity events (existing log, new action types)

Recorded via the existing activity/broadcast mechanism; sentences are localized on the
frontend:

| action_type | payload | humanized (en example) |
|-------------|---------|------------------------|
| member.added (existing) | `{ member_name }` | "X added {member}" |
| member.role_changed (new) | `{ member_name, role }` | "X changed {member}'s role to {role}" |
| member.removed (new) | `{ member_name }` | "X removed {member}" |
| board.updated (existing) | `{ name }` | "X updated board '{name}'" |

## Out of scope (no changes)

- New tables/migrations, ownership transfer, multiple owners.
- Inviting users who have no account (outbound email).
- Force-disconnecting a removed member's live socket (next-action rejection only).
