# Contract: Labels API, Frontend Module & Realtime Events

Covers the REST endpoints (existing, rewired through a service), the frontend client
module (existing), and the new WebSocket events. **No request/response *shape*
changes to the REST endpoints** — the behavioral changes are: a friendly 409 on
duplicate names, and a broadcast side-effect on create/delete.

## REST endpoints (prefix `/api`)

All under `/boards/{board_id}/labels`. Auth via JWT httpOnly cookie. Error bodies use
the app shape `{ "error": string, "code": string, "details"?: object }`.

### GET `/boards/{board_id}/labels` — list (unchanged)
- **Guard**: `require_board_viewer` (any member).
- **200** → `LabelPublic[]`, ordered by name.
- **403** non-member with no access / **404** board not found (existence hidden).

### POST `/boards/{board_id}/labels` — create
- **Guard**: `require_board_editor` (owner or editor).
- **Body** `LabelCreate`: `{ "name": string(1..60), "color"?: string(<=20) }`
  (color defaults to `#58A6FF`).
- **201** → `LabelPublic`.
- **409** `{ code: "label_name_taken" }` when a label with the same name (trim +
  case-insensitive) already exists on the board. *(NEW behavior — previously a 500.)*
- **422** validation (empty/too-long name).
- **403** viewer / non-editor.
- **Side-effect (NEW)**: broadcasts `label.created` + an activity entry.

### DELETE `/boards/{board_id}/labels/{label_id}` — delete
- **Guard**: `require_board_editor`.
- **204** no content. Cascade removes `task_labels` rows (chips vanish from tasks).
- **404** `{ code: "label_not_found" }` when the label does not exist or belongs to
  another board.
- **Side-effect (NEW)**: broadcasts `label.deleted` + an activity entry.

### Applying / removing labels on a task (existing — no new endpoint)
- `PATCH /boards/{board_id}/tasks/{task_id}` with body including
  `"label_ids": number[]` sets the task's full label set. Ids must belong to the same
  board (validated server-side). Omitting `label_ids` leaves labels unchanged.

## `LabelPublic` shape

```json
{ "id": 12, "board_id": 3, "name": "Bug", "color": "#F85149" }
```

## Frontend client module (`lib/endpoints.ts` — already present)

```ts
labelsApi.list(boardId): Promise<Label[]>
labelsApi.create(boardId, name, color): Promise<Label>   // POST
labelsApi.remove(boardId, labelId): Promise<void>        // DELETE
```

No change expected. Apply/remove uses the existing `tasksApi.update(..., { label_ids })`.

## Frontend hooks (`hooks/use-board.ts`)

- `useLabels(boardId)` — query, key `["board", boardId, "labels"]` (exists).
- `useCreateLabel(boardId)` — mutation, invalidates labels (exists; **now wired** to
  the new dialog). On `label_name_taken` the dialog surfaces a localized message.
- `useDeleteLabel(boardId)` — **NEW** mutation; on success invalidate the `labels`
  query **and** the task snapshot (chips were removed server-side).

## WebSocket events (channel per board — NEW message types)

Server broadcasts (via `record_and_broadcast`), excluding the originating connection;
clients also ignore events whose `actor_id` matches the current user (echo of their
own optimistic change).

```jsonc
// label created
{ "type": "label.created", "data": { /* LabelPublic */ }, "actor_id": 7 }

// label deleted
{ "type": "label.deleted", "data": { "id": 12 }, "actor_id": 7 }
```

Client reactions (`hooks/use-board-socket.ts`), when not self-originated:
- `label.created` → invalidate `labels` query.
- `label.deleted` → invalidate `labels` query **and** the task snapshot (so chips for
  the deleted label disappear without reload).

Add the two variants to the `WsMessage` union in `lib/types.ts`.

## Error codes introduced / used

| Code | HTTP | When |
|------|------|------|
| `label_name_taken` | 409 | Duplicate name (trim, case-insensitive) on create |
| `label_not_found` | 404 | Delete of a missing or cross-board label (existing code, now via service) |
