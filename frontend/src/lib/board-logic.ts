import type { ColumnWithTasks } from "./types";

/** Find the column that currently contains a given task id. */
export function findColumnOfTask(
  cols: ColumnWithTasks[],
  taskId: number,
): ColumnWithTasks | undefined {
  return cols.find((c) => c.tasks.some((t) => t.id === taskId));
}

/**
 * Move a task to a target column at a target index, returning new columns.
 * Pure helper mirroring the optimistic behaviour used during drag-and-drop;
 * keeping it pure makes the ordering logic unit-testable.
 */
export function moveTaskInColumns(
  cols: ColumnWithTasks[],
  taskId: number,
  toColumnId: number,
  toIndex: number,
): ColumnWithTasks[] {
  const fromCol = findColumnOfTask(cols, taskId);
  if (!fromCol) return cols;
  const task = fromCol.tasks.find((t) => t.id === taskId);
  if (!task) return cols;

  // Remove from source.
  const withoutTask = cols.map((c) =>
    c.id === fromCol.id
      ? { ...c, tasks: c.tasks.filter((t) => t.id !== taskId) }
      : c,
  );

  // Insert into target at the clamped index.
  return withoutTask.map((c) => {
    if (c.id !== toColumnId) return c;
    const clamped = Math.max(0, Math.min(toIndex, c.tasks.length));
    const next = [...c.tasks];
    next.splice(clamped, 0, { ...task, column_id: toColumnId });
    return { ...c, tasks: next };
  });
}
