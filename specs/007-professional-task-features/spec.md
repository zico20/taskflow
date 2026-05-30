# Feature Specification: Professional Task Features

**Feature Branch**: `007-professional-task-features`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "ميزات المهام الاحترافية: المهام الفرعية/قائمة التحقق، التعليقات، الفلترة والفرز المتقدمة، وتمييز الاستحقاق/المتأخرة — كلها additive دون المساس بسطح المكتب أو كسر الواقع الزمني الحالي."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Subtasks / Checklist on a task (Priority: P1)

A board editor opens a task and breaks it into smaller actionable steps. They add several checklist items by typing each one, tick them off as the work progresses, reorder them to reflect priority, and remove ones that are no longer relevant. Anyone viewing the board sees a compact progress indicator (e.g. "3/5") on the task card, and every other connected member sees the checklist update live without refreshing.

**Why this priority**: Checklists are the single highest-value addition for a kanban tool — they turn a flat task into a trackable unit of work and give an at-a-glance sense of completion on the board. They are self-contained (a new sub-entity of a task) and deliver value even if nothing else in this feature ships.

**Independent Test**: Open a task as an editor, add three checklist items, mark one complete, reorder the remaining two, delete one. Confirm the card shows the correct completed/total count, the order persists after reopening, and a second browser session viewing the same board reflects each change within ~1 second.

**Acceptance Scenarios**:

1. **Given** a task with no checklist items, **When** an editor adds an item with text, **Then** the item appears in the task's checklist as not-completed and the card shows "0/1".
2. **Given** a checklist with 3 items where 1 is complete, **When** a viewer opens the same board in another session, **Then** they see the same items and a "1/3" progress indicator on the card.
3. **Given** an editor toggles an item from not-completed to completed, **When** the change is saved, **Then** the progress count increases by one for all connected members and the toggling actor does not see a duplicate/echo update.
4. **Given** a checklist with 3 items, **When** an editor reorders them, **Then** the new order is persisted and shown to all members.
5. **Given** a checklist item exists, **When** an editor deletes it, **Then** it is removed for all members and the progress count updates accordingly.
6. **Given** a viewer (read-only role), **When** they open a task with a checklist, **Then** they can see the items and progress but cannot add, toggle, reorder, or delete them.

---

### User Story 2 - Comments on a task (Priority: P2)

A board member opens a task to discuss it. Editors and owners can post text comments; everyone who can see the board (including viewers) can read the full thread. Each comment shows the author's name and when it was written, ordered oldest-to-newest. New comments appear live for all connected members. The comment's author can delete their own comment.

**Why this priority**: Comments add collaboration and context to a task, which is the next most-requested capability after checklists. It depends on nothing from Story 1 and is independently shippable.

**Independent Test**: As an editor, open a task and post two comments; confirm they show author name and a relative timestamp, oldest first. Open the same task as a viewer in a second session and confirm both comments are visible and read-only. Delete one of your own comments and confirm it disappears for all sessions.

**Acceptance Scenarios**:

1. **Given** a task with no comments, **When** an editor posts a comment, **Then** the comment appears in the thread with the author's display name and a timestamp.
2. **Given** a task with comments, **When** any board member (including a viewer) opens it, **Then** they see all comments ordered oldest-to-newest.
3. **Given** an editor posts a comment, **When** another member is viewing the same task/board, **Then** the new comment appears live for them within ~1 second and the posting actor sees no duplicate echo.
4. **Given** a viewer (read-only role), **When** they open a task, **Then** they can read comments but cannot post one.
5. **Given** a comment authored by the current user, **When** they choose to delete it, **Then** it is removed for all members.
6. **Given** a comment authored by someone else, **When** a different user views it, **Then** they are not offered a delete action for that comment.
7. **Given** an attempt to post an empty or whitespace-only comment, **When** submitted, **Then** it is rejected and no comment is created.

---

### User Story 3 - Advanced filtering & sorting (Priority: P2)

