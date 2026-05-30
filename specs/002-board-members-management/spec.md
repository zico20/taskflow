# Feature Specification: Board Members & Settings Management

**Feature Branch**: `002-board-members-management`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "دعوة أعضاء للبورد عن طريق الإيميل مع تحديد الصلاحية (محرر/مشاهد), وإمكانية تعديل البورد (الاسم والوصف واللون) وإزالة الأعضاء — كل هذا من واجهة المستخدم"
(Invite board members by email with a role (editor/viewer), edit the board (name, description, color), and remove members — all from the UI.)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Invite a member by email (Priority: P1)

A board owner wants to collaborate with a teammate. From the board, they open a
members/settings panel, enter the teammate's email, choose a role (editor or
viewer), and send the invite. The teammate immediately becomes a member with that
role and can access the board the next time they open the app.

**Why this priority**: Collaboration is the product's headline value. Today a board
cannot be shared from the interface at all, so this is the single most important
gap. It is also the minimum slice that delivers value on its own.

**Independent Test**: As an owner, open the members panel, invite an existing
user's email as an editor, and confirm that user now appears in the member list and
can open the board with edit access.

**Acceptance Scenarios**:

1. **Given** an owner viewing their board, **When** they invite a registered user's
   email with the "editor" role, **Then** that user appears in the member list as an
   editor and can view and edit the board.
2. **Given** an owner inviting a user as "viewer", **When** the invite succeeds,
   **Then** that user can open and read the board but cannot make changes.
3. **Given** an owner enters an email that is already a member, **When** they submit,
   **Then** they see a clear message that the user is already a member and no
   duplicate is created.
4. **Given** an owner enters an email with no matching account, **When** they submit,
   **Then** they see a clear, friendly message that no user was found for that email.

---

### User Story 2 - Edit board details (Priority: P1)

An owner wants to rename a board, fix its description, or change its color theme.
From the same settings panel they update any of these fields and save; the changes
are reflected immediately for everyone viewing the board.

**Why this priority**: Editing is a basic, expected capability that is currently
missing (boards can be created and deleted but not edited). Small effort, removes an
obvious gap. Tied with US1 as foundational.

**Independent Test**: As an owner, change a board's name, description, and color,
save, and confirm the new values show on the board and in the boards list, and that
other viewers see the update without reloading.

**Acceptance Scenarios**:

1. **Given** an owner in board settings, **When** they change the name and save,
   **Then** the new name appears on the board header and in the boards list.
2. **Given** an owner changes the description and/or color and saves, **Then** the
   new values are reflected everywhere the board is shown.
3. **Given** another member is currently viewing the board, **When** the owner saves
   an edit, **Then** that member sees the updated board live without reloading.
4. **Given** an owner clears the name and tries to save, **Then** the save is
   blocked with a validation message (name is required).

---

### User Story 3 - Manage roles and remove members (Priority: P2)

An owner needs to adjust who can do what: change a member's role between editor and
viewer, or remove a member entirely. From the member list they pick a member and
change their role or remove them; the change takes effect immediately.

**Why this priority**: Completes the collaboration lifecycle (invite → adjust →
remove). Important but secondary to being able to invite at all.

**Independent Test**: As an owner, change an editor to a viewer and confirm they lose
edit access; remove a member and confirm they disappear from the list and can no
longer open the board.

**Acceptance Scenarios**:

1. **Given** an owner viewing the member list, **When** they change an editor to a
   viewer, **Then** that member can no longer edit the board.
2. **Given** an owner viewing the member list, **When** they remove a member, **Then**
   that member disappears from the list and loses access to the board.
3. **Given** the owner themselves, **When** they view the member list, **Then** the
   owner cannot remove themselves or change their own owner role (ownership is
   protected).
4. **Given** a removed member who was viewing the board, **When** the owner removes
   them, **Then** the member's subsequent actions on the board are rejected.

---

### Edge Cases

- **Who can manage members and settings?** Only the owner may invite, edit board
  details, change roles, and remove members. Editors and viewers see the member list
  read-only (no management controls); viewers see the board read-only as today.
- **Owner protection**: The owner cannot be removed, cannot be demoted, and the
  "owner" role cannot be assigned to anyone via invite (only editor/viewer are
  selectable).
