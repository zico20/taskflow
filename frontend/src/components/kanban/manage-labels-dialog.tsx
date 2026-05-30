"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { ApiRequestError } from "@/lib/api";
import { useCreateLabel, useDeleteLabel, useLabels } from "@/hooks/use-board";
import type { Label as LabelType } from "@/lib/types";

const COLORS = ["#58A6FF", "#3FB950", "#D29922", "#F85149", "#BC8CFF", "#39C5CF"];

export function ManageLabelsDialog({
  boardId,
  open,
  onClose,
}: {
  boardId: number;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const { data: labels = [] } = useLabels(boardId);
  const createLabel = useCreateLabel(boardId);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    createLabel.mutate(
      { name: value, color },
      {
        onSuccess: () => {
          toast.success(t("labels.created"));
          setName("");
          setColor(COLORS[0]);
        },
        onError: (err) => {
          const code = err instanceof ApiRequestError ? err.code : "";
          toast.error(
            t(code === "label_name_taken" ? "labels.nameTaken" : "labels.createError"),
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title={t("labels.title")} onClose={onClose} />
      <form onSubmit={submit}>
        <DialogBody>
          <div className="space-y-2">
            <Label htmlFor="label-name">{t("labels.create")}</Label>
            <div className="flex gap-2">
              <Input
                id="label-name"
                dir="auto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("labels.namePlaceholder")}
                maxLength={60}
                className="flex-1"
              />
              <Button type="submit" disabled={createLabel.isPending || !name.trim()}>
                {createLabel.isPending ? <Spinner /> : <Plus size={15} />}
                {t("labels.create")}
              </Button>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-fg-subtle">{t("labels.color")}</span>
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={cn(
                    "h-6 w-6 rounded-full transition-transform",
                    color === c
                      ? "ring-2 ring-fg ring-offset-2 ring-offset-bg-subtle scale-110"
                      : "hover:scale-110",
                  )}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {/* Existing labels */}
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-fg-muted">
              {t("labels.existing")}
            </p>
            {labels.length === 0 ? (
              <p className="text-sm text-fg-subtle">{t("labels.empty")}</p>
            ) : (
              <ul className="space-y-1.5">
                {labels.map((label) => (
                  <LabelRow key={label.id} boardId={boardId} label={label} />
                ))}
              </ul>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function LabelRow({ boardId, label }: { boardId: number; label: LabelType }) {
  const t = useT();
  const deleteLabel = useDeleteLabel(boardId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <li className="flex items-center gap-2.5 rounded-md px-1 py-1.5">
      <span
        className="rounded-full px-2.5 py-1 text-xs font-medium"
        style={{ backgroundColor: `${label.color}22`, color: label.color }}
      >
        {label.name}
      </span>
      <span className="flex-1" />
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        title={t("labels.delete")}
        aria-label={t("labels.delete")}
        className="rounded-md p-1.5 text-fg-subtle hover:bg-danger/15 hover:text-danger"
      >
        <Trash2 size={15} />
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title={t("labels.deleteConfirmTitle")}
        message={t("labels.deleteConfirm", { name: label.name })}
        confirmLabel={t("labels.delete")}
        cancelLabel={t("common.cancel")}
        destructive
        loading={deleteLabel.isPending}
        onConfirm={() =>
          deleteLabel.mutate(label.id, {
            onSuccess: () => {
              toast.success(t("labels.deleted"));
              setConfirmOpen(false);
            },
            onError: () => toast.error(t("labels.deleteError")),
          })
        }
        onCancel={() => setConfirmOpen(false)}
      />
    </li>
  );
}
