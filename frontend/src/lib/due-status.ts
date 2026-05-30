// Pure helper mapping a task's due date to a display status, evaluated against
// the viewer's local "today". No framework deps so it is trivially unit-tested.
import { differenceInCalendarDays, startOfDay } from "date-fns";

export type DueStatus = "overdue" | "today" | "upcoming" | "none";

export interface DueInfo {
  status: DueStatus;
  /** Days until due (>0) when status === "upcoming"; 0 otherwise. */
  days: number;
}

/**
 * Classify a due date relative to `now` (defaults to the current time at call
 * site; pass an explicit date in tests for determinism).
 */
export function dueInfo(
  dueDate: string | Date | null | undefined,
  now: Date = new Date(),
): DueInfo {
  if (!dueDate) return { status: "none", days: 0 };
  const due = startOfDay(new Date(dueDate));
  const today = startOfDay(now);
  const diff = differenceInCalendarDays(due, today);
  if (diff < 0) return { status: "overdue", days: 0 };
  if (diff === 0) return { status: "today", days: 0 };
  return { status: "upcoming", days: diff };
}