- **Self-invite**: An owner inviting their own email is treated as "already a member".
- **Unknown email / unregistered user**: Surfaced as a friendly "no user found"
  message; no silent failure. (Email-based invites to people without an account are
  out of scope for v1 — see Assumptions.)
- **Removing the last non-owner**: Allowed; the board simply returns to owner-only.
- **Invalid email format**: Blocked client-side with a validation message before
  submitting.
- **Concurrent edits**: If two people change board details at nearly the same time,
  the last saved value wins; everyone converges on the latest via the live update.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: An owner MUST be able to invite a member to a board by entering an email
  address and selecting a role of either "editor" or "viewer".
- **FR-002**: On a successful invite, the invited user MUST immediately become a board
  member with the chosen role and gain the corresponding access.
- **FR-003**: The system MUST prevent duplicate memberships and MUST show a clear
  message when the email is already a member.
- **FR-004**: The system MUST show a clear, friendly message when no registered user
  matches the entered email, without creating a membership.
- **FR-005**: The "owner" role MUST NOT be assignable through invites; only "editor"
  and "viewer" are selectable.
- **FR-006**: An owner MUST be able to edit a board's name, description, and color and
  save those changes, with name being required (non-empty).
- **FR-007**: Saved board edits MUST be reflected immediately wherever the board is
  displayed (board header and boards list) and MUST propagate live to other members
  currently viewing the board.
- **FR-008**: An owner MUST be able to view the full member list of a board, showing
  each member's identity and role.
- **FR-009**: An owner MUST be able to change an existing member's role between
  "editor" and "viewer".
- **FR-010**: An owner MUST be able to remove a member from a board, after which that
  member loses all access to the board.
- **FR-011**: The owner MUST NOT be able to remove themselves or change their own role;
  ownership is protected.
- **FR-012**: Member-management and board-settings controls MUST be visible and usable
  ONLY to the owner; non-owners MUST NOT see or be able to use them.
- **FR-013**: All member and settings actions MUST be available entirely from the user
  interface (no external tooling required) and MUST present localized text in both
  Arabic and English, consistent with the rest of the app.

### Key Entities *(include if feature involves data)*

- **Board membership**: The association of a user with a board and the role they hold
  on it (owner, editor, or viewer). Owner is unique per board and protected.
- **Board details**: The editable presentation fields of a board — name (required),
  description (optional), and color theme.
- **Invite action**: An owner-initiated action that resolves an email to a registered
  user and creates a membership with a selected role; it is rejected for unknown
  emails and existing members.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An owner can invite a teammate and have them gain access in under 30
  seconds, with no steps outside the app.
- **SC-002**: 100% of invites to an already-member or unknown email produce a clear,
  specific message (never a silent failure or a generic error).
- **SC-003**: After an owner edits a board's name/description/color, the change is
  visible to a second member currently viewing the board within 2 seconds, without
  that member reloading.
- **SC-004**: Role changes take effect immediately — a member demoted to viewer can no
  longer perform edit actions on their next attempt.
- **SC-005**: A removed member loses access immediately — their next attempt to act on
  the board is rejected.
- **SC-006**: Owner protection holds in 100% of attempts — there is no path in the UI
  to remove or demote the owner.
- **SC-007**: Non-owners never see member-management or board-settings controls (0
  occurrences across editor and viewer sessions).

## Assumptions

- **Invite-by-existing-account only (v1)**: Invites resolve an email to an existing
  registered user. Inviting people who do not yet have an account (sending an email
  invitation link) is out of scope for v1, consistent with the project's "no outbound
  email yet" state.
- **Owner-only management**: Managing members and editing settings is restricted to the
  board owner. A future enhancement could let editors invite, but v1 keeps it simple
  and safe.
- **Single owner per board**: Each board has exactly one owner; transferring ownership
  is out of scope for v1.
- **Reuse existing roles**: The role model (owner/editor/viewer) already exists; this
  feature exposes and manages it from the UI rather than introducing new roles.
- **Live updates reuse existing real-time channel**: Board edits and membership changes
  surface to active viewers through the same live-update mechanism the app already uses
  for board activity.
- **Bilingual UI**: All new screens/dialogs follow the existing Arabic/English + RTL/LTR
  behavior already in the product.
