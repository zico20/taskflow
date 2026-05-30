"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WS_URL } from "@/lib/api";
import type {
  ActivityEntry,
  BoardDetail,
  BoardSnapshot,
  ColumnWithTasks,
  PresenceUser,
  Task,
  WsMessage,
} from "@/lib/types";
import {
  boardKey,
  checklistKey,
  commentsKey,
  labelsKey,
  snapshotKey,
} from "./use-board";
import type { ChecklistItem, Comment } from "@/lib/types";

interface UseBoardSocketResult {
  connected: boolean;
  viewers: PresenceUser[];
  activity: ActivityEntry[];
}

/**
 * Subscribes to /ws/boards/{id}. Applies inbound domain events to the snapshot
 * cache so other users' changes appear live, tracks presence, and accumulates
 * the activity feed. `currentUserId` lets us skip events we originated (we
 * already applied those optimistically).
 */
export function useBoardSocket(
  boardId: number,
  currentUserId: number | undefined,
  initialActivity: ActivityEntry[] = [],
): UseBoardSocketResult {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [viewers, setViewers] = useState<PresenceUser[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>(initialActivity);
  const wsRef = useRef<WebSocket | null>(null);
  // Keep activity in sync if the initial fetch resolves after mount.
  const seededRef = useRef(false);

  useEffect(() => {
    if (!seededRef.current && initialActivity.length) {
      setActivity(initialActivity);
      seededRef.current = true;
    }
  }, [initialActivity]);

  useEffect(() => {
    if (!boardId) return;
    let cancelled = false;
    let pingTimer: ReturnType<typeof setInterval> | undefined;

    const url = `${WS_URL}/ws/boards/${boardId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    const setSnapshot = (
      fn: (cols: ColumnWithTasks[]) => ColumnWithTasks[],
    ) => {
      qc.setQueryData<BoardSnapshot>(snapshotKey(boardId), (prev) =>
        prev ? { ...prev, columns: fn(prev.columns) } : prev,
      );
    };

    // Recompute a task's card progress from the per-task checklist cache (if the
    // dialog is/was open). If nothing is cached we simply leave the snapshot
    // counts untouched until the next full fetch — no incorrect guess.
    const patchChecklistCounts = (taskId: number) => {
      const items = qc.getQueryData<ChecklistItem[]>(
        checklistKey(boardId, taskId),
      );
      if (!items) return;
      const total = items.length;
      const done = items.filter((i) => i.is_done).length;
      setSnapshot((cols) =>
        cols.map((c) => ({
          ...c,
          tasks: c.tasks.map((t) =>
            t.id === taskId
              ? { ...t, checklist_total: total, checklist_done: done }
              : t,
          ),
        })),
      );
    };

    ws.onopen = () => {
      if (cancelled) return;
      setConnected(true);
      pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN)
          ws.send(JSON.stringify({ type: "ping" }));
      }, 25_000);
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      const msg: WsMessage = JSON.parse(event.data);
      // Ignore events we caused — we already updated the cache optimistically.
      const actorId = "actor_id" in msg ? msg.actor_id : undefined;
      const isSelf = actorId !== undefined && actorId === currentUserId;

      switch (msg.type) {
        case "presence":
          setViewers(msg.data.viewers);
          break;
        case "activity":
          setActivity((prev) => [msg.data, ...prev].slice(0, 20));
          break;
        case "task.created":
          if (isSelf) break;
          setSnapshot((cols) =>
            cols.map((c) =>
              c.id === (msg.data as Task).column_id
                ? { ...c, tasks: [...c.tasks, msg.data as Task] }
                : c,
            ),
          );
          break;
        case "task.updated":
          if (isSelf) break;
          setSnapshot((cols) =>
            cols.map((c) => ({
              ...c,
              tasks: c.tasks.map((t) =>
                t.id === (msg.data as Task).id ? (msg.data as Task) : t,
              ),
            })),
          );
          break;
        case "task.deleted":
          if (isSelf) break;
          setSnapshot((cols) =>
            cols.map((c) => ({
              ...c,
              tasks: c.tasks.filter((t) => t.id !== msg.data.id),
            })),
          );
          break;
        case "task.moved":
          if (isSelf) break;
          // Reconcile by refetching — move semantics are easiest to get right
          // from the authoritative server state.
          qc.invalidateQueries({ queryKey: snapshotKey(boardId) });
          break;
        case "column.created":
          if (isSelf) break;
          setSnapshot((cols) => [...cols, { ...msg.data, tasks: [] }]);
          break;
        case "column.updated":
          if (isSelf) break;
          setSnapshot((cols) =>
            cols.map((c) =>
              c.id === msg.data.id ? { ...c, name: msg.data.name } : c,
            ),
          );
          break;
        case "column.deleted":
          if (isSelf) break;
          setSnapshot((cols) => cols.filter((c) => c.id !== msg.data.id));
          break;
        case "column.reordered":
          if (isSelf) break;
          setSnapshot((cols) => {
            const byId = new Map(cols.map((c) => [c.id, c]));
            return msg.data.column_ids
              .map((id) => byId.get(id))
              .filter((c): c is ColumnWithTasks => Boolean(c));
          });
          break;
        case "board.updated":
          if (isSelf) break;
          // Live-update the board header (name/color) for other viewers.
          qc.setQueryData<BoardDetail>(boardKey(boardId), (prev) =>
            prev ? { ...prev, ...msg.data } : prev,
          );
          break;
        case "label.created":
          if (isSelf) break;
          qc.invalidateQueries({ queryKey: labelsKey(boardId) });
          break;
        case "label.deleted":
          if (isSelf) break;
          // A deleted label is removed from its tasks server-side (cascade), so
          // refetch both the label list and the snapshot to clear its chips.
          qc.invalidateQueries({ queryKey: labelsKey(boardId) });
          qc.invalidateQueries({ queryKey: snapshotKey(boardId) });
          break;

        // --- Checklist (subtasks) ---
        case "checklist.created":
        case "checklist.updated": {
          if (isSelf) break;
          const item = msg.data as ChecklistItem;
          const key = checklistKey(boardId, item.task_id);
          qc.setQueryData<ChecklistItem[]>(key, (prev) => {
            if (!prev) return prev; // dialog not open → nothing cached
            const exists = prev.some((i) => i.id === item.id);
            return exists
              ? prev.map((i) => (i.id === item.id ? item : i))
              : [...prev, item];
          });
          patchChecklistCounts(item.task_id);
          break;
        }
        case "checklist.reordered": {
          if (isSelf) break;
          const { task_id, item_ids } = msg.data;
          const key = checklistKey(boardId, task_id);
          qc.setQueryData<ChecklistItem[]>(key, (prev) => {
            if (!prev) return prev;
            const byId = new Map(prev.map((i) => [i.id, i]));
            return item_ids
              .map((id) => byId.get(id))
              .filter((i): i is ChecklistItem => Boolean(i));
          });
          break;
        }
        case "checklist.deleted": {
          if (isSelf) break;
          const { task_id, id } = msg.data;
          const key = checklistKey(boardId, task_id);
          qc.setQueryData<ChecklistItem[]>(key, (prev) =>
            prev ? prev.filter((i) => i.id !== id) : prev,
          );
          patchChecklistCounts(task_id);
          break;
        }

        // --- Comments ---
        case "comment.created": {
          if (isSelf) break;
          const comment = msg.data as Comment;
          const key = commentsKey(boardId, comment.task_id);
          qc.setQueryData<Comment[]>(key, (prev) =>
            prev
              ? prev.some((c) => c.id === comment.id)
                ? prev
                : [...prev, comment]
              : prev,
          );
          break;
        }
        case "comment.deleted": {
          if (isSelf) break;
          const { task_id, id } = msg.data;
          const key = commentsKey(boardId, task_id);
          qc.setQueryData<Comment[]>(key, (prev) =>
            prev ? prev.filter((c) => c.id !== id) : prev,
          );
          break;
        }
        default:
          break;
      }
    };

    return () => {
      cancelled = true;
      if (pingTimer) clearInterval(pingTimer);
      ws.close();
      wsRef.current = null;
    };
  }, [boardId, currentUserId, qc]);

  return { connected, viewers, activity };
}
