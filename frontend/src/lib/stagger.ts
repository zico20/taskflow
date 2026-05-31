// Pure helper: maps a list item's index to a small entrance animation delay (ms),
// capped so long lists don't feel sluggish. Used as an inline `animationDelay`.
// The global prefers-reduced-motion CSS block neutralizes the underlying
// animation, so no special motion handling is needed here.

export interface StaggerOptions {
  /** Per-item step in ms (default 40). */
  step?: number;
  /** Maximum total delay in ms (default 240). */
  cap?: number;
}

/** Delay in milliseconds for the item at `index`. */
export function staggerMs(index: number, opts: StaggerOptions = {}): number {
  const step = opts.step ?? 40;
  const cap = opts.cap ?? 240;
  if (!Number.isFinite(index) || index <= 0) return 0;
  return Math.min(Math.floor(index) * step, cap);
}

/** Convenience: a style object with the computed animationDelay. */
export function staggerStyle(
  index: number,
  opts?: StaggerOptions,
): { animationDelay: string } {
  return { animationDelay: `${staggerMs(index, opts)}ms` };
}
