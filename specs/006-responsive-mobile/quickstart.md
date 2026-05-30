# Quickstart: Responsive Mobile & Tablet Support

How to build and verify. **Frontend-only** — the backend is untouched.

## Gates

```powershell
# from frontend/
npm run lint            # eslint
npx tsc --noEmit        # strict type check
npm run test            # vitest — incl. AR/EN dictionary-parity test
npm run build           # must build clean
```

## Manual verification — responsive pass

Run the app (`npm run dev` in `frontend/`, backend on :8000). Use the browser device
toolbar (or resize) and check at these widths: **320, 375, 425, 768, 1024, 1280px**, in
both themes and both languages.

### A. No horizontal scroll + reflow (US1, SC-001/SC-002)
1. At 320 / 375 / 425px, open each screen (landing, login, signup, forgot-password, boards
   list, a board, dialogs) → no horizontal **page** scroll anywhere; nothing clipped or
   overlapping; content reads as a single column where it was multi-column on desktop.
2. On the board at phone widths, confirm the **board** scrolls horizontally within its area
   while the page does not.
3. Complete by touch: log in → open a board → open/edit a task. All reachable.

### B. Mobile navigation (US2, SC-004)
4. At <768px, confirm a labeled hamburger is visible and the sidebar rail is hidden.
5. Tap it → drawer opens (smooth) with All boards + board list + user/theme/language/logout.
6. Select a board → drawer closes and navigates. Reopen → tap outside (scrim) → closes.
   Reopen → press Escape → closes.
7. Keyboard: Tab to the trigger, Enter to open, Tab through items, Escape to close; confirm
   the button is announced (aria-label) and `aria-expanded` flips.

### C. Tablets (US3, SC-007)
8. At 768px → boards list shows a 2-column grid; sidebar visible. At 1024–1279px → board and
   grids comfortably proportioned (not a stretched phone, not desktop) with no page scroll.

### D. Touch & forms (US4, SC-005/SC-006)
9. On a touch emulator, confirm buttons/links/menu items are easy to tap and show a pressed/
   focus state; no action needs hover.
10. Focus a text field on a 375px iOS profile → the page does NOT zoom; the field is
    comfortably wide.
11. Enable "reduce motion" → non-essential animations are reduced/removed.

### E. Desktop unchanged (SC-003) — the critical guarantee
12. At ≥1280px, compare each screen against the pre-feature look: layout, spacing, and
    visuals are identical; no hamburger appears; the sidebar is exactly as before.

### F. RTL + themes (SC-007)
13. Switch to Arabic at phone/tablet widths → the hamburger/drawer and reflowed layouts
    mirror correctly (drawer from the inline-start side, etc.). Check Dark and Light.

### G. No regressions (SC-008)
14. Exercise drag-and-drop, labels, members, search, real-time (second session) at a couple
    of widths → all behave as before.

## Acceptance ↔ verification map

| Spec | Verified by |
|------|-------------|
| US1 / SC-001, SC-002 | Steps 1–3 |
| US2 / SC-004 | Steps 4–7 |
| US3 / SC-007 | Steps 8, 13 |
| US4 / SC-005, SC-006 | Steps 9–11 |
| SC-003 (desktop unchanged) | Step 12 + scoping rules below `xl` |
| SC-008 (no regressions) | Step 14 + green build/tests |
