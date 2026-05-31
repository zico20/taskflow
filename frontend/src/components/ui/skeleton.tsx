import { cn } from "@/lib/utils";

/**
 * A content placeholder block with a subtle shimmer (see `.skeleton` in
 * globals.css). Shape it with `className` (height/width/rounded). Under
 * prefers-reduced-motion / reduced-transparency it degrades to a flat,
 * legible block automatically.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}
