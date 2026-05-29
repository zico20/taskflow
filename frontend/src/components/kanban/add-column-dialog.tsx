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
import { Spinner } from "@/components/ui/misc";
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
  const [name, setName] = useState("");
  const createColumn = useCreateColumn(boardId);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createColumn.mutate(trimmed, {
      onSuccess: () => {
        toast.success("Column added");
        setName("");
        onClose();
      },
      onError: () => toast.error("Couldn't add the column"),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} className="max-w-sm">
      <DialogHeader title="Add column" onClose={onClose} />
      <DialogBody>
        <Label htmlFor="col-name">Column name</Label>
        <Input
          id="col-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. Backlog"
          className="mt-1"
        />
      </DialogBody>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={createColumn.isPending}>
          {createColumn.isPending && <Spinner />}
          Add
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
