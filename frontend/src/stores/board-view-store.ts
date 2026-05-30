"use client";

import { create } from "zustand";
import type { Priority } from "@/lib/types";
import type { DueStatus } from "@/lib/due-status";
import {
  EMPTY_VIEW,
  type SortMode,
  type ViewState,
} from "@/lib/task-filter-sort";

/**
 * Client-only filter/sort view state, keyed by board id. This is UI state (never
 * server data, never shared between members), so it lives in Zustand per
 * Constitution Principle I. Not persisted — resets on reload by design.
 */
interface BoardViewStore {
  byBoard: Record<number, ViewState>;
  get: (boardId: number) => ViewState;
  toggleLabel: (boardId: number, labelId: number) => void;
  togglePriority: (boardId: number, p: Priority) => void;
  toggleDue: (boardId: number, d: DueStatus) => void;
  setSort: (boardId: number, sort: SortMode) => void;
  clear: (boardId: number) => void;
}

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value)
    ? arr.filter((x) => x !== value)
    : [...arr, value];
}

export const useBoardViewStore = create<BoardViewStore>((set, getState) => ({
  byBoard: {},
  get: (boardId) => getState().byBoard[boardId] ?? EMPTY_VIEW,
  toggleLabel: (boardId, labelId) =>
    set((s) => {
      const cur = s.byBoard[boardId] ?? EMPTY_VIEW;
      return {
        byBoard: {
          ...s.byBoard,
          [boardId]: { ...cur, labelFilter: toggle(cur.labelFilter, labelId) },
        },
      };
    }),
  togglePriority: (boardId, p) =>
    set((s) => {
      const cur = s.byBoard[boardId] ?? EMPTY_VIEW;
      return {
        byBoard: {
          ...s.byBoard,
          [boardId]: { ...cur, priorityFilter: toggle(cur.priorityFilter, p) },
        },
      };
    }),
  toggleDue: (boardId, d) =>
    set((s) => {
      const cur = s.byBoard[boardId] ?? EMPTY_VIEW;
      return {
        byBoard: {
          ...s.byBoard,
          [boardId]: { ...cur, dueFilter: toggle(cur.dueFilter, d) },
        },
      };
    }),
  setSort: (boardId, sort) =>
    set((s) => {
      const cur = s.byBoard[boardId] ?? EMPTY_VIEW;
      return {
        byBoard: { ...s.byBoard, [boardId]: { ...cur, sort } },
      };
    }),
  clear: (boardId) =>
    set((s) => ({
      byBoard: { ...s.byBoard, [boardId]: EMPTY_VIEW },
    })),
}));
