# Feature Specification: Colored Labels Management

**Feature Branch**: `003-labels-management`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "إدارة التصنيفات الملوّنة (Labels) من واجهة المستخدم: إنشاء تصنيف باسم ولون, حذف تصنيف, وتطبيق/إزالة التصنيفات على المهام"
(Manage colored labels from the UI: create a label with a name and color, delete a label, and apply/remove labels on tasks.)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apply and remove labels on a task (Priority: P1)

A member working on a board wants to categorize a task at a glance — for example
marking it "Bug" in red or "Urgent" in orange. From the task they open a label
picker, tick one or more existing labels to apply them, and untick a label to
remove it. The applied labels show as colored chips on the task card immediately,
visible to everyone viewing the board.

**Why this priority**: Applying labels is the actual day-to-day value of the
feature — it's how labels help people scan and triage work. A board with a few
seeded labels and nothing else still delivers value the moment tasks can be tagged.
This is the minimum slice that makes labels useful.

**Independent Test**: On a board that has at least one label, open a task, apply a
label, and confirm a colored chip with that label's name appears on the task card;
remove the label and confirm the chip disappears — and that another member viewing
the board sees the same change without reloading.

**Acceptance Scenarios**:

1. **Given** a task and an existing label, **When** a member applies the label to
   the task, **Then** a colored chip showing the label's name appears on the task
   card and in the task detail.
2. **Given** a task that already has a label applied, **When** a member removes that
   label, **Then** the chip disappears from the task everywhere it is shown.
3. **Given** a task, **When** a member applies several different labels, **Then** all
   applied labels appear together on the task card.
4. **Given** another member is viewing the same board, **When** a label is applied to
   or removed from a task, **Then** that member sees the change live without
   reloading.
5. **Given** a label is already applied to a task, **When** a member opens the label
   picker, **Then** that label is shown as already selected/ticked.

---

### User Story 2 - Create a label with a name and color (Priority: P1)

A member wants a new category that doesn't exist yet, such as "Design" in purple.
From the board's label management area they enter a name, pick a color, and create
the label. It becomes immediately available to apply to any task on that board.

**Why this priority**: Without the ability to create labels, the apply flow has
nothing meaningful to apply (beyond any defaults). Creation and application together
form the core loop. It is tied with US1 as foundational.

**Independent Test**: Open the label management area on a board, create a label with
a name and a chosen color, and confirm it appears in the board's label list and is
selectable in the label picker on a task.

**Acceptance Scenarios**:

1. **Given** a member in the label management area, **When** they enter a name,
   choose a color, and create, **Then** the new label appears in the board's label
   list with that name and color.
2. **Given** a newly created label, **When** a member opens a task's label picker,
   **Then** the new label is available to apply.
3. **Given** a member tries to create a label with an empty name, **When** they
   submit, **Then** creation is blocked with a validation message (name is required).
4. **Given** a member enters a name that matches an existing label on the same board,
   **When** they submit, **Then** they see a clear message that a label with that
   name already exists and no duplicate is created.

---

### User Story 3 - Delete a label (Priority: P2)

A member realizes a label is no longer needed — perhaps it was a mistake or a
category that's been retired. From the label management area they delete the label.
It is removed from the board's label list and automatically disappears from any
tasks it was applied to.

**Why this priority**: Deletion completes the label lifecycle (create → apply →
delete) and keeps the label set tidy, but the feature is already useful without it.
Secondary to creating and applying.

**Independent Test**: Create a label, apply it to one or more tasks, then delete the
label and confirm it disappears from the board's label list and from every task it
was on.

**Acceptance Scenarios**:

1. **Given** a label that exists on a board, **When** a member deletes it, **Then** it
   no longer appears in the board's label list or in any task's label picker.
2. **Given** a label that is currently applied to one or more tasks, **When** it is
   deleted, **Then** its chips disappear from all those tasks.
3. **Given** a member initiates deleting a label, **When** the action is destructive
   (affects multiple tasks), **Then** they are asked to confirm before it is removed.
4. **Given** another member is viewing the board, **When** a label is deleted, **Then**
   the label and its chips disappear for them live without reloading.

---

### Edge Cases

- **Who can manage and apply labels?** Anyone who can edit the board (owner and
  editors) may create, delete, and apply/remove labels. Viewers see label chips on
  tasks but cannot create, delete, or change which labels are applied (read-only).
- **Labels are scoped to a board**: A label created on one board is not visible or
  applicable on another board; each board has its own label set.
- **Duplicate names**: Creating a label whose name matches an existing label on the
  same board is rejected with a clear message; names are compared case-insensitively.
