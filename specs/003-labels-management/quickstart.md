# Quickstart: Colored Labels Management

How to build, run, and verify this feature. Assumes the repo's standard local setup
(SQLite for dev/tests — no Docker needed).

## Run the stack

```powershell
# Backend (from backend/)
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload            # http://localhost:8000

# Frontend (from frontend/)
npm install
npm run dev                              # http://localhost:3000
```

No migration step: the `labels` and `task_labels` tables already exist (dev SQLite
auto-creates the schema; the prod target migrates via Alembic).

## Backend gates

```powershell
# from backend/
pytest                  # includes new tests/test_labels.py; coverage must stay >=70%
ruff check .
```

## Frontend gates

```powershell
# from frontend/
npm run lint            # eslint
npx tsc --noEmit        # strict type check
npm run test            # vitest
npm run build           # must build clean
```

## Manual verification (two accounts — proves live updates)

Open the board in two browser sessions (User A = owner/editor, User B = another
member viewing the same board).

1. **Create (US2)**: As A, open **Manage labels**, enter `Bug`, pick red, create →
   the label appears in A's list. Within ~2s it is available to B too (B opens a task
   and sees `Bug` selectable).
2. **Duplicate name (FR-002/SC-003)**: As A, try to create `bug` (different case) →
   a clear "name already exists" message; no duplicate is created (not a generic
   error).
3. **Apply (US1)**: As A, open a task, tick `Bug` → a red chip appears on the card.
   B sees the chip appear live without reloading.
4. **Remove (US1)**: As A, untick `Bug` on the task → chip disappears for A and B.
5. **Delete (US3)**: Apply `Bug` to two tasks. As A, delete `Bug` from **Manage
   labels** → confirm prompt appears (label is in use) → on confirm, the label leaves
   the list **and** its chips vanish from both tasks, for A and for B, live.
6. **Permissions (FR-010/SC-005)**: As a **viewer**, confirm the **Manage labels**
   entry point and create/delete controls are absent, while existing chips still show
   on cards.
7. **Board scope (SC-006)**: Confirm `Bug` does not appear in another board's label
   list or task picker.
8. **Bilingual/RTL**: Switch language to Arabic → the dialog labels, buttons, and the
   activity-feed sentence for create/delete render in Arabic with correct RTL layout.

## Acceptance ↔ verification map

| Spec | Verified by |
|------|-------------|
| US1 apply/remove | Steps 3–4 |
| US2 create (+ duplicate, validation) | Steps 1–2 + `test_labels.py` |
| US3 delete (+ cascade, confirm) | Step 5 + `test_labels.py` |
| FR-010 edit-access only | Step 6 |
| FR-011 / SC-002 live updates | Steps 1, 3, 5 (second session) |
| SC-006 board-scoped | Step 7 |
| FR-012 bilingual | Step 8 |
