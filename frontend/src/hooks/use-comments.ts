"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentsApi } from "@/lib/endpoints";
import type { Comment } from "@/lib/types";
import { commentsKey } from "./use-board";

export function useComments(boardId: number, taskId: number, enabled = true) {
  return useQuery<Comment[]>({
    queryKey: commentsKey(boardId, taskId),
    queryFn: () => commentsApi.list(boardId, taskId),
    enabled: enabled && Boolean(taskId),
  });
}

export function useCommentMutations(boardId: number, taskId: number) {
  const qc = useQueryClient();
  const key = commentsKey(boardId, taskId);

  const add = useMutation({
    mutationFn: (content: string) =>
      commentsApi.create(boardId, taskId, content),
    onSuccess: (comment) => {
      qc.setQueryData<Comment[]>(key, (prev) => [...(prev ?? []), comment]);
    },
  });

  const remove = useMutation({
    mutationFn: (commentId: number) =>
      commentsApi.remove(boardId, taskId, commentId).then(() => commentId),
    onSuccess: (commentId) => {
      qc.setQueryData<Comment[]>(key, (prev) =>
        (prev ?? []).filter((c) => c.id !== commentId),
      );
    },
  });

  return { add, remove };
}