- **Deleting an applied label**: Deletion cascades — the label is removed from every
  task it was applied to, rather than being blocked.
- **Empty / whitespace-only name**: Blocked with a validation message before the label
  is created.
- **Color is required**: Creating a label requires choosing a color; if none is picked
  a sensible default color is used so a label always has a color.
- **Applying an already-applied label / removing an unapplied one**: Treated as no-ops
  that converge to the intended state, not errors.
- **Concurrent application**: If two editors change a task's labels at nearly the same
  time, the result converges via the live-update mechanism with no lost label beyond
  the conflicting one.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A member with edit access MUST be able to create a label on a board by
  providing a name and selecting a color.
- **FR-002**: Label names MUST be required (non-empty after trimming) and MUST be
  unique within a board, compared case-insensitively; duplicate names MUST be rejected
  with a clear message.
- **FR-003**: Each label MUST have a color; if the member does not choose one, a default
  color MUST be applied so every label has a color.
- **FR-004**: A newly created label MUST become immediately available to apply to any
  task on the same board.
- **FR-005**: A member with edit access MUST be able to apply one or more existing labels
  to a task and remove labels from a task.
- **FR-006**: Applied labels MUST be displayed as colored chips showing the label name,
  on both the task card and the task detail view.
- **FR-007**: A member with edit access MUST be able to delete a label; deleting a label
  MUST remove it from the board's label set and from every task it was applied to.
- **FR-008**: Deleting a label that is applied to one or more tasks MUST require an
  explicit confirmation before it is removed.
- **FR-009**: Labels MUST be scoped to a single board; a board's labels MUST NOT appear
  on or be applicable to other boards.
- **FR-010**: Creating, deleting, and applying/removing labels MUST be restricted to
  members with edit access (owner and editors); viewers MUST see label chips but MUST
  NOT have label management or application controls.
- **FR-011**: Label changes — creation, deletion, and application/removal on tasks — MUST
  propagate live to other members currently viewing the board without a reload.
- **FR-012**: All label actions MUST be available entirely from the user interface (no
  external tooling required) and MUST present localized text in both Arabic and English,
  consistent with the rest of the app.

### Key Entities *(include if feature involves data)*

- **Label**: A named, colored tag that belongs to exactly one board. Key attributes:
  name (required, unique within its board), color, and the board it belongs to.
- **Task label assignment**: The association between a task and a label applied to it. A
  task can have many labels; a label can be applied to many tasks on the same board.
  Removing the assignment removes the chip; deleting the label removes all its
  assignments.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member can create a new label (name + color) and have it available to
  apply to tasks in under 20 seconds, with no steps outside the app.
- **SC-002**: After a member applies or removes a label on a task, the change is visible
  to a second member currently viewing the board within 2 seconds, without that member
  reloading.
- **SC-003**: 100% of attempts to create a label with an empty or duplicate name produce
  a clear, specific message (never a silent failure or a generic error).
- **SC-004**: Deleting a label removes it from the board's label list and from 100% of
  the tasks it was applied to, with no orphaned chips left behind.
- **SC-005**: Viewers never see label creation, deletion, or apply/remove controls (0
  occurrences across viewer sessions), while still seeing label chips on tasks.
- **SC-006**: Labels remain board-scoped in 100% of cases — a label created on one board
  never appears in another board's label list or pickers.

## Assumptions

- **Edit-access management**: Anyone who can edit the board (owner and editors) can
  create, delete, and apply/remove labels. This mirrors the existing edit-permission
  model rather than restricting label management to the owner only. Viewers are
  read-only.
- **Board-scoped labels**: Labels belong to a board and are not shared across boards.
  A global or workspace-wide label library is out of scope for v1.
- **Color selection**: Members pick from a curated set of preset colors (a small
  palette) rather than entering arbitrary color values; this keeps chips visually
  consistent. The exact palette is an implementation detail.
- **No label editing in v1 (rename/recolor)**: The requested scope is create, delete,
  and apply/remove. Editing an existing label's name or color after creation is out of
  scope for v1 and can be added later (delete + recreate is the workaround).
- **Live updates reuse existing real-time channel**: Label creation, deletion, and
  application changes surface to active viewers through the same live-update mechanism
  the app already uses for board activity.
- **Bilingual UI**: All new screens/dialogs follow the existing Arabic/English + RTL/LTR
  behavior already in the product.
- **Cascade on delete**: Deleting a label cascades to remove its assignments from tasks,
  rather than blocking deletion while the label is in use.
