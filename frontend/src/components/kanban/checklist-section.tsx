"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThreadSkeleton } from "@/components/skeletons/thread-skeleton";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useChecklist, useChecklistMutations } from "@/hooks/use-checklist";
import type { ChecklistItem } from "@/lib/types";

interface ChecklistSectionProps {
  boardId: number;
  taskId: number;
  canEdit: boolean;
}

export function ChecklistSection({
  boardId,
  taskId,
  canEdit,
}: ChecklistSectionProps) {
  const t = useT();
  const { data: items = [], isLoading } = useChecklist(boardId, taskId);
  const { add, toggle, edit, remove, reorder } = useChecklistMutations(
    boardId,
    taskId,
  );
  const [draft, setDraft] = useState("");

  const total = items.length;
  const done = items.filter((i) => i.is_done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => `cli-${i.id}` === active.id);
    const newIndex = items.findIndex((i) => `cli-${i.id}` === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex);
    reorder.mutate(next.map((i) => i.id));
  };

  const submitDraft = () => {
    const value = draft.trim();
    if (!value) return;
    add.mutate(value, { onSuccess: () => setDraft("") });
  };

  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        <h3 className="text-[13px] font-semibold text-fg">
          {t("checklist.title")}
        </h3>
        {total > 0 && (
          <span className="text-[11.5px] tabular-nums text-fg-subtle">
            {t("checklist.progress", { done, total })}
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {isLoading ? (
        <ThreadSkeleton rows={3} variant="checklist" />
      ) : total === 0 ? (
        <p className="text-xs text-fg-subtle">{t("checklist.empty")}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={items.map((i) => `cli-${i.id}`)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-1">
              {items.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  canEdit={canEdit}
                  onToggle={() =>
                    toggle.mutate({ itemId: item.id, is_done: !item.is_done })
                  }
                  onEdit={(content) => edit.mutate({ itemId: item.id, content })}
                  onDelete={() => remove.mutate(item.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {canEdit ? (
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitDraft();
              }
            }}
            placeholder={t("checklist.addPlaceholder")}
            className="h-8 flex-1 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={submitDraft}
            loading={add.isPending}
            disabled={!draft.trim()}
          >
            {!add.isPending && <Plus size={14} />}
            {t("checklist.add")}
          </Button>
        </div>
      ) : (
        <p className="text-[11px] text-fg-subtle">{t("checklist.readOnly")}</p>
      )}
    </section>
  );
}

function ChecklistRow({
  item,
  canEdit,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: ChecklistItem;
  canEdit: boolean;
  onToggle: () => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
}) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.content);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `cli-${item.id}`, disabled: !canEdit });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const commitEdit = () => {
    const next = value.trim();
    if (next && next !== item.content) onEdit(next);
    else setValue(item.content);
    setEditing(false);
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-bg-muted/60"
    >
      {canEdit && (
        <button
          type="button"
          className="cursor-grab text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing motion-reduce:transition-none"
          aria-label={t("checklist.itemLabel")}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
      )}
      <button
        type="button"
        onClick={onToggle}
        disabled={!canEdit}
        aria-label={item.is_done ? t("checklist.toggleUndone") : t("checklist.toggleDone")}
        aria-pressed={item.is_done}
        className={cn(
          "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors motion-reduce:transition-none",
          item.is_done
            ? "border-accent bg-accent text-bg"
            : "border-border hover:border-accent/60",
          !canEdit && "cursor-default",
        )}
      >
        {item.is_done && <Check size={11} strokeWidth={3} />}
      </button>

      {editing ? (
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitEdit();
            } else if (e.key === "Escape") {
              setValue(item.content);
              setEditing(false);
            }
          }}
          className="h-7 flex-1 text-sm"
        />
      ) : (
        <span
          dir="auto"
          onDoubleClick={() => canEdit && setEditing(true)}
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            item.is_done ? "text-fg-subtle line-through" : "text-fg",
          )}
        >
          {item.content}
        </span>
      )}

      {canEdit && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={t("checklist.delete")}
          className="flex-shrink-0 rounded p-1 text-fg-subtle opacity-0 transition-opacity hover:bg-danger/15 hover:text-danger group-hover:opacity-100 motion-reduce:transition-none"
        >
          <Trash2 size={13} />
        </button>
      )}
    </li>
  );
}
