"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checklistApi } from "@/lib/endpoints";
import type { ChecklistItem } from "@/lib/types";
import {
  checklistKey,
  snapshotKey,
  updateSnapshot,
} from "./use-board";

export function useChecklist(boardId: number, taskId: number, enabled = true) {
  return useQuery<ChecklistItem[]>({
    queryKey: checklistKey(boardId, taskId),
    queryFn: () => checklistApi.list(boardId, taskId),
    enabled: enabled && Boolean(taskId),
  });
}

/** Recompute a task's checklist counts on the board card from its item list. */
function patchCardCounts(
  qc: ReturnType<typeof useQueryClient>,
  boardId: number,
  taskId: number,
  items: ChecklistItem[],
) {
  const total = items.length;
  const done = items.filter((i) => i.is_done).length;
  updateSnapshot(qc, boardId, (cols) =>
    cols.map((c) => ({
      ...c,
      tasks: c.tasks.map((t) =>
        t.id === taskId
          ? { ...t, checklist_total: total, checklist_done: done }
          : t,
      ),
    })),
  );
}

export function useChecklistMutations(boardId: number, taskId: number) {
  const qc = useQueryClient();
  const key = checklistKey(boardId, taskId);

  const refresh = (items: ChecklistItem[]) => {
    qc.setQueryData<ChecklistItem[]>(key, items);
    patchCardCounts(qc, boardId, taskId, items);
  };

  const add = useMutation({
    mutationFn: (content: string) =>
      checklistApi.create(boardId, taskId, content),
    onSuccess: (item) => {
      const items = [...(qc.getQueryData<ChecklistItem[]>(key) ?? []), item];
      refresh(items);
    },
  });

  const toggle = useMutation({
    mutationFn: ({ itemId, is_done }: { itemId: number; is_done: boolean }) =>
      checklistApi.update(boardId, taskId, itemId, { is_done }),
    onSuccess: (item) => {
      const items = (qc.getQueryData<ChecklistItem[]>(key) ?? []).map((i) =>
        i.id === item.id ? item : i,
      );
      refresh(items);
    },
  });

  const edit = useMutation({
    mutationFn: ({ itemId, content }: { itemId: number; content: string }) =>
      checklistApi.update(boardId, taskId, itemId, { content }),
    onSuccess: (item) => {
      const items = (qc.getQueryData<ChecklistItem[]>(key) ?? []).map((i) =>
        i.id === item.id ? item : i,
      );
      refresh(items);
    },
  });

  const remove = useMutation({
    mutationFn: (itemId: number) =>
      checklistApi.remove(boardId, taskId, itemId).then(() => itemId),
    onSuccess: (itemId) => {
      const items = (qc.getQueryData<ChecklistItem[]>(key) ?? []).filter(
        (i) => i.id !== itemId,
      );
      refresh(items);
    },
  });

  const reorder = useMutation({
    mutationFn: (itemIds: number[]) =>
      checklistApi.reorder(boardId, taskId, itemIds),
    onMutate: (itemIds) => {
      // Optimistic reorder of the open list.
      const current = qc.getQueryData<ChecklistItem[]>(key) ?? [];
      const byId = new Map(current.map((i) => [i.id, i]));
      const next = itemIds
        .map((id) => byId.get(id))
        .filter((i): i is ChecklistItem => Boolean(i));
      qc.setQueryData<ChecklistItem[]>(key, next);
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: key });
    },
    onSuccess: (items) => qc.setQueryData<ChecklistItem[]>(key, items),
  });

  return { add, toggle, edit, remove, reorder };
}

export { snapshotKey };
