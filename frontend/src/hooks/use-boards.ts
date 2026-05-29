"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardsApi } from "@/lib/endpoints";
import type { BoardSummary } from "@/lib/types";

const BOARDS_KEY = ["boards"] as const;

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
