---
description: "Task list for Board Members & Settings Management"
---

# Tasks: Board Members & Settings Management

**Input**: Design documents from `specs/002-board-members-management/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/members-api.md

**Tests**: Included. Constitution Principle II requires backend tests for new
services/routes (≥70% coverage) and Vitest for critical frontend logic. Test tasks
precede their implementation within each story.

**Organization**: Tasks are grouped by user story (US1–US3) for independent
implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US3 (setup/foundational/polish carry no story label)

## Path Conventions

Full-stack web app: `backend/app/...`, `backend/tests/...`, `frontend/src/...`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing pieces this feature builds on; no new deps/migrations.

- [x] T001 Verify existing endpoints/helpers are present and unchanged: `POST /boards/{id}/members` and `PATCH /boards/{id}` in `backend/app/api/routes/boards.py`, and `board_repo.get_user_role`/`add_member`/`get_with_members` in `backend/app/repositories/board_repo.py` (no code change — establishes the baseline the new work extends)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared schemas and dictionary keys that the user stories depend on.

**⚠️ CRITICAL**: Complete before the user-story phases.

- [x] T002 [P] Add request schema(s) for member role update — `MemberRoleUpdate { role: BoardRole }` (reject `owner`) — in `backend/app/schemas/board.py`
- [x] T003 [P] Add the new bilingual dictionary keys (en + ar) for the settings dialog, member management, invite/role/remove toasts and errors, and the two activity templates `activity.member.role_changed` / `activity.member.removed`, in `frontend/src/lib/i18n/dictionaries.ts`
- [x] T004 [P] Extend `humanizeActivity` to handle `member.role_changed` and `member.removed` action types in `frontend/src/lib/i18n/humanize-activity.ts`

**Checkpoint**: Schemas + strings exist — user stories can begin.

---

## Phase 3: User Story 1 - Invite a member by email (Priority: P1) 🎯 MVP

**Goal**: An owner can invite a registered user by email with an editor/viewer role
from a Board settings dialog, with clear messages for duplicate/unknown email.

**Independent Test**: As owner, open settings → invite an existing user as editor →
they appear in the member list and can open the board with edit access.

### Tests for User Story 1

- [x] T005 [P] [US1] Backend test: invite succeeds (editor/viewer), duplicate → 409 `already_member`, unknown email → 404 `user_not_found`, owner role rejected, non-owner → 403, in `backend/tests/test_members.py` (these exercise the EXISTING invite endpoint — lock its behavior before building UI on it)

### Implementation for User Story 1

- [x] T006 [P] [US1] Add `boardsApi.addMember` typing/return as `BoardMemberPublic` if needed and confirm signature in `frontend/src/lib/endpoints.ts`
- [x] T007 [P] [US1] Add `useInviteMember(boardId)` mutation hook (updates the `useBoardDetail` members cache on success) in `frontend/src/hooks/use-boards.ts`
- [x] T008 [US1] Create the owner-only `BoardSettingsDialog` shell with a Members section containing the invite form (email + role select) and the member list, in `frontend/src/components/boards/board-settings-dialog.tsx`
- [x] T009 [US1] Add the settings gear entry point in the board header (owner only) that opens `BoardSettingsDialog`, in `frontend/src/app/(app)/boards/[boardId]/page.tsx`
- [x] T010 [US1] Wire invite submit → `useInviteMember`; show localized success and the specific duplicate/unknown-email error messages via toasts in `frontend/src/components/boards/board-settings-dialog.tsx`

**Checkpoint**: Owner can invite a member end-to-end with clear messaging (SC-001, SC-002).

---

## Phase 4: User Story 2 - Edit board details (Priority: P1)

**Goal**: An owner can edit name/description/color from the settings dialog; changes
show everywhere and propagate live to other viewers.

**Independent Test**: As owner, change name/description/color, save → board header +
boards list update; a second viewer sees the change live.

### Tests for User Story 2

- [x] T011 [P] [US2] Backend test: `PATCH /boards/{id}` updates fields, rejects empty name, requires editor+, broadcasts `board.updated`, in `backend/tests/test_members.py` (covers the EXISTING edit endpoint)

### Implementation for User Story 2

- [x] T012 [P] [US2] Add `useUpdateBoard(boardId)` mutation hook updating board-detail + boards-list + snapshot/header caches on success, in `frontend/src/hooks/use-boards.ts`
- [x] T013 [US2] Add a Details section to `BoardSettingsDialog` (name/description/color form reusing the create-board fields + color picker; name required) in `frontend/src/components/boards/board-settings-dialog.tsx`
- [x] T014 [US2] Wire details save → `useUpdateBoard`; localized success/error toasts; ensure the board header reflects the new name/color immediately, in `frontend/src/components/boards/board-settings-dialog.tsx` and `frontend/src/app/(app)/boards/[boardId]/page.tsx`
- [x] T015 [US2] Handle the inbound `board.updated` WebSocket event so other viewers' header/board update live, in `frontend/src/hooks/use-board-socket.ts`

**Checkpoint**: Owner edits board details; changes are live for other viewers (SC-003).

---

## Phase 5: User Story 3 - Manage roles and remove members (Priority: P2)

**Goal**: An owner can change a member's role (editor↔viewer) and remove a member,
with the owner protected; changes take effect immediately.

**Independent Test**: Demote an editor to viewer → they lose edit access; remove a
member → they vanish from the list and lose access; owner has no remove/demote control.

### Tests for User Story 3

- [x] T016 [P] [US3] Backend test: change role editor↔viewer succeeds; removing a member succeeds; owner role-change/removal → 403 `owner_protected`; setting role to `owner` → 403 `invalid_role`; non-member → 404 `member_not_found`; non-owner caller → 403, in `backend/tests/test_members.py`

### Implementation for User Story 3 (backend)

- [x] T017 [P] [US3] Add `get_member`, `update_member_role`, `remove_member` to `backend/app/repositories/board_repo.py`
- [x] T018 [US3] Add `change_member_role` and `remove_member` service functions enforcing owner protection (reject owner row, reject `owner` target) in `backend/app/services/board_service.py`
- [x] T019 [US3] Add owner-guarded routes `PATCH /boards/{board_id}/members/{user_id}` and `DELETE /boards/{board_id}/members/{user_id}` (204), each calling `record_and_broadcast` with `member.role_changed` / `member.removed`, in `backend/app/api/routes/boards.py`

### Implementation for User Story 3 (frontend)

- [x] T020 [P] [US3] Add `boardsApi.updateMemberRole(boardId, userId, role)` and `boardsApi.removeMember(boardId, userId)` in `frontend/src/lib/endpoints.ts`
- [x] T021 [P] [US3] Add `useUpdateMemberRole(boardId)` and `useRemoveMember(boardId)` mutation hooks updating the members cache, in `frontend/src/hooks/use-boards.ts`
- [x] T022 [US3] In the member list, add a per-row role select (editor/viewer) and a remove button — both hidden for the owner row — wired to the new hooks with localized confirm + toasts, in `frontend/src/components/boards/board-settings-dialog.tsx`

**Checkpoint**: Full member lifecycle works with owner protection (SC-004, SC-005, SC-006).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Visibility rules, RTL, quality gates, verification, docs.

- [x] T023 [P] Ensure all settings/member controls are owner-only (gear hidden for editors/viewers; member list read-only for non-owners) and verify across roles, in `frontend/src/app/(app)/boards/[boardId]/page.tsx` and `frontend/src/components/boards/board-settings-dialog.tsx` (SC-007)
- [x] T024 [P] Apply logical Tailwind utilities + `dir`-correct layout to the settings dialog so it renders correctly in Arabic/RTL, in `frontend/src/components/boards/board-settings-dialog.tsx`
- [x] T025 Run backend gate: `pytest --cov=app` (≥70%) and `ruff check app tests`; fix any failures
- [x] T026 Run frontend gate: `npm run typecheck && npm run lint && npm run test && npm run build`; fix any failures
- [x] T027 Run the `quickstart.md` two-account verification (invite, messages, live edit, role change, removal, owner protection, non-owner visibility, Arabic/RTL) via a Playwright pass
- [x] T028 [P] Update `README.md` (features table) to note board sharing / member management

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — baseline check.
- **Foundational (Phase 2)**: schemas + dictionary keys — blocks all stories.
- **US1 (P1, MVP)**: after Foundational. Builds the settings dialog shell + invite.
- **US2 (P1)**: after Foundational; shares the dialog file with US1 (add Details
  section after the shell exists, so run after US1's T008).
- **US3 (P2)**: after Foundational; backend (T017–T019) is independent and can run in
  parallel with US1/US2; frontend row controls (T022) extend the member list, so run
  after US1's member list exists.
- **Polish (Phase 6)**: after the targeted stories.

### User Story Dependencies

- US1 → independent (MVP).
- US2 → independent backend (existing endpoint); frontend Details section extends the
  US1 dialog shell.
- US3 → backend independent; frontend extends the US1 member list.

### Within Each User Story

- Tests before implementation. Repo → service → route (backend). API → hooks → UI
  (frontend).

### Parallel Opportunities

- Phase 2: T002 ∥ T003 ∥ T004 (different files).
- US3 backend (T017→T018→T019) can proceed in parallel with US1/US2 frontend.
- Tests T005/T011/T016 are `[P]` (same new test file but independent cases — if
  worked by one agent, append sequentially).
- Frontend API/hooks tasks marked `[P]` are different files from the dialog.

---

## Parallel Example: User Story 3 (backend ∥ frontend)

```bash
# Backend chain (one track):
Task: "Add get_member/update_member_role/remove_member to board_repo.py"   # T017
Task: "Add change_member_role/remove_member service w/ owner protection"   # T018
Task: "Add PATCH/DELETE /members/{user_id} routes + broadcast"             # T019

# Frontend track (parallel, different files):
Task: "Add updateMemberRole/removeMember to endpoints.ts"                  # T020
Task: "Add useUpdateMemberRole/useRemoveMember hooks"                      # T021
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 + Phase 2 → 2. US1 (invite + settings dialog shell + member list).
3. **STOP & VALIDATE**: owner can invite a teammate who then gains access. This alone
   delivers the headline "share your board" value.

### Incremental Delivery

1. Setup + Foundational.
2. US1 → invite by email (MVP, SC-001/SC-002).
3. US2 → edit board details + live (SC-003).
4. US3 → roles + removal + owner protection (SC-004/005/006).
5. Polish → visibility (SC-007), RTL, gates, docs.

---

## Notes

- [P] = different files, no dependencies.
- **No new dependencies; no DB migrations** (existing schema/roles/real-time reused).
- Owner protection is enforced server-side (not just hidden in UI) — Principle IV.
- Keep all gates green (Principle II); commit after each task or logical group.
