"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ListChecks, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDeleteBoard } from "@/hooks/use-boards";
import { useLocale, useT, useTCount, dateFnsLocale } from "@/lib/i18n";
import type { BoardSummary, BoardRole } from "@/lib/types";

const ROLE_KEY: Record<BoardRole, "boards.role.owner" | "boards.role.editor" | "boards.role.viewer"> = {
  owner: "boards.role.owner",
  editor: "boards.role.editor",
  viewer: "boards.role.viewer",
};

export function BoardCard({ board }: { board: BoardSummary }) {
  const t = useT();
  const tc = useTCount();
  const { locale } = useLocale();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteBoard = useDeleteBoard();
  const isOwner = board.role === "owner";

  const handleDelete = () => {
    deleteBoard.mutate(board.id, {
      onSuccess: () => {
        toast.success(t("deleteBoard.success"));
        setConfirmOpen(false);
      },
      onError: () => toast.error(t("deleteBoard.error")),
    });
  };

  return (
    <>
      <Link
        href={`/boards/${board.id}`}
        className="group relative block overflow-hidden rounded-xl border border-border bg-bg-subtle p-5 shadow-glass-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 animate-fade-in"
      >
        <span
          className="absolute inset-x-0 top-0 h-1.5"
          style={{ backgroundColor: board.color }}
        />
        <div className="flex items-start justify-between gap-2">
          <h3 dir="auto" className="font-semibold text-fg group-hover:text-accent">
            {board.name}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {board.role && (
              <Badge className="glass-clear text-fg-muted">
                {t(ROLE_KEY[board.role])}
              </Badge>
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
                title={t("deleteBoard.title")}
                aria-label={t("deleteBoard.title")}
                className="rounded-md p-1 text-fg-subtle opacity-0 transition-all hover:bg-danger/15 hover:text-danger focus:opacity-100 group-hover:opacity-100"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {board.description && (
          <p dir="auto" className="mt-1 line-clamp-2 text-sm text-fg-muted">
            {board.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between text-xs text-fg-subtle">
          <span className="inline-flex items-center gap-1">
            <ListChecks size={13} />
            {tc("boards.card.tasks", board.task_count)}
          </span>
          <span>
            {formatDistanceToNow(new Date(board.updated_at), {
              addSuffix: true,
              locale: dateFnsLocale(locale),
            })}
          </span>
        </div>
      </Link>

      <ConfirmDialog
        open={confirmOpen}
        title={t("deleteBoard.title")}
        message={t("deleteBoard.message", { name: board.name })}
        confirmLabel={t("deleteBoard.confirm")}
        destructive
        loading={deleteBoard.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
