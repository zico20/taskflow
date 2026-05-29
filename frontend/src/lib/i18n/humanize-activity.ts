import type { MessageKey } from "./dictionaries";
import type { TFunction } from "./translate";

// Maps a backend action_type to its whole-sentence template key.
const ACTION_KEY: Record<string, MessageKey> = {
  "task.created": "activity.task.created",
  "task.updated": "activity.task.updated",
  "task.deleted": "activity.task.deleted",
  "task.moved": "activity.task.moved",
  "column.created": "activity.column.created",
  "column.renamed": "activity.column.renamed",
  "column.deleted": "activity.column.deleted",
  "column.reordered": "activity.column.reordered",
  "board.created": "activity.board.created",
  "board.updated": "activity.board.updated",
  "member.added": "activity.member.added",
};

/**
 * Build a localized activity sentence from structured data (action_type + payload),
 * mirroring the backend's human_action verbs. Unknown action types fall back to the
 * server-provided message so new event types degrade gracefully (FR-008, FR-009).
 */
export function humanizeActivity(
  actionType: string,
  userName: string,
  payload: Record<string, unknown>,
  t: TFunction,
  serverMessage?: string,
): string {
  const key = ACTION_KEY[actionType];
  if (!key) return serverMessage ?? actionType;

  const title = String(payload.title ?? "");
  const name = String(payload.name ?? "");
  const column = String(payload.to_column ?? "");
  const member = String(payload.member_name ?? "");

  return t(key, { user: userName, title, name, column, member });
}
