"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { useCreateColumn } from "@/hooks/use-board";

export function AddColumnDialog({
  boardId,
  open,
  onClose,
}: {
  boardId: number;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const createColumn = useCreateColumn(boardId);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createColumn.mutate(trimmed, {
      onSuccess: () => {
        toast.success(t("column.created"));
        setName("");
        onClose();
      },
      onError: () => toast.error(t("column.createError")),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} className="max-w-sm">
      <DialogHeader title={t("addColumn.title")} onClose={onClose} />
      <DialogBody>
        <Label htmlFor="col-name">{t("addColumn.name")}</Label>
        <Input
          id="col-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("addColumn.placeholder")}
          className="mt-1"
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button onClick={submit} loading={createColumn.isPending}>
          {t("common.add")}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
