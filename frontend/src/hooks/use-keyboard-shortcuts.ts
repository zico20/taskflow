"use client";

import { useEffect } from "react";

interface Shortcuts {
  onNewTask?: () => void;
  onFocusSearch?: () => void;
}

/** Returns true if the event originated from an editable element. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

/**
 * Global keyboard shortcuts for the board view:
 *   n -> new task, / -> focus search.
 * Esc is handled by the Dialog component itself.
 */
export function useKeyboardShortcuts({
  onNewTask,
  onFocusSearch,
}: Shortcuts) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n") {
        e.preventDefault();
        onNewTask?.();
      } else if (e.key === "/") {
        e.preventDefault();
        onFocusSearch?.();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onNewTask, onFocusSearch]);
}