A member working a busy board narrows down what they see. Above the board they pick filters — by label, by priority, by due status (overdue / due today / upcoming / no date), combined with the existing text search — and the board immediately shows only matching tasks. They can also change how tasks are ordered within each column: manual order (the default, which keeps drag-and-drop working), by due date, by priority, or by creation date. Filtering and sorting only change what the current user sees; they never change the stored data or what other members see.

**Why this priority**: As boards grow, finding the right tasks becomes the main friction point. This is high value but is presentation-only over the existing board data, so it carries less risk than the new data entities and is independently testable.

**Independent Test**: On a board with a mix of labels, priorities, and due dates, apply a label filter and a "overdue" due filter together and confirm only matching tasks remain visible. Switch sort to "due date" and confirm tasks within each column reorder ascending by due date while a second member's view is unaffected. Switch back to "manual" and confirm drag-and-drop still reorders tasks.

**Acceptance Scenarios**:

1. **Given** a board with tasks across multiple labels, **When** the user filters by one label, **Then** only tasks carrying that label are shown and all others are hidden.
2. **Given** active filters, **When** the user combines a label filter, a priority filter, and a due-status filter, **Then** only tasks matching ALL active filters are shown (filters are conjunctive).
3. **Given** filters are active, **When** the user clears all filters, **Then** the full set of tasks is shown again.
4. **Given** the sort is "manual" (default), **When** the user drags a task to a new position, **Then** the manual reorder works exactly as before this feature.
5. **Given** the user selects sort "by due date", **When** applied, **Then** tasks within each column are ordered by due date (tasks with no date sorted last) for that user only.
6. **Given** the user selects sort "by priority", **When** applied, **Then** tasks within each column are ordered high → medium → low for that user only.
7. **Given** one user has filters/sort active, **When** another member views the same board, **Then** the other member's filtering and sorting are unaffected.
8. **Given** filters that match no tasks in a column, **When** applied, **Then** that column shows an empty state rather than breaking the layout.

---

### User Story 4 - Due / overdue highlighting (Priority: P3)

A member scanning the board can instantly tell which tasks need attention. Tasks with a due date show a clear status badge: "Overdue" (urgent styling) when the due date has passed, "Due today" (warning styling) when it is today, and "In N days" (neutral styling) when it is upcoming. Tasks with no due date show no badge. Badges respect the current language direction (RTL/LTR), both light and dark themes, and reduced-motion preferences.

**Why this priority**: A clear refinement of the existing simple overdue coloring. It is the lowest-risk, smallest item and depends on data that already exists (due dates), so it ships last as polish.

**Independent Test**: Create three tasks with due dates in the past, today, and three days out. Confirm each shows the correct badge and wording in both English and Arabic, in both light and dark theme, with no horizontal overflow on the card.

**Acceptance Scenarios**:

1. **Given** a task whose due date is before today, **When** the card renders, **Then** it shows an "Overdue" badge with urgent styling.
2. **Given** a task due today, **When** the card renders, **Then** it shows a "Due today" badge with warning styling.
3. **Given** a task due within the upcoming window, **When** the card renders, **Then** it shows an "In N days" badge with neutral styling.
4. **Given** a task with no due date, **When** the card renders, **Then** no due-status badge is shown.
5. **Given** the interface language is Arabic, **When** a due badge renders, **Then** its text is Arabic and its placement respects RTL.
6. **Given** either light or dark theme is active, **When** a due badge renders, **Then** it remains legible with sufficient contrast.

---

### Edge Cases

