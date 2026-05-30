"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  boardsApi,
  columnsApi,
  labelsApi,
  tasksApi,
  type TaskInput,
} from "@/lib/endpoints";
import type {
  BoardDetail,
  BoardSnapshot,
  ColumnWithTasks,
  Label,
  Task,
} from "@/lib/types";

export const snapshotKey = (boardId: number) =>
  ["board", boardId, "snapshot"] as const;
export const boardKey = (boardId: number) => ["board", boardId] as const;
export const labelsKey = (boardId: number) =>
  ["board", boardId, "labels"] as const;

// --- Queries ---
export function useBoardDetail(boardId: number) {
  return useQuery<BoardDetail>({
    queryKey: boardKey(boardId),
    queryFn: () => boardsApi.get(boardId),
  });
}

export function useBoardSnapshot(boardId: number) {
  return useQuery<BoardSnapshot>({
    queryKey: snapshotKey(boardId),
    queryFn: () => tasksApi.snapshot(boardId),
  });
}

export function useLabels(boardId: number) {
  return useQuery<Label[]>({
    queryKey: labelsKey(boardId),
    queryFn: () => labelsApi.list(boardId),
  });
}

// --- Snapshot cache helpers ---
function updateSnapshot(
  qc: ReturnType<typeof useQueryClient>,
  boardId: number,
  fn: (cols: ColumnWithTasks[]) => ColumnWithTasks[],
) {
  qc.setQueryData<BoardSnapshot>(snapshotKey(boardId), (prev) =>
    prev ? { ...prev, columns: fn(prev.columns) } : prev,
  );
}

// --- Column mutations ---
export function useCreateColumn(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => columnsApi.create(boardId, name),
    onSuccess: (col) => {
      updateSnapshot(qc, boardId, (cols) => [...cols, { ...col, tasks: [] }]);
    },
  });
}

export function useRenameColumn(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, name }: { columnId: number; name: string }) =>
      columnsApi.rename(boardId, columnId, name),
    onMutate: async ({ columnId, name }) => {
      updateSnapshot(qc, boardId, (cols) =>
        cols.map((c) => (c.id === columnId ? { ...c, name } : c)),
      );
    },
  });
}

export function useDeleteColumn(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (columnId: number) => columnsApi.remove(boardId, columnId),
    onMutate: async (columnId) => {
      updateSnapshot(qc, boardId, (cols) =>
        cols.filter((c) => c.id !== columnId),
      );
    },
  });
}

export function useReorderColumns(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (columnIds: number[]) =>
      columnsApi.reorder(boardId, columnIds),
    onMutate: async (columnIds) => {
      updateSnapshot(qc, boardId, (cols) => {
        const byId = new Map(cols.map((c) => [c.id, c]));
        return columnIds
          .map((id) => byId.get(id))
          .filter((c): c is ColumnWithTasks => Boolean(c));
      });
    },
  });
}

// --- Task mutations ---
export function useCreateTask(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, data }: { columnId: number; data: TaskInput }) =>
      tasksApi.create(boardId, columnId, data),
    onSuccess: (task) => {
      updateSnapshot(qc, boardId, (cols) =>
        cols.map((c) =>
          c.id === task.column_id ? { ...c, tasks: [...c.tasks, task] } : c,
        ),
      );
    },
  });
}

export function useUpdateTask(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: number;
      data: Partial<TaskInput>;
    }) => tasksApi.update(boardId, taskId, data),
    onSuccess: (task) => {
      updateSnapshot(qc, boardId, (cols) =>
        cols.map((c) => ({
          ...c,
          tasks: c.tasks.map((t) => (t.id === task.id ? task : t)),
        })),
      );
    },
  });
}

export function useDeleteTask(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => tasksApi.remove(boardId, taskId),
    onMutate: async (taskId) => {
      updateSnapshot(qc, boardId, (cols) =>
        cols.map((c) => ({
          ...c,
          tasks: c.tasks.filter((t) => t.id !== taskId),
        })),
      );
    },
  });
}

/**
 * Optimistic move: reorders the cache immediately, then syncs to the backend.
 * On error we refetch the snapshot to recover the authoritative ordering.
 */
export function useMoveTask(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      columnId,
      position,
    }: {
      taskId: number;
      columnId: number;
      position: number;
      // optimistic snapshot already applied by caller
    }) => tasksApi.move(boardId, taskId, columnId, position),
    onError: () => {
      qc.invalidateQueries({ queryKey: snapshotKey(boardId) });
    },
  });
}

// --- Labels ---
export function useCreateLabel(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color: string }) =>
      labelsApi.create(boardId, name, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: labelsKey(boardId) }),
  });
}

export function useDeleteLabel(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (labelId: number) => labelsApi.remove(boardId, labelId),
    onSuccess: () => {
      // The label list shrinks, and its chips were removed from tasks server-side
      // (FK cascade) — refetch the snapshot so those chips disappear locally too.
      qc.invalidateQueries({ queryKey: labelsKey(boardId) });
      qc.invalidateQueries({ queryKey: snapshotKey(boardId) });
    },
  });
}

export { updateSnapshot };
export type { Task };
