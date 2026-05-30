"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Avatar, Spinner } from "@/components/ui/misc";
import { useT, useLocale, dateFnsLocale } from "@/lib/i18n";
import { useComments, useCommentMutations } from "@/hooks/use-comments";

interface CommentsThreadProps {
  boardId: number;
  taskId: number;
  canEdit: boolean;
  isOwner: boolean;
  currentUserId: number | undefined;
}

export function CommentsThread({
  boardId,
  taskId,
  canEdit,
  isOwner,
  currentUserId,
}: CommentsThreadProps) {
  const t = useT();
  const { locale } = useLocale();
  const { data: comments = [], isLoading } = useComments(boardId, taskId);
  const { add, remove } = useCommentMutations(boardId, taskId);
  const [draft, setDraft] = useState("");

  const submit = () => {
    const value = draft.trim();
    if (!value) return;
    add.mutate(value, {
      onSuccess: () => setDraft(""),
      onError: () => toast.error(t("comments.postError")),
    });
  };

  return (
    <section className="space-y-2.5">
      <h3 className="text-[13px] font-semibold text-fg">{t("comments.title")}</h3>

      {isLoading ? (
        <div className="py-2">
          <Spinner className="text-accent" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-fg-subtle">{t("comments.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const canDelete = isOwner || c.author.id === currentUserId;
            return (
              <li key={c.id} className="flex gap-2.5">
                <Avatar
                  name={c.author.name}
                  src={c.author.avatar_url}
                  size={26}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[12.5px] font-semibold text-fg">
                      {c.author.name}
                    </span>
                    <span className="text-[11px] text-fg-subtle">
                      {formatDistanceToNow(new Date(c.created_at), {
                        addSuffix: true,
                        locale: dateFnsLocale(locale),
                      })}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() =>
                          remove.mutate(c.id, {
                            onSuccess: () => toast.success(t("comments.deleted")),
                          })
                        }
                        aria-label={t("comments.delete")}
                        className="ms-auto rounded p-1 text-fg-subtle hover:bg-danger/15 hover:text-danger"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p
                    dir="auto"
                    className="whitespace-pre-wrap break-words text-sm text-fg-muted"
                  >
                    {c.content}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canEdit ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={t("comments.placeholder")}
            className="min-h-[64px] text-sm"
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={submit}
              disabled={add.isPending || !draft.trim()}
            >
              {add.isPending ? <Spinner /> : <Send size={14} />}
              {t("comments.post")}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-fg-subtle">{t("comments.readOnly")}</p>
      )}
    </section>
  );
}
