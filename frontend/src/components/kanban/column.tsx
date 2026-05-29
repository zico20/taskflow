"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SortableTaskCard } from "./task-card";
import type { ColumnWithTasks, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  column: ColumnWithTasks;
  canEdit: boolean;
  onAddTask: (columnId: number) => void;
  onOpenTask: (task: Task) => void;
  onRename: (columnId: number, name: string) => void;
  onDelete: (columnId: number) => void;
}

export function KanbanColumn({
  column,
  canEdit,
  onAddTask,
  onOpenTask,
  onRename,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", columnId: column.id },
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column.name);

  const saveName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== column.name) onRename(column.id, trimmed);
    setEditing(false);
  };

  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        {editing ? (
          <div className="flex flex-1 items-center gap-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") {
                  setName(column.name);
                  setEditing(false);
                }
              }}
              className="h-7 text-sm"
              autoFocus
            />
            <button onClick={saveName} className="text-success">
              <Check size={15} />
            </button>
            <button
              onClick={() => {
                setName(column.name);
                setEditing(false);
              }}
              className="text-fg-subtle"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-fg">{column.name}</h3>
            <span className="rounded-full bg-bg-muted px-1.5 text-xs text-fg-subtle">
              {column.tasks.length}
            </span>
          </div>
        )}

        {canEdit && !editing && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 120)}
              className="rounded p-1 text-fg-subtle hover:bg-bg-muted hover:text-fg"
              aria-label="Column options"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-md border border-border bg-bg-elevated py-1 shadow-xl animate-fade-in">
                <button
                  onMouseDown={() => setEditing(true)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-fg-muted hover:bg-bg-muted hover:text-fg"
                >
                  <Pencil size={13} /> Rename
                </button>
                <button
                  onMouseDown={() => onDelete(column.id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-danger hover:bg-danger/10"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[60px] flex-1 flex-col gap-2 overflow-y-auto rounded-lg border border-transparent bg-bg-subtle/50 p-2 transition-colors",
          isOver && "border-accent/40 bg-bg-subtle",
        )}
      >
        <SortableContext
          items={column.tasks.map((t) => `task-${t.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onClick={() => onOpenTask(task)}
            />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <p className="px-1 py-3 text-center text-xs text-fg-subtle">
            No tasks
          </p>
        )}
      </div>

      {canEdit && (
        <button
          onClick={() => onAddTask(column.id)}
          className="mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-fg-subtle transition-colors hover:bg-bg-muted hover:text-fg"
        >
          <Plus size={15} /> Add task
        </button>
      )}
    </div>
  );
}
