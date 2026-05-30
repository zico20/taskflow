"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardsApi } from "@/lib/endpoints";
import { boardKey } from "@/hooks/use-board";
import type { BoardDetail, BoardSummary } from "@/lib/types";

const BOARDS_KEY = ["boards"] as const;

type ManageRole = "editor" | "viewer";

export function useBoards() {
  return useQuery<BoardSummary[]>({
    queryKey: BOARDS_KEY,
    queryFn: boardsApi.list,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: boardsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOARDS_KEY });
    },
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => boardsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: BOARDS_KEY });
    },
  });
}

// --- Board settings / members ---

export function useUpdateBoard(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string; color?: string }) =>
      boardsApi.update(boardId, data),
    onSuccess: (updated) => {
      // Patch the board-detail cache and refresh the list.
      qc.setQueryData<BoardDetail>(boardKey(boardId), (prev) =>
        prev ? { ...prev, ...updated } : prev,
      );
      qc.invalidateQueries({ queryKey: BOARDS_KEY });
    },
  });
}

export function useInviteMember(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: ManageRole }) =>
      boardsApi.addMember(boardId, email, role),
    onSuccess: (member) => {
      qc.setQueryData<BoardDetail>(boardKey(boardId), (prev) =>
        prev ? { ...prev, members: [...prev.members, member] } : prev,
      );
    },
  });
}

export function useUpdateMemberRole(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: ManageRole }) =>
      boardsApi.updateMemberRole(boardId, userId, role),
    onSuccess: (member) => {
      qc.setQueryData<BoardDetail>(boardKey(boardId), (prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.map((m) =>
                m.user.id === member.user.id ? member : m,
              ),
            }
          : prev,
      );
    },
  });
}

export function useRemoveMember(boardId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => boardsApi.removeMember(boardId, userId),
    onSuccess: (_data, userId) => {
      qc.setQueryData<BoardDetail>(boardKey(boardId), (prev) =>
        prev
          ? { ...prev, members: prev.members.filter((m) => m.user.id !== userId) }
          : prev,
      );
    },
  });
}
