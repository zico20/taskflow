# Quickstart: Board Members & Settings Management

**Feature**: `002-board-members-management` | **Date**: 2026-05-30

Build, run, and verify. No new dependencies; no DB migrations.

## Build order (high level)

1. **Backend** — add to `board_repo` (update role, remove member), `board_service`
   (with owner-protection rules + activity), and two routes in
   `app/api/routes/boards.py` (PATCH/DELETE `/members/{user_id}`). Add humanizer-side
   action types `member.role_changed`, `member.removed` (frontend dictionary).
2. **Backend tests** — extend `tests/test_permissions.py` / a new
   `tests/test_members.py`: role change, removal, owner protection, non-owner rejection.
3. **Frontend API + hooks** — `boardsApi.updateMemberRole`, `boardsApi.removeMember`;
   mutation hooks updating the board-detail cache.
4. **Frontend UI** — owner-only "Board settings" dialog (gear in board header) with
   Details (edit name/description/color) + Members (invite, list, change role, remove).
   All strings bilingual; logical RTL utilities.
5. **Frontend i18n** — add the new dictionary keys (en/ar) incl. the two activity
   templates; localize toasts/errors.

## Run

```bash
cd backend  && .venv/Scripts/uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev      # http://localhost:3000
```

> Don't run `npm run build` while `npm run dev` is running (they share `.next`).

## Verify (maps to Success Criteria)

Use two accounts (owner + teammate). Sign up the teammate first so the email resolves.

1. **SC-001 / FR-001..002 (invite)**: As owner, open Board settings → Members → invite
   the teammate's email as editor → they appear in the list; log in as the teammate and
   confirm edit access.
2. **SC-002 / FR-003..004 (messages)**: Invite the same email again → "already a
   member"; invite a random email → "no user found". Both clear, no silent failure.
3. **SC-003 / FR-006..007 (edit + live)**: With the teammate viewing the board, change
   the name/description/color and save → teammate sees the new name/color within ~2s,
   no reload; boards list shows the new name.
4. **SC-004 / FR-009 (role change)**: Demote the editor to viewer → as the teammate,
   confirm edit actions are now rejected.
5. **SC-005 / FR-010 (remove)**: Remove the teammate → they disappear from the list; as
   the teammate, the next board action is rejected (loses access).
6. **SC-006 / FR-011 (owner protection)**: Confirm the owner row has no remove/role
   controls; a direct API call to demote/remove the owner returns `owner_protected`.
7. **SC-007 / FR-012 (visibility)**: Log in as an editor/viewer → the gear / settings
   controls are not visible.
8. **Bilingual (FR-013)**: Toggle to Arabic → the whole settings dialog (incl. new
   activity sentences) is Arabic + RTL.

## Automated checks (must stay green — constitution Principle II)

```bash
cd backend  && .venv/Scripts/pytest --cov=app          # ≥70% coverage maintained
cd frontend && npm run typecheck && npm run lint && npm run test && npm run build
```

New backend tests cover: role change (editor↔viewer), removal, owner protection on
both endpoints, member_not_found, and non-owner rejection.

## Rollback

Additive feature. Reverting the branch removes the two endpoints and the settings
dialog; no migration to undo.