- **Checklist on a deleted task**: When a task is deleted, all its checklist items and comments are removed with it (no orphans).
- **Concurrent checklist edits**: Two editors toggle the same item near-simultaneously; the last saved state wins and all members converge on it (REST is the source of truth).
- **Very long checklist item / comment text**: Text is length-limited and wraps without breaking the card or dialog layout; horizontal overflow never appears.
- **Empty / whitespace-only input**: Adding a blank checklist item or blank comment is rejected.
- **Viewer attempts a write**: A read-only viewer attempting to add/toggle/reorder/delete a checklist item, or post a comment, is denied with the standard error shape.
- **Filtering hides the dragged task's neighbors**: When a sort other than "manual" is active, manual drag-and-drop reordering is disabled or clearly inert to avoid persisting a misleading order; switching back to "manual" restores it.
- **No tasks match filters**: The board shows clear empty states per column, not a broken or blank screen.
- **Timezone of "today"/"overdue"**: Due-status is evaluated against the viewer's local day boundary, consistent with the existing date handling.
- **Progress indicator with zero items**: A task with no checklist items shows no progress indicator (not "0/0").

## Requirements *(mandatory)*

### Functional Requirements

**Subtasks / Checklist**

- **FR-001**: The system MUST allow a board editor or owner to add a checklist item, consisting of text, to a task.
- **FR-002**: The system MUST allow an editor or owner to toggle a checklist item between completed and not-completed.
- **FR-003**: The system MUST allow an editor or owner to reorder a task's checklist items, and MUST persist that order.
- **FR-004**: The system MUST allow an editor or owner to delete a checklist item.
- **FR-005**: The system MUST expose, for each task, the count of completed items and the total count of items, so a progress indicator can be shown on the board card.
- **FR-006**: The system MUST display a per-task progress indicator (completed/total) on the board card when the task has at least one checklist item, and MUST show nothing when it has none.
- **FR-007**: The system MUST broadcast checklist additions, toggles, reorders, and deletions to all other connected members of the board in near-real-time, and MUST NOT cause the acting member to receive a duplicate echo of their own change.
- **FR-008**: The system MUST reject checklist item text that is empty or whitespace-only, and MUST enforce a reasonable maximum length.
- **FR-009**: The system MUST prevent read-only viewers from adding, toggling, reordering, or deleting checklist items.

**Comments**

- **FR-010**: The system MUST allow a board editor or owner to post a text comment on a task.
- **FR-011**: The system MUST allow any member who can view the board (viewer, editor, owner) to read all comments on a task.
- **FR-012**: The system MUST display each comment with its author's display name and a timestamp, ordered oldest-to-newest.
- **FR-013**: The system MUST broadcast new comments to all other connected members in near-real-time without an echo to the posting member.
- **FR-014**: The system MUST allow the author of a comment to delete their own comment, and MUST NOT allow other members (except as covered by board ownership, see assumptions) to delete it.
- **FR-015**: The system MUST reject comments whose text is empty or whitespace-only, and MUST enforce a reasonable maximum length.
- **FR-016**: The system MUST prevent read-only viewers from posting or deleting comments.

**Filtering & Sorting**

- **FR-017**: Users MUST be able to filter the visible tasks by label, by priority, and by due status (overdue / due today / upcoming / no date), in combination with the existing text search.
- **FR-018**: When multiple filters are active, the system MUST show only tasks matching ALL of them (conjunctive filtering).
- **FR-019**: Users MUST be able to clear all active filters in one action and return to the full task set.
- **FR-020**: Users MUST be able to sort tasks within each column by: manual order (default), due date, priority, or creation date.
- **FR-021**: Filtering and sorting MUST be presentation-only — they MUST NOT alter stored task data and MUST NOT affect what any other member sees.
- **FR-022**: When sort is "manual", manual drag-and-drop reordering MUST continue to work exactly as it did before this feature.
- **FR-023**: When a sort other than "manual" is active, the system MUST NOT silently persist a reordering that contradicts the stored manual order.
- **FR-024**: When active filters match no tasks in a column, the system MUST show a clear empty state for that column without breaking the layout.

**Due / Overdue Highlighting**

- **FR-025**: The system MUST show a due-status badge on a task card reflecting whether the task is overdue, due today, or upcoming, based on its due date and the viewer's local day.
- **FR-026**: The system MUST show no due-status badge for tasks without a due date.
- **FR-027**: Due-status badges MUST be presented bilingually (AR/EN) with correct RTL/LTR placement, and MUST remain legible in both light and dark themes.

