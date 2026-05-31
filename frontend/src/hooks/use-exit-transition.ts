"use client";

import { useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Keeps a conditionally-rendered element mounted long enough to play a close
 * animation. Given `open`, returns `{ mounted, closing }`:
 *
 * - open false→true:  mounted=true, closing=false  (enter animation plays)
 * - open true→false:  closing=true, stays mounted for `durationMs`, then unmounts
 * - reopened mid-close: the pending unmount is cancelled (no stuck overlay)
 * - reduced motion:    unmount is immediate (duration treated as 0)
 *
 * Render only when `mounted`; apply your exit class while `closing`.
 */
export function useExitTransition(open: boolean, durationMs = 160) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }

    // Closing.
    if (!mounted) return; // already unmounted, nothing to animate
    const d = prefersReducedMotion() ? 0 : durationMs;
    setClosing(true);
    timer.current = setTimeout(() => {
      setMounted(false);
      setClosing(false);
      timer.current = null;
    }, d);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
    // `mounted` intentionally excluded: we only react to `open`/`durationMs`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, durationMs]);

  return { mounted, closing };
}
