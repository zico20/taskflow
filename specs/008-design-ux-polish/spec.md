# Feature Specification: Design & UX Polish

**Feature Branch**: `008-design-ux-polish`

**Created**: 2026-05-31

**Status**: Draft

**Input**: User description: "صقل التصميم وتجربة المستخدم: skeleton loaders، حركات دخول/خروج، micro-interactions، وحالات فارغة محسّنة — كلها additive على الواجهة فقط، تحترم prefers-reduced-motion، ودون المساس بسطح المكتب بصرياً في حالته الساكنة."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Skeleton loaders replace spinners (Priority: P1)

A user opens the boards list, then a board, then a task. Instead of a blank area or a lone spinning circle while data loads, they see a placeholder that mirrors the shape of the content that's coming — card-shaped blocks for the boards grid, column-and-task-card shapes for the board, line shapes for the comment thread and checklist. When the real data arrives it replaces the placeholder in the same position, so nothing jumps around.

**Why this priority**: This is the most visible, highest-value polish — it makes the app feel fast and intentional during the unavoidable load moments, and it removes layout shift. It touches the primary screens users hit every session.

**Independent Test**: Throttle the network (or load a fresh session) and open the boards list, a board, and a task. Confirm each shows a content-shaped skeleton during load, the skeleton occupies the same footprint as the loaded content (no visible jump when data arrives), and that with "reduce motion" enabled the skeleton is a static placeholder (no shimmer animation).

**Acceptance Scenarios**:

