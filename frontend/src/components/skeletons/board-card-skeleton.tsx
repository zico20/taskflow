import { Skeleton } from "@/components/ui/skeleton";

/** A single board-card-shaped skeleton (matches BoardCard's box + padding). */
function BoardCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-bg-subtle p-5 shadow-glass-sm">
      <span className="absolute inset-x-0 top-0 h-1.5 bg-bg-muted" />
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-3.5 w-full" />
      <Skeleton className="mt-1.5 h-3.5 w-2/3" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/**
 * Boards-grid skeleton — mirrors the real grid's columns/gap so swapping to
 * content causes no layout shift.
 */
export function BoardsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <BoardCardSkeleton key={i} />
      ))}
    </div>
  );
}
