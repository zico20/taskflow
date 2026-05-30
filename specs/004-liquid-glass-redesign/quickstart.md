# Quickstart: Adopt the "Liquid Glass" UI Redesign

How to integrate, build, and verify the redesign. **Frontend-only** — the backend is
untouched.

## Integrate (file sync from NewDesign/ → frontend/)

1. `frontend/tailwind.config.ts` ← `NewDesign/tailwind.config.ts`
2. `frontend/src/app/globals.css` ← `NewDesign/app/globals.css`
3. Copy the 3 new files: `components/backdrop.tsx`, `components/theme-switcher.tsx`,
   `app/(auth)/forgot-password/page.tsx`.
4. Replace the 19 remaining restyled files (8 `app/*` routes incl. layouts, 11
   components) and `lib/i18n/dictionaries.ts` with their `NewDesign/` versions.
5. Delete the `NewDesign/` staging folder (its content now lives in `frontend/`).

(See [plan.md](./plan.md) "Project Structure" for the exact file list.)

## Gates

```powershell
# from frontend/
npm run lint            # eslint
npx tsc --noEmit        # strict type check
npm run test            # vitest — incl. AR/EN dictionary-parity test
npm run build           # must build clean (Tailwind config + CSS vars resolve)
```

Backend is unchanged, so no backend gate is required for this feature; if desired,
`pytest` in `backend/` should still pass untouched.

## Manual verification (the visual/behavioral pass)

Run the app (`npm run dev` in `frontend/`, backend on :8000) and check:

### A. The new look is everywhere (US1, SC-001)
1. Landing page, login, signup, boards list, a board with columns/cards/dialogs, and
   the demo board all show the glass styling (glass top bar/modals/menus/pills over the
   aurora backdrop; solid columns/cards/inputs). No screen still shows the old look.
2. Open a board and exercise existing actions — create board, add column, add/move a
   task, apply/remove a label, open board settings, invite a member — each behaves
   exactly as before (US1/SC-002).

### B. Theme switching (US2, SC-003)
3. Click the theme toggle in the top bar → the whole UI (incl. glass tints) switches
   Dark↔Light in under 1s.
4. Reload → the chosen theme is restored with **no flash** of the other theme.
5. Clear `localStorage` / open as a new user → starts in **Dark**.
6. The theme toggle is also present on the login/signup screens.

### C. Theme × language matrix (SC-004)
7. Check all four: Dark+EN, Dark+AR, Light+EN, Light+AR — each renders with legible
   text and correct layout direction (RTL in Arabic).

### D. Accessibility fallbacks (SC-005)
8. With OS "reduce transparency" on → glass surfaces become solid/opaque; text stays
   legible.
9. With OS "reduce motion" on → animations and glass reflections are disabled.

### E. Forgot password (US3, SC-007)
10. On login, click "Forgot password?" → reach the new screen.
11. Submit a valid email → see the "check your inbox" confirmation. (No email is
    actually sent — UI-only by design.)
12. Submit an empty/malformed email → blocked with a validation message.
13. Switch to Arabic → the screen text is localized and laid out RTL.

### F. No lost strings (SC-006)
14. The Vitest dictionary-parity test passing confirms AR/EN key parity; spot-check that
    previously translated UI still shows Arabic text where expected.

## Acceptance ↔ verification map

| Spec | Verified by |
|------|-------------|
| US1 / SC-001, SC-002 | Steps 1–2 + green build + identical logic files |
| US2 / SC-003 | Steps 3–6 |
| SC-004 | Step 7 |
| SC-005 | Steps 8–9 |
| US3 / SC-007 | Steps 10–13 |
| SC-006 | Step 14 + Vitest parity test |
