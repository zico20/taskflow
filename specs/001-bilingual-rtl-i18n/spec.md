# Feature Specification: Full Bilingual (Arabic/English) Support with RTL/LTR

**Feature Branch**: `001-bilingual-rtl-i18n`

**Created**: 2026-05-30

**Status**: Draft

**Input**: User description: "اريد ان اجعل الموقع بلغتين , عربي وانجليزي بشكل كامل ويدعم RTL-LTR"
(Make the whole site bilingual — Arabic and English — with full RTL/LTR support.)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Switch the entire interface language (Priority: P1)

A visitor or signed-in user wants to use the product in their preferred language.
They open a language switcher available everywhere, pick Arabic or English, and
the entire interface — every page, menu, button, label, placeholder, toast
message, empty state, and error — immediately appears in that language with the
correct text direction (right-to-left for Arabic, left-to-right for English).

**Why this priority**: This is the core of the request. Without a reliable,
complete language switch the feature delivers no value. It is also the minimum
slice that can be demonstrated on its own.

**Independent Test**: Open the app, toggle the language switcher, and confirm
that across the landing page, auth pages, board list, and board view, all visible
text changes language and the layout flips direction, with no English text
remaining in Arabic mode (and vice versa).

**Acceptance Scenarios**:

1. **Given** the app is shown in English (LTR), **When** the user selects Arabic,
   **Then** all visible interface text becomes Arabic and the layout switches to
   right-to-left within the same session without losing their place.
2. **Given** the app is shown in Arabic (RTL), **When** the user selects English,
   **Then** all visible interface text becomes English and the layout switches to
   left-to-right.
3. **Given** any screen in the product, **When** the user looks for the language
   switcher, **Then** it is discoverable and usable from that screen.

---

### User Story 2 - Remember my language across visits (Priority: P2)

A returning user expects the product to stay in the language they last chose,
without having to switch again on every visit or page load.

**Why this priority**: Persistence turns a one-off toggle into a real preference.
It strongly affects perceived quality but the product is still usable (via manual
toggling) without it, so it ranks below the core switch.

**Independent Test**: Choose a language, reload the page and navigate to other
pages, then return in a new session/visit; confirm the chosen language and
direction are retained.

**Acceptance Scenarios**:

1. **Given** the user selected Arabic, **When** they reload or navigate to another
   page, **Then** the app remains in Arabic with RTL layout.
2. **Given** a returning visitor who previously chose a language, **When** they
   open the app again later, **Then** it opens directly in that language.
3. **Given** a brand-new visitor with no saved preference, **When** they first
   open the app, **Then** a sensible default language is applied (see Assumptions).

---

### User Story 3 - Correct, readable layout in both directions (Priority: P2)

A user in either language expects the layout to feel native: icons, arrows,
spacing, alignment, and interactive elements (forms, the kanban board, dialogs,
the activity feed, presence avatars) must mirror correctly and remain fully
usable in both RTL and LTR — nothing overlapping, cut off, or pointing the wrong
way.

**Why this priority**: A switch that produces a broken or mirrored-wrong layout
undermines the whole feature. It is tightly coupled to P1 but called out
separately because it is a distinct quality bar to test.

**Independent Test**: In Arabic (RTL), walk through each major screen and the
drag-and-drop board; confirm alignment, directional icons, and interactions are
correct and that the same screens are equally correct in English (LTR).

**Acceptance Scenarios**:

1. **Given** Arabic (RTL) mode, **When** the user views any screen, **Then** text
   aligns to the right, the reading order is right-to-left, and directional icons
   (e.g. back/forward, arrows) point the correct way.
2. **Given** Arabic (RTL) mode, **When** the user drags a task between columns,
   **Then** the board reads right-to-left and the drag-and-drop works correctly.
3. **Given** either language, **When** the user opens dialogs, forms, the activity
   feed, and the board, **Then** no text is clipped, overlapping, or misaligned.

---

### User Story 4 - Localized dates, numbers, and dynamic messages (Priority: P3)