1. **Given** the boards list is loading, **When** the page renders before data arrives, **Then** a grid of card-shaped skeletons is shown (matching the real grid's columns/spacing) instead of a spinner.
2. **Given** a board is loading, **When** the page renders before the snapshot arrives, **Then** column-shaped skeletons each containing a few task-card-shaped skeletons are shown.
3. **Given** a task dialog opens, **When** its checklist and comments are still loading, **Then** line-shaped skeletons are shown in those sections.
4. **Given** loaded content arrives, **When** the skeleton is replaced, **Then** the content appears in the same footprint with no visible layout shift.
5. **Given** the user has "reduce motion" enabled, **When** a skeleton shows, **Then** it is a static (non-shimmering) placeholder.
6. **Given** light or dark theme and Arabic (RTL) or English (LTR), **When** a skeleton shows, **Then** it is legible and correctly placed in all four combinations.

---

### User Story 2 - Smooth entrance & exit animations (Priority: P2)

A user opens and closes dialogs and drawers throughout the app. Dialogs and the activity/mobile drawers now animate gently both when they open and when they close, instead of snapping shut. Lists that appear (the activity feed, the boards grid) reveal their items with a subtle staggered fade so the screen feels composed rather than dumped all at once. Everything is quick and unobtrusive.

**Why this priority**: Exit animations and stagger are the difference between "functional" and "crafted". It's lower-risk than skeletons (no data dependency) but slightly less impactful, so it comes second.

**Independent Test**: Open then close a dialog, the activity drawer, and the mobile nav — confirm each animates on both open and close (not just open). Open a board with several activity entries and a boards page with several boards — confirm items reveal with a brief stagger. Enable "reduce motion" and confirm all of these become instant.

**Acceptance Scenarios**:

1. **Given** a dialog is open, **When** the user closes it, **Then** it animates out (fade/scale) before being removed, rather than disappearing instantly.
2. **Given** the activity drawer or mobile nav is open, **When** the user closes it, **Then** it slides/fades out smoothly.
3. **Given** a list of items (activity feed, boards grid), **When** it first renders, **Then** items reveal with a brief staggered entrance rather than all at once.
4. **Given** "reduce motion" is enabled, **When** any of the above occurs, **Then** the transition is effectively instant (no motion).
5. **Given** the desktop view at ≥1280px in its resting (settled) state, **When** no interaction is happening, **Then** it looks identical to before this feature.

---

### User Story 3 - Consistent micro-interactions (Priority: P2)

A user triggers actions across the app — submitting a form, adding a checklist item, posting a comment, creating a board. The button they pressed shows a built-in, consistent loading state (a spinner inside the button with the label) for every such action, and on success there's a brief, subtle confirmation cue. Interactive elements have consistent, polished hover and press feedback. None of this changes how the desktop looks when idle — only how it responds to touch and pointer.

**Why this priority**: Unifies a pattern currently hand-rolled in ~13 places, reducing inconsistency and making every action feel responsive. Valuable but mostly a consistency/quality pass, so P2.

**Independent Test**: Trigger each mutating action (create board, save task, add checklist item, post comment, invite member, login). Confirm the triggering button shows a consistent in-button loading state and is disabled while pending, and that a brief success cue appears on completion. Confirm hover/press feedback is consistent across buttons. Confirm the idle desktop appearance is unchanged.

**Acceptance Scenarios**:

1. **Given** any mutating action button, **When** the action is pending, **Then** the button shows an in-button loading indicator alongside (or replacing) its label and is disabled.
2. **Given** an action completes successfully, **When** it resolves, **Then** a brief, subtle success cue is shown (and does not block further interaction).
3. **Given** the loading/success behavior, **When** rendered across the app, **Then** it is visually consistent everywhere (same indicator, same placement).
4. **Given** a pointer hovers or presses an interactive control, **When** it does, **Then** the hover/press feedback is consistent with the rest of the app.
5. **Given** "reduce motion" is enabled, **When** a success cue or press feedback occurs, **Then** it degrades gracefully (no motion, still legible).
6. **Given** the desktop resting state at ≥1280px, **When** idle, **Then** it is visually unchanged from before.

---

### User Story 4 - Improved empty states (Priority: P3)

A user filters or searches a board so that some columns (or all of them) have no matching tasks, or opens a brand-new empty column. Instead of blank whitespace, they see a clear, on-brand empty message: a per-column "no tasks" placeholder, and a board-level "no tasks match your filters" message when filters/search exclude everything. These reuse the existing empty-state styling so they feel native.

**Why this priority**: Smallest, lowest-risk refinement; closes the gap where filtered/empty columns showed nothing. The text key for the no-match case already exists but isn't displayed.

**Independent Test**: Apply a filter/search that matches nothing and confirm a clear board-level empty state appears. Create a new empty column (or empty an existing one) and confirm a tidy per-column placeholder shows. Confirm both render bilingually (AR/EN) with correct direction and in both themes.

**Acceptance Scenarios**:

1. **Given** a filter/search that matches no tasks anywhere on the board, **When** applied, **Then** a clear board-level "no matching tasks" empty state is shown (using the existing empty-state style) rather than blank columns.
2. **Given** a column with no tasks (new column, or all filtered out), **When** it renders, **Then** it shows a tidy per-column placeholder rather than empty whitespace.
3. **Given** Arabic or English, **When** an empty state shows, **Then** its text is localized and correctly placed (RTL/LTR).
4. **Given** light or dark theme, **When** an empty state shows, **Then** it is legible and on-brand.

---

### Edge Cases

- **Fast loads**: When data is already cached and returns near-instantly, skeletons must not "flash" jarringly — a near-instant load should not show a long skeleton (brief or no skeleton is acceptable; it must never get stuck on screen).
- **Reduced motion**: Every animation, shimmer, stagger, and success cue must collapse to an instant, motion-free equivalent under `prefers-reduced-motion: reduce`.
- **Reduced transparency**: Skeletons and animated surfaces must remain legible under `prefers-reduced-transparency` (consistent with existing glass fallbacks).
- **Exit animation interrupted**: If a user reopens a dialog/drawer while it is animating closed (or navigates away), the UI must settle to a correct state with no stuck/ghost overlay.
- **Error instead of data**: If a load fails (not just succeeds), the skeleton must be replaced by the existing error/empty handling, not remain on screen indefinitely.
- **Empty + loading distinction**: A loading state (skeleton) and an empty state (no data) must be visually distinct — a finished load with zero items shows the empty state, not a skeleton.
- **Desktop resting parity**: At ≥1280px, the settled/idle screen must be pixel-equivalent to pre-feature; only loading, transitions, hover/press, and previously-blank empty areas may differ.

## Requirements *(mandatory)*

### Functional Requirements

**Skeleton loaders**

- **FR-001**: While the boards list is loading, the system MUST display content-shaped skeleton placeholders matching the boards grid layout, instead of a spinner.
- **FR-002**: While a board's data is loading, the system MUST display column-shaped skeletons containing task-card-shaped skeletons.
- **FR-003**: While a task's checklist and comments are loading, the system MUST display line-shaped skeleton placeholders in those sections.
- **FR-004**: Skeleton placeholders MUST occupy the same footprint as the content they precede so that no visible layout shift occurs when real content arrives.
- **FR-005**: Skeleton placeholders MUST present a static (non-animated) appearance when `prefers-reduced-motion: reduce` is active, and MUST remain legible under `prefers-reduced-transparency: reduce`.
- **FR-006**: A skeleton MUST be shown only while loading; once data resolves (or errors), the skeleton MUST be removed and never persist on screen.

**Animations & transitions**

- **FR-007**: Dialogs MUST animate on both open and close (not only open).
- **FR-008**: The activity drawer and the mobile navigation drawer MUST animate on both open and close.
- **FR-009**: List reveals (at minimum the activity feed and the boards grid) MUST use a brief staggered entrance rather than revealing all items simultaneously.
- **FR-010**: All animations and transitions added by this feature MUST become effectively instant (no motion) when `prefers-reduced-motion: reduce` is active.
- **FR-011**: If a closing animation is interrupted (e.g. reopened or navigated away), the system MUST settle to a correct visual state with no stuck or ghost overlay.

**Micro-interactions**

- **FR-012**: Mutating-action buttons MUST present a consistent in-button loading indicator while their action is pending, and MUST be disabled while pending.
- **FR-013**: The in-button loading behavior MUST be visually consistent across all such buttons in the app (same indicator and placement).
- **FR-014**: On successful completion of a user-initiated action, the system MUST present a brief, subtle, non-blocking success cue.
- **FR-015**: Hover and press feedback on interactive controls MUST be consistent across the app.
- **FR-016**: Success cues and press feedback MUST degrade gracefully (no motion, still legible) under `prefers-reduced-motion: reduce`.

**Empty states**

- **FR-017**: When an active filter/search matches no tasks anywhere on a board, the system MUST display a clear board-level "no matching tasks" empty state using the existing empty-state styling.
- **FR-018**: A column with no tasks (newly created or fully filtered out) MUST display a tidy per-column placeholder rather than blank whitespace.
- **FR-019**: A finished load that yields zero items MUST show an empty state, visually distinct from the loading skeleton.

**Cross-cutting**

- **FR-020**: This feature MUST be frontend-only — no backend, data-model, or API changes.
- **FR-021**: The desktop presentation at ≥1280px in its settled/idle state MUST NOT change visually; only loading states, transitions, hover/press feedback, and previously-blank empty areas may differ.
- **FR-022**: All new user-facing text MUST have both English and Arabic dictionary entries with key parity, and MUST render with correct RTL/LTR placement.
- **FR-023**: All new visuals MUST work in both light and dark themes and reuse the existing design tokens/utilities (no new color system).

### Key Entities *(include if feature involves data)*

Not applicable — this feature introduces no data entities. It is purely presentational (loading, transition, interaction, and empty-state behavior over existing data).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the boards list, the board view, and the task dialog, a content-shaped skeleton is shown during load in 100% of cold-load cases (no bare spinner on these primary surfaces).
- **SC-002**: Measured layout shift (content jump) when skeletons are replaced by real content is negligible — no perceptible reflow of surrounding elements.
- **SC-003**: Dialogs and both drawers animate on close in 100% of close interactions (verified by observing a non-instant disappearance with motion enabled).
- **SC-004**: 100% of mutating-action buttons show a consistent in-button loading state while pending (no remaining hand-rolled/inconsistent patterns on the targeted surfaces).
- **SC-005**: With "reduce motion" enabled, 100% of this feature's animations, shimmers, staggers, and success cues are motion-free.
- **SC-006**: A filter/search that matches nothing shows a clear empty state (not blank columns) in 100% of such cases.
- **SC-007**: 100% of new user-facing strings render correctly in both English and Arabic with correct text direction.
- **SC-008**: A reviewer comparing the settled desktop view (≥1280px) before and after confirms no unintended visual change to existing idle elements.
- **SC-009**: Frontend quality gates (type check, lint, build) pass, and any new pure logic is covered by tests; the AR/EN parity test passes with the new keys.

## Assumptions

- **Reuse existing systems**: The Liquid Glass design tokens/utilities, the existing `fade-in`/`scale-in` keyframes, the existing `EmptyState` component, the existing toast system, and the existing `prefers-reduced-motion` / `prefers-reduced-transparency` global handling are all reused and extended — no new design system.
- **No new runtime dependencies by default**: Animations and skeletons are built with the existing styling approach (CSS/Tailwind keyframes). A motion library would only be considered if a requirement cannot be met otherwise, and would need explicit justification (YAGNI).
- **Success cue medium**: The "brief success cue" may be realized via the existing toast mechanism and/or a small inline confirmation; the exact medium is an implementation choice as long as it is subtle, non-blocking, and consistent.
- **Skeleton anti-flash**: A minimal display threshold (or simply showing the skeleton only while genuinely pending) is acceptable to avoid jarring flashes on near-instant cached loads; the requirement is only that skeletons never get stuck and never cause layout shift.
- **Targeted surfaces for skeletons**: Boards list, board snapshot (columns + task cards), task dialog (checklist + comments). Other minor loading spots (e.g. auth screens) may keep their current in-button spinners and are out of scope for skeletons.
- **Desktop "settled" definition**: "Visually unchanged" applies to the idle/resting state. Transitional states (loading, opening/closing, hover, press) are expected to differ since that is the point of the feature.
- **Responsive behavior**: The responsive rules established earlier continue to apply; new elements must remain responsive and must not introduce horizontal overflow at any supported width.