**Cross-cutting**

- **FR-028**: All new write operations MUST enforce the existing role model (owner/editor/viewer) and return the standard error shape `{error, code, details?}` on failure.
- **FR-029**: The desktop presentation at ≥1280px MUST NOT be visually altered by this feature except for the additive elements explicitly described (checklist section and comments thread inside the task dialog; progress and due badges on cards). All other layout MUST remain identical.
- **FR-030**: All new user-facing text MUST have both English and Arabic dictionary entries with key parity.

### Key Entities *(include if feature involves data)*

- **Checklist Item (Subtask)**: A single actionable step belonging to exactly one task. Attributes: text content, completion state (done / not done), an explicit order position within its task, and creation/update timestamps. Deleted when its parent task is deleted.
- **Comment**: A text note belonging to exactly one task, written by one member. Attributes: text content, author (member), creation timestamp. Ordered chronologically within a task. Deleted when its parent task is deleted; also deletable by its author.
- **Task (existing, extended in presentation only)**: Already has title, description, due date, priority, position, labels. This feature adds the notion of an associated checklist (with a completed/total summary) and an associated comment thread, but does not change the task's own stored fields.
- **Filter/Sort View State (client-only)**: The set of active filters and the chosen sort order for the current user's current board view. Not persisted server-side; never shared between members.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add a checklist item to a task and see the card's progress indicator update in under 2 seconds.
- **SC-002**: A checklist change made by one member is reflected in another connected member's view within ~1 second in at least 95% of cases.
- **SC-003**: A user can post a comment and see it appear in the thread (with author and timestamp) in under 2 seconds.
- **SC-004**: On a board of at least 100 tasks, applying a combined label + priority + due filter reduces the visible set and updates the view in under 1 second, with no horizontal scrolling introduced at any supported screen size.
- **SC-005**: 100% of new user-facing strings render correctly in both English and Arabic with correct text direction.
- **SC-006**: A reviewer comparing the board and task dialog at ≥1280px before and after this feature confirms no unintended visual change to existing elements (only the additive checklist, comments, and badges differ).
- **SC-007**: Backend automated test coverage for the new capabilities meets or exceeds the project's mandatory ≥70% threshold, including permission-denied paths for viewers.
- **SC-008**: A task with no checklist items shows no progress indicator, and a task with no due date shows no due badge (no false "0/0" or empty badge), in 100% of cases.

## Assumptions

- **Reuse of existing systems**: Authentication (JWT in httpOnly cookies), the board role model (owner/editor/viewer), the real-time channel (REST is the source of truth, WebSocket notifies, the acting member's own echo is ignored via actor id), the error shape `{error, code, details?}`, and the Liquid Glass design tokens are all reused as-is.
- **Comment editing is out of scope** for this version: comments can be created and deleted-by-author, but not edited. This follows YAGNI; editing can be a later feature.
- **Comment deletion by board owner**: In addition to the author, a board owner MAY delete any comment on their board (moderation). This is a reasonable default; if not desired it can be tightened to author-only.
- **Checklist items are flat** (a single level of items per task), not nested sub-checklists.
- **Upcoming window for "In N days" badge**: A task is "upcoming" when its due date is in the future; the badge shows the number of days until due. No fixed cutoff is assumed beyond "future".
- **Filtering/sorting is client-side over the existing board snapshot** and does not introduce new server query parameters in this version; the board already loads its full task set. (If board sizes grow large enough to need server-side pagination/filtering, that is deferred to the separate performance feature.)
- **"Today"/"overdue" boundary** is evaluated using the viewer's local day, consistent with how due dates are already displayed.
- **Reordering granularity**: Checklist reordering uses the same positional approach already used for tasks/columns (an explicit order field), not a linked list.
- **Mobile/responsive behavior** established in the prior responsive feature continues to apply; all additive elements must remain responsive and must not introduce horizontal overflow.