A user expects not just static labels but also dynamic content to read naturally:
relative timestamps ("3 hours ago"), activity-feed sentences ("Zain moved
'Onboarding' to Done"), counts ("3 boards"), and validation/error messages should
all appear in the active language with grammatically correct phrasing.

**Why this priority**: This is the polish layer. The product is already valuable
with static UI translated; localized dynamic content elevates it to feeling truly
native, but can follow the core switch.

**Independent Test**: Create activity (create/move tasks) and view the feed and
timestamps in each language; trigger validation errors in each language; confirm
all dynamic strings, dates, and counts are localized and read correctly.

**Acceptance Scenarios**:

1. **Given** Arabic mode, **When** the user views the activity feed, **Then**
   action sentences and relative times are shown in Arabic.
2. **Given** either language, **When** a form validation or server error occurs,
   **Then** the message is shown in the active language.
3. **Given** either language, **When** counts or dates are displayed, **Then** they
   follow that language's conventions and read naturally.

---

### Edge Cases

- What happens to **user-generated content** (board names, task titles, comments)
  written in one language while the interface is in the other? It MUST be shown
  verbatim as authored, and each such text block MUST display with the direction
  appropriate to its own content so mixed Arabic/English text is not garbled.
- How does the app behave for a **first-time visitor with no saved preference**?
  (Resolved in Assumptions: default language applied.)
- What happens when a **translation is missing** for some text? The app MUST fall
  back to a readable default (the other language) rather than showing a blank or a
  raw key, and MUST never crash.
- How are **emails/links generated by the system** (e.g. password-reset content)
  handled with respect to language? (Out of scope for v1 — see Assumptions.)
- How does **language interact with text direction for individual fields**, e.g.
  an English task title inside an otherwise-Arabic card? Direction MUST be
  resolved per text block so each reads correctly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support two interface languages — Arabic and English
  — covering 100% of user-facing text (pages, navigation, buttons, labels,
  placeholders, tooltips, empty states, toasts, dialogs, and error messages).
- **FR-002**: Users MUST be able to switch the active language from a control that
  is available on every screen, including before signing in.
- **FR-003**: Switching language MUST update all visible text and the layout
  direction immediately, within the same session, without a full data reload and
  without losing the user's current page/context.
- **FR-004**: The system MUST render the interface right-to-left (RTL) when Arabic
  is active and left-to-right (LTR) when English is active, including alignment,
  reading order, and directional icons.
- **FR-005**: The system MUST persist the user's language choice and reapply it on
  reload, navigation, and future visits.
- **FR-006**: For a visitor with no saved preference, the system MUST apply a
  sensible default language on first load (see Assumptions) and allow immediate
  switching.
- **FR-007**: The system MUST display user-generated content (e.g. board/task
  names) exactly as authored, with per-block text direction so mixed-language
  content reads correctly regardless of the active interface language.
- **FR-008**: The system MUST localize dynamic content — relative timestamps,
  activity-feed sentences, counts, and validation/error messages — into the active
  language with grammatically correct phrasing.
- **FR-009**: When a translation for any string is missing, the system MUST fall
  back to a readable value (the other language) and MUST NOT display blank text,
  raw identifiers, or crash.
- **FR-010**: The drag-and-drop board and all interactive components (forms,
  dialogs, activity feed, presence indicators) MUST remain fully functional and
  visually correct in both RTL and LTR.
- **FR-011**: The active language and direction MUST be conveyed to assistive
  technologies (the page MUST advertise its current language and direction) so the
  experience is accessible in both languages.

### Key Entities *(include if feature involves data)*

- **Language preference**: The user's chosen interface language (Arabic or
  English). For signed-in users it may be associated with their account so it
  follows them across devices; for visitors it is retained locally on the device.
  (See Assumptions for the v1 storage decision.)
- **Translatable string set**: The collection of all user-facing text in the
  product, each available in both languages, used to render the interface in the
  active language.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of user-facing text strings are available and displayed in both
  Arabic and English — a reviewer auditing each screen in each language finds zero
  untranslated (wrong-language) strings.
- **SC-002**: Switching language takes visible effect in under 1 second and never
  requires the user to re-navigate to where they were.
- **SC-003**: A returning user finds the product in their previously chosen
  language on 100% of subsequent visits without re-selecting it.
- **SC-004**: In Arabic (RTL), a reviewer completes the core journey — browse the
  demo board, create an account, create a board, create a task, and move a task —
  with no layout defects (no clipped, overlapping, mis-aligned, or wrong-direction
  elements) and no loss of functionality compared to English.
- **SC-005**: Mixed-language content (e.g. an English title in Arabic mode)
  displays correctly in 100% of observed cases, with no reversed or garbled text.
- **SC-006**: New users can find and use the language switcher within their first
  interaction without assistance (discoverable on every screen).

## Assumptions

- **Default language**: For a first-time visitor with no saved preference, the
  default interface language is **Arabic** with RTL (consistent with the existing
  Arabic landing page and the project's primary audience). This can be changed by
  the user at any time via the switcher.
- **Two languages only**: Scope is exactly Arabic and English for v1. The solution
  should not preclude adding more languages later, but no third language is in
  scope.
- **Preference storage**: For v1, the preference is retained on the user's device.
  Associating it with the user's account (so it syncs across devices) is desirable
  but may be deferred; if account-level storage is included it builds on the
  existing account/profile concept.
- **User-generated content is not translated**: The system does not machine- or
  auto-translate board names, task titles, descriptions, or comments. Only the
  product's own interface text is translated; user content is shown as authored.
- **System-generated emails/links out of scope**: Localizing outbound email
  content (e.g. the password-reset message body) is out of scope for v1, since
  email delivery itself is not yet implemented.
- **Both authenticated and unauthenticated areas covered**: The bilingual
  experience applies to public pages (landing, demo, auth) and to the signed-in
  app (boards, board view, dialogs, activity).
- **Existing visual design is reused**: The dark theme, components, and overall
  look remain unchanged; this feature adds language and direction, not a redesign.
