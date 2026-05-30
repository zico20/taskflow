"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { Label as LabelType, Priority, Task } from "@/lib/types";
import {
  useCreateTask,
  useDeleteTask,
  useUpdateTask,
} from "@/hooks/use-board";

const schema = z.object({
  title: z.string().min(1, "task.titleRequired").max(255),
  description: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]),
});
type FormValues = z.infer<typeof schema>;

const PRIORITIES: Priority[] = ["low", "medium", "high"];

interface TaskDialogProps {
  boardId: number;
  open: boolean;
  onClose: () => void;
  // create mode: pass columnId; edit mode: pass task
  columnId?: number;
  task?: Task | null;
  labels: LabelType[];
}

export function TaskDialog({
  boardId,
  open,
  onClose,
  columnId,
  task,
  labels,
}: TaskDialogProps) {
  const t = useT();
  const isEdit = Boolean(task);
  const createTask = useCreateTask(boardId);
  const updateTask = useUpdateTask(boardId);
  const deleteTask = useDeleteTask(boardId);
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium" },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? "",
        description: task?.description ?? "",
        due_date: task?.due_date ? task.due_date.slice(0, 10) : "",
        priority: task?.priority ?? "medium",
      });
      setSelectedLabels(task?.labels.map((l) => l.id) ?? []);
    }
  }, [open, task, reset]);

  const toggleLabel = (id: number) =>
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const onSubmit = (values: FormValues) => {
    const payload = {
      title: values.title,
      description: values.description || null,
      due_date: values.due_date
        ? new Date(values.due_date).toISOString()
        : null,
      priority: values.priority,
      label_ids: selectedLabels,
    };

    if (isEdit && task) {
      updateTask.mutate(
        { taskId: task.id, data: payload },
        {
          onSuccess: () => {
            toast.success(t("task.updated"));
            onClose();
          },
          onError: () => toast.error(t("task.updateError")),
        },
      );
    } else if (columnId) {
      createTask.mutate(
        { columnId, data: payload },
        {
          onSuccess: () => {
            toast.success(t("task.created"));
            onClose();
          },
          onError: () => toast.error(t("task.createError")),
        },
      );
    }
  };

  const onDelete = () => {
    if (!task) return;
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        toast.success(t("task.deleted"));
        onClose();
      },
    });
  };

  const pending = createTask.isPending || updateTask.isPending;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title={isEdit ? t("task.edit") : t("task.new")} onClose={onClose}>
        {isEdit && (
          <button
            onClick={onDelete}
            className="rounded-md p-1 text-fg-subtle hover:bg-danger/15 hover:text-danger"
            title={t("task.delete")}
            aria-label={t("task.delete")}
          >
            <Trash2 size={16} />
          </button>
        )}
      </DialogHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{t("task.title")}</Label>
              <Input
                id="title"
                autoFocus
                placeholder={t("task.titlePlaceholder")}
                className="mt-1"
                {...register("title")}
              />
              <FieldError
                message={errors.title?.message ? t(errors.title.message) : undefined}
              />
            </div>

            <div>
              <Label htmlFor="description">
                {t("task.description")}{" "}
                <span className="text-fg-subtle">{t("task.descriptionHint")}</span>
              </Label>
              <Textarea
                id="description"
                placeholder={t("task.descriptionPlaceholder")}
                className="mt-1"
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="due_date">{t("task.dueDate")}</Label>
                <Input
                  id="due_date"
                  type="date"
                  className="mt-1"
                  {...register("due_date")}
                />
              </div>
              <div>
                <Label htmlFor="priority">{t("task.priority")}</Label>
                <select
                  id="priority"
                  className="mt-1 flex h-9 w-full rounded-md border border-border bg-bg-subtle px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  {...register("priority")}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {t(`priority.${p}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>{t("task.labels")}</Label>
              {labels.length === 0 ? (
                <p className="mt-1 text-xs text-fg-subtle">
                  {t("task.noLabels")}{" "}
                  <span className="text-fg-muted">{t("task.manageLabels")}</span>
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {labels.map((l) => {
                    const active = selectedLabels.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => toggleLabel(l.id)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-medium transition-all",
                          active ? "ring-2 ring-offset-1 ring-offset-bg-subtle" : "opacity-60",
                        )}
                        style={{
                          backgroundColor: `${l.color}22`,
                          color: l.color,
                          ...(active ? { boxShadow: `0 0 0 1px ${l.color}` } : {}),
                        }}
                      >
                        {l.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending && <Spinner />}
            {isEdit ? t("common.save") : t("task.create")}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
