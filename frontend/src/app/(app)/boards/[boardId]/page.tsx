"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ListTodo,
  Plus,
  Search,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, FullPageSpinner } from "@/components/ui/misc";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { TaskDialog } from "@/components/kanban/task-dialog";
import { AddColumnDialog } from "@/components/kanban/add-column-dialog";
import { ActivityFeed } from "@/components/kanban/activity-feed";
import { PresenceBar } from "@/components/kanban/presence-bar";
import {
  useBoardDetail,
  useBoardSnapshot,
  useLabels,
} from "@/hooks/use-board";
import { useBoardSocket } from "@/hooks/use-board-socket";
import { useCurrentUser } from "@/hooks/use-auth";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { activityApi } from "@/lib/endpoints";
import { useUiStore } from "@/stores/ui-store";
import type { ColumnWithTasks, Task } from "@/lib/types";

export default function BoardPage() {
  const params = useParams<{ boardId: string }>();
  const boardId = Number(params.boardId);

  const { data: user } = useCurrentUser();
  const { data: board, isLoading: boardLoading, isError } =
    useBoardDetail(boardId);
  const { data: snapshot, isLoading: snapLoading } =
    useBoardSnapshot(boardId);
  const { data: labels = [] } = useLabels(boardId);
  const { data: initialActivity = [] } = useQuery({
    queryKey: ["board", boardId, "activity"],
    queryFn: () => activityApi.list(boardId),
  });

  const { connected, viewers, activity } = useBoardSocket(
    boardId,
    user?.id,
    initialActivity,
  );

  const canEdit = board?.role === "owner" || board?.role === "editor";

  // Client UI state (Zustand) — activity panel visibility, persisted locally.
  const activityPanelOpen = useUiStore((s) => s.activityPanelOpen);
  const toggleActivityPanel = useUiStore((s) => s.toggleActivityPanel);

  // Dialog state
  const [search, setSearch] = useState("");
  const [taskDialog, setTaskDialog] = useState<{
    columnId?: number;
    task?: Task | null;
  } | null>(null);
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts({
    onNewTask: () => {
      const firstCol = snapshot?.columns[0];
      if (canEdit && firstCol) setTaskDialog({ columnId: firstCol.id });
    },
    onFocusSearch: () => searchRef.current?.focus(),
  });

  // Apply search filter to the columns (title/label match).
  const filteredColumns: ColumnWithTasks[] = useMemo(() => {
    if (!snapshot) return [];
    const q = search.trim().toLowerCase();
    if (!q) return snapshot.columns;
    return snapshot.columns.map((c) => ({
      ...c,
      tasks: c.tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.labels.some((l) => l.name.toLowerCase().includes(q)),
      ),
    }));
  }, [snapshot, search]);

  if (boardLoading || snapLoading) return <FullPageSpinner />;

  if (isError || !board) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={<ListTodo size={22} />}
          title="Board not found"
          description="This board doesn't exist or you don't have access to it."
          action={
            <Link href="/boards">
              <Button variant="secondary">Back to boards</Button>
            </Link>
          }
        />
      </main>
    );
  }

  const hasColumns = (snapshot?.columns.length ?? 0) > 0;

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-[100rem] flex-col px-4 py-4">
      {/* Board header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/boards"
            className="rounded-md p-1.5 text-fg-subtle hover:bg-bg-muted hover:text-fg"
          >
            <ArrowLeft size={18} />
          </Link>
          <span
            className="h-5 w-1.5 rounded-full"
            style={{ backgroundColor: board.color }}
          />
          <div>
            <h1 className="text-lg font-semibold text-fg">{board.name}</h1>
            {board.description && (
              <p className="text-xs text-fg-subtle">{board.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle"
            />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks… ( / )"
              className="h-9 w-44 pl-8"
            />
          </div>
          <PresenceBar viewers={viewers} connected={connected} />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleActivityPanel}
            title={activityPanelOpen ? "Hide activity" : "Show activity"}
            className="hidden lg:inline-flex"
          >
            {activityPanelOpen ? (
              <PanelRightClose size={16} />
            ) : (
              <PanelRightOpen size={16} />
            )}
          </Button>
        </div>
      </div>

      {/* Body: board + activity sidebar */}
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="min-w-0 flex-1">
          {!hasColumns ? (
            <EmptyState
              icon={<ListTodo size={22} />}
              title="No columns yet"
              description="Add a column to start tracking tasks."
              action={
                canEdit && (
                  <Button onClick={() => setAddColumnOpen(true)}>
                    <Plus size={16} /> Add column
                  </Button>
                )
              }
            />
          ) : (
            <KanbanBoard
              boardId={boardId}
              columns={filteredColumns}
              canEdit={!!canEdit}
              labels={labels}
              onAddTask={(columnId) => setTaskDialog({ columnId })}
              onOpenTask={(task) => setTaskDialog({ task })}
              onAddColumn={() => setAddColumnOpen(true)}
            />
          )}
        </div>

        {activityPanelOpen && (
          <aside className="hidden w-72 shrink-0 overflow-hidden rounded-lg border border-border bg-bg-subtle/40 p-3 lg:block">
            <ActivityFeed entries={activity} />
          </aside>
        )}
      </div>

      {/* Dialogs */}
      {taskDialog && (
        <TaskDialog
          boardId={boardId}
          open
          onClose={() => setTaskDialog(null)}
          columnId={taskDialog.columnId}
          task={taskDialog.task}
          labels={labels}
        />
      )}
      <AddColumnDialog
        boardId={boardId}
        open={addColumnOpen}
        onClose={() => setAddColumnOpen(false)}
      />
    </div>
  );
}
