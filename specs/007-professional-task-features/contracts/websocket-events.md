# Contract: WebSocket Events (new)

All events are emitted via the existing `record_and_broadcast()` on the board channel and carry the standard envelope used by existing task events, including the originating `actor_id`. Clients MUST ignore events whose `actor_id` matches the current user (self-echo), exactly as the existing task event handlers do. REST remains the source of truth; these events are notifications only.

Envelope (existing shape):
```json
{ "event": "checklist.created", "actor_id": 3, "data": { ... } }
```

## Checklist events

| Event | `data` payload | Client handling |
|-------|----------------|-----------------|
| `checklist.created` | `ChecklistItemPublic` | If a task dialog for `data.task_id` is open, append item; update the card's `checklist_total`/`checklist_done` summary for that task in the snapshot. |
| `checklist.updated` | `ChecklistItemPublic` | Replace the item in any open dialog; recompute the card progress summary. |
| `checklist.reordered` | `{ "task_id": int, "item_ids": int[] }` | Reorder items in any open dialog to match. |
| `checklist.deleted` | `{ "task_id": int, "id": int }` | Remove the item; update card progress summary. |

Because the card progress summary lives on `TaskPublic` in the snapshot cache, checklist events also patch the snapshot's task counts so the board card stays correct without a refetch. (Self-originated changes already updated optimistically.)

## Comment events

| Event | `data` payload | Client handling |
|-------|----------------|-----------------|
| `comment.created` | `CommentPublic` | If a dialog for `data.task_id` is open, append to the thread (oldest-to-newest). |
| `comment.deleted` | `{ "task_id": int, "id": int }` | Remove from the open thread. |

## Activity events (existing channel, new action types)

The existing `activity` broadcast (always delivered, even to self) gains new `action_type` values that `humanize-activity.ts` must localize:
- `checklist.item_added`, `checklist.item_removed`
- `comment.added`, `comment.removed`

No change to the activity envelope or pagination.
