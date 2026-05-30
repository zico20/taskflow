# Contract: Comments API

Base path: `/boards/{board_id}/tasks/{task_id}/comments`

Board-scoped. Non-member → `404`. Error body: `{ "error", "code", "details"? }`.

`CommentPublic`:
```json
{
  "id": 7,
  "task_id": 5,
  "content": "Looks good, ship it.",
  "author": { "id": 3, "name": "Sara", "email": "sara@example.com" },
  "created_at": "2026-05-30T10:05:00Z"
}
```
(`author` is a compact public user; email may be omitted if the existing user-public schema omits it — match the existing `UserPublic` shape.)

---

## GET `/boards/{board_id}/tasks/{task_id}/comments`

List a task's comments, oldest-to-newest.

- **Auth**: any board member (viewer/editor/owner).
- **200**: `CommentPublic[]`.
- **404**: not a member, or board/task not found.

## POST `/boards/{board_id}/tasks/{task_id}/comments`

Post a comment.

- **Auth**: editor or owner. Viewer → `403` (`code: "forbidden"`).
- **Body**: `{ "content": string }` (trimmed, 1–2000 chars).
- **201**: `CommentPublic`.
- **422**: empty/whitespace or over length (`code: "validation_error"`).
- Side effects: WS `comment.created` (data = comment); activity `comment.added`.

## DELETE `/boards/{board_id}/tasks/{task_id}/comments/{comment_id}`

Delete a comment.

- **Auth**: the comment's **author** OR the **board owner**. Otherwise → `403` (`code: "forbidden"`).
- **204**: deleted.
- **404**: comment not under this task/board.
- Side effects: WS `comment.deleted` (data = `{ task_id, id }`); activity `comment.removed`.

**Note**: No edit endpoint in v1 (YAGNI — documented in spec Assumptions).
