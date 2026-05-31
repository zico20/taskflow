import { Skeleton } from "@/components/ui/skeleton";

/**
 * Line-shaped skeletons for the task dialog's checklist and comments sections.
 * `variant` tweaks the row shape (a small checkbox box for checklist, an avatar
 * circle for comments).
 */
export function ThreadSkeleton({
  rows = 3,
  variant = "checklist",
}: {
  rows?: number;
  variant?: "checklist" | "comments";
}) {
  return (
    <div className="space-y-2.5" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          {variant === "comments" ? (
            <Skeleton className="h-[26px] w-[26px] shrink-0 rounded-full" />
          ) : (
            <Skeleton className="h-4 w-4 shrink-0 rounded" />
          )}
          {/* Vary widths so it reads as text lines, not bars. */}
          <Skeleton className={i % 2 === 0 ? "h-4 w-3/4" : "h-4 w-1/2"} />
        </div>
      ))}
    </div>
  );
}
