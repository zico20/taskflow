import { Skeleton } from "@/components/ui/skeleton";

/** A task-card-shaped skeleton (matches TaskCardContent's box + padding). */
function TaskCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-3 shadow-glass-sm">
      <Skeleton className="h-4 w-4/5" />
      <div className="mt-2.5 flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
    </div>
  );
}

/** A column-shaped skeleton (matches KanbanColumn's width + spacing). */
function ColumnSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="flex h-full w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-6 rounded-full" />
      </div>
      <div className="flex flex-1 flex-col gap-2 rounded-xl border border-transparent bg-bg-subtle/60 p-2">
        {Array.from({ length: cards }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Board-snapshot skeleton — a few columns each with a few task cards, matching
 * the kanban board's footprint so content swaps in without a jump.
 */
export function BoardSnapshotSkeleton() {
  const columns = [3, 2, 4];
  return (
    <div className="flex h-full gap-4 overflow-x-hidden pb-4">
      {columns.map((cards, i) => (
        <ColumnSkeleton key={i} cards={cards} />
      ))}
    </div>
  );
}
