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
import { boardKey, snapshotKey } from "./use-board";

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
