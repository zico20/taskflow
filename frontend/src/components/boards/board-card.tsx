"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ListChecks, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteBoard } from "@/hooks/use-boards";
import type { BoardSummary } from "@/lib/types";

export function BoardCard({ board }: { board: BoardSummary }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteBoard = useDeleteBoard();
  const isOwner = board.role === "owner";

  const handleDelete = () => {
    deleteBoard.mutate(board.id, {
      onSuccess: () => {
        toast.success("Board deleted");
        setConfirmOpen(false);
      },
      onError: () => toast.error("Couldn't delete the board"),
    });
  };

  return (
    <>
      <Link
        href={`/boards/${board.id}`}
        className="group relative block overflow-hidden rounded-lg border border-border bg-bg-subtle p-5 transition-colors hover:border-accent/50 animate-fade-in"
      >
        <span
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: board.color }}
        />
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-fg group-hover:text-accent">
            {board.name}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {board.role && (
              <Badge className="bg-bg-muted text-fg-subtle">{board.role}</Badge>
            )}
            {isOwner && (
              <button
                type="button"
                onClick={(e) => {
                  // Don't navigate — open the confirm dialog instead.
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmOpen(true);
                }}
                title="Delete board"
                aria-label="Delete board"
                className="rounded-md p-1 text-fg-subtle opacity-0 transition-all hover:bg-danger/15 hover:text-danger focus:opacity-100 group-hover:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {board.description && (
          <p className="mt-1 line-clamp-2 text-sm text-fg-muted">
            {board.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-fg-subtle">
          <span className="inline-flex items-center gap-1">
            <ListChecks size={13} />
            {board.task_count} task{board.task_count === 1 ? "" : "s"}
          </span>
          <span>
            {formatDistanceToNow(new Date(board.updated_at), {
              addSuffix: true,
            })}
          </span>
        </div>
      </Link>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete board"
        message={`Delete "${board.name}"? This permanently removes all its columns, tasks, and activity. This cannot be undone.`}
        confirmLabel="Delete board"
        destructive
        loading={deleteBoard.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
