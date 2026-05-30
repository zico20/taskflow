# Contract: Checklist (Subtasks) API

Base path: `/boards/{board_id}/tasks/{task_id}/checklist`

All endpoints are board-scoped. Non-member → `404`. Authenticated member without sufficient role on a write → `403`. Error body shape: `{ "error": string, "code": string, "details"?: any }`.

`ChecklistItemPublic`:
```json
{
  "id": 12,
  "task_id": 5,
  "content": "Write the migration",
  "is_done": false,
  "position": 1000,
  "created_at": "2026-05-30T10:00:00Z",
  "updated_at": "2026-05-30T10:00:00Z"
}
```

---

## GET `/boards/{board_id}/tasks/{task_id}/checklist`

List a task's checklist items, ordered by `position` ascending.

- **Auth**: any board member (viewer/editor/owner).
- **200**: `ChecklistItemPublic[]`
- **404**: not a member, or board/task not found.

## POST `/boards/{board_id}/tasks/{task_id}/checklist`

Create a checklist item.

- **Auth**: editor or owner. Viewer → `403` (`code: "forbidden"`).
- **Body**: `{ "content": string }` (trimmed, 1–500 chars).
- **201**: `ChecklistItemPublic` (server assigns `position` = next, `is_done=false`).
- **422**: empty/whitespace or over length (`code: "validation_error"`).
- Side effects: WS `checklist.created` to board (data = item); activity `checklist.item_added`.

## PATCH `/boards/{board_id}/tasks/{task_id}/checklist/{item_id}`

Update an item's content and/or completion.

- **Auth**: editor or owner. Viewer → `403`.
- **Body** (all optional): `{ "content"?: string, "is_done"?: boolean }`.
- **200**: `ChecklistItemPublic`.
- **404**: item not under this task/board.
- **422**: content empty/whitespace or over length.
- Side effects: WS `checklist.updated` (data = item). Activity logged only when meaningful (not for every toggle, per research Decision 3).

## POST `/boards/{board_id}/tasks/{task_id}/checklist/reorder`

Set a new order for the task's checklist.

- **Auth**: editor or owner. Viewer → `403`.
- **Body**: `{ "item_ids": number[] }` — full ordered list of the task's item ids.
- **200**: `ChecklistItemPublic[]` (in the new order).
- **422**: `item_ids` does not match exactly the task's current item set (`code: "validation_error"`).
- Side effects: WS `checklist.reordered` (data = `{ task_id, item_ids }`).

## DELETE `/boards/{board_id}/tasks/{task_id}/checklist/{item_id}`

Delete an item.

- **Auth**: editor or owner. Viewer → `403`.
- **204**: deleted.
- **404**: item not under this task/board.
- Side effects: WS `checklist.deleted` (data = `{ task_id, id }`); activity `checklist.item_removed`.
