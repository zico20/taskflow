"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { Badge } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import type { Priority, Task } from "@/lib/types";

const PRIORITY_COLOR: Record<Priority, string> = {
  low: "#3FB950",
  medium: "#D29922",
  high: "#F85149",
};

export function TaskCardContent({ task }: { task: Task }) {
  const due = task.due_date ? new Date(task.due_date) : null;
  const overdue = due ? isPast(due) && !isToday(due) : false;

  return (
    <div className="rounded-md border border-border bg-bg-elevated p-3 shadow-sm transition-colors hover:border-accent/40">
      {task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.labels.map((l) => (
            <span
              key={l.id}
              className="h-1.5 w-7 rounded-full"
              style={{ backgroundColor: l.color }}
              title={l.name}
            />
          ))}
        </div>
      )}
      <p className="text-sm font-medium leading-snug text-fg">{task.title}</p>
      <div className="mt-2.5 flex items-center justify-between">
        <Badge color={PRIORITY_COLOR[task.priority]}>{task.priority}</Badge>
        {due && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px]",
              overdue ? "text-danger" : "text-fg-subtle",
            )}
          >
            <Calendar size={11} />
            {format(due, "MMM d")}
          </span>
        )}
      </div>
    </div>
  );
}

export function SortableTaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `task-${task.id}`, data: { type: "task", task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="cursor-grab touch-none active:cursor-grabbing"
    >
      <TaskCardContent task={task} />
    </div>
  );
}
