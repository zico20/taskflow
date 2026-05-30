# Contract: Layout v2 — Navigation & Layout

No REST/WS API. The "contract" is the layout/navigation structure and the i18n
additions. Keeping the existing behavior contracts intact is what guarantees no
functional regression.

## 1. Sidebar (`components/sidebar.tsx`, new)

- **Replaces** the top bar (`app-shell.tsx`, removed).
- **Contents**: brand → "All boards" link → the user's boards quick-switch list (each
  with color dot + task count) → bottom block (user avatar/name, theme toggle, language
  toggle, log out).
- **Behavior**: clicking a board navigates to it; "All boards" navigates to the boards
  list. Collapses to a ~72px icon rail under the `lg` breakpoint. In Arabic it sits on
  the inline-end (right) and mirrors.
- **Layout token**: `--sidebar-w` (264px) in `globals.css`.
- **Mounted in**: `app/(app)/layout.tsx` (aurora → flex: `<Sidebar/>` + `<main>`).

## 2. Boards page (`app/(app)/boards/page.tsx`)

- A thin context header (page title + "New board" action).
- Boards grouped into labeled sections by the viewer's role:
  - owned → `boards.group.owned`
  - shared-can-edit (editor) → `boards.group.editor`
  - shared-view-only (viewer) → `boards.group.viewer`
- Each section shows its count; empty sections are omitted.
- Create/open/delete board behaviors unchanged.

## 3. Board view (`app/(app)/boards/[boardId]/page.tsx`)

- Context header: breadcrumb (`nav.boards` › board title) + action icons (labels,
  settings, activity toggle).
- Toolbar row: task search + presence.
- Full-width kanban below.
- Activity feed rendered as a slide-over **drawer** (`kanban/activity-drawer.tsx`),
  toggled by the existing `activityPanelOpen` UI-store flag — same content as today.

## 4. Task dialog (`components/kanban/task-dialog.tsx`)

- Two columns: **content** (title + description) ǀ **properties** (priority, due date,
  labels). All existing fields and the create/edit/delete actions are unchanged.

## 5. Board settings (`components/boards/board-settings-dialog.tsx`)

- Details / Members presented as a **side tab rail** (was a top tab bar). Same fields and
  actions (invite, role change, remove, edit details).

## 6. i18n additions (additive only — `lib/i18n/dictionaries.ts`)

5 keys added to **both** `en` and `ar`; **no keys removed**:

```
nav.allBoards
nav.boards
boards.group.owned
boards.group.editor
boards.group.viewer
```

**Contract**: the existing AR/EN dictionary-parity Vitest test must stay green.

## 7. Invariants preserved (regression contract)

- Every existing flow (auth, boards CRUD, columns, tasks, drag-and-drop, labels,
  members/roles, real-time, presence, activity, search) behaves identically — only
  placement changes; logic/hooks/types/stores untouched.
- Bilingual AR/EN + RTL/LTR preserved on every surface (sidebar mirrors to the right in
  Arabic); all v2 markup uses logical properties.
- Both Light and Dark themes render correctly (reuses the `004` token system; Tailwind
  config unchanged).
- The activity toggle uses the same `activityPanelOpen` state as before.
