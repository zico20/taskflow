# Quickstart: Design & UX Polish

Frontend-only feature. How to run, verify, and demo it.

## Prerequisites

- Frontend deps installed (`frontend/`), `frontend/.env.local` present.
- Backend running on `:8000` (for data) — unchanged by this feature.

## Run

```powershell
# Backend (from backend/) — unchanged
.\.venv\Scripts\uvicorn.exe app.main:app --port 8000

# Frontend (from frontend/)
npm run dev   # http://localhost:3000
```

## Manual verification flows

### Flow A — Skeletons (P1)
1. Open the browser devtools → Network → throttle to "Slow 3G" (or hard-reload a fresh session).
2. Navigate to the boards list → see a **grid of card skeletons** (not a spinner).
3. Open a board → see **column + task-card skeletons**.
4. Open a task → checklist & comments show **line skeletons** while loading.
5. Confirm content replaces skeletons **in place** (no jump).
6. OS setting → enable "Reduce motion" → reload: skeletons are **static** (no shimmer).

### Flow B — Animations (P2)
1. Open a dialog (e.g. task dialog) and **close** it → it animates **out**, not instant.
2. Open the activity drawer, close it → slides/fades out.
3. On mobile width, open the hamburger nav, close it → animates out.
4. Open a board with several activity entries / a boards page with several boards → items reveal with a brief **stagger**.
5. Enable "Reduce motion" → all of the above become **instant**.

### Flow C — Micro-interactions (P3/consistency)
1. Trigger create board / save task / add checklist item / post comment / invite member / login.
2. Each triggering **button shows an in-button spinner** and is disabled while pending — consistent everywhere.
3. On success, a brief **toast** confirms (non-blocking).

### Flow D — Empty states (P3)
1. On a board, apply a filter/search that matches nothing → a clear **board-level empty state** appears (not blank columns).
2. Create a new empty column (or filter a column to zero) → tidy **per-column placeholder**.
3. Toggle Arabic / dark theme → localized, RTL-correct, legible.

## Automated gates (must pass before commit)

```powershell
# Frontend (from frontend/)
npm run lint
npx tsc --noEmit
npx vitest run     # incl. new stagger helper test + i18n parity
npm run build
```

(Backend is untouched; its pytest/ruff status is unchanged, but re-running them is harmless.)

## Desktop-unchanged check

At ≥1280px, with nothing loading and no pointer interaction, the boards page, a board, and the task dialog look **identical** to before. Only loading (skeleton), open/close transitions, hover/press, success toasts, and previously-blank empty areas differ.
