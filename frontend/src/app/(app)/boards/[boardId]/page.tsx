"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  ListTodo,
  Plus,
  Search,
  Settings,
  Tags,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, FullPageSpinner } from "@/components/ui/misc";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { BoardFilterBar } from "@/components/kanban/board-filter-bar";
import { TaskDialog } from "@/components/kanban/task-dialog";
import { AddColumnDialog } from "@/components/kanban/add-column-dialog";
import { ActivityDrawer } from "@/components/kanban/activity-drawer";
import { PresenceBar } from "@/components/kanban/presence-bar";
import { BoardSettingsDialog } from "@/components/boards/board-settings-dialog";
import { ManageLabelsDialog } from "@/components/kanban/manage-labels-dialog";
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
import { useBoardViewStore } from "@/stores/board-view-store";
import { applyView, EMPTY_VIEW } from "@/lib/task-filter-sort";
import { useT } from "@/lib/i18n";
import type { ColumnWithTasks, Task } from "@/lib/types";

export default function BoardPage() {
  const t = useT();
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
  const isOwner = board?.role === "owner";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcuts({
    onNewTask: () => {
      const firstCol = snapshot?.columns[0];
      if (canEdit && firstCol) setTaskDialog({ columnId: firstCol.id });
    },
    onFocusSearch: () => searchRef.current?.focus(),
  });

  // Client-only filter/sort view state (Zustand), keyed by this board.
  const view = useBoardViewStore((s) => s.byBoard[boardId]) ?? EMPTY_VIEW;
  const dragEnabled = view.sort === "manual";

  // Apply text search + filters + sort to the columns (presentation only).
  const filteredColumns: ColumnWithTasks[] = useMemo(() => {
    if (!snapshot) return [];
    return applyView(snapshot.columns, view, search);
  }, [snapshot, search, view]);

  if (boardLoading || snapLoading) return <FullPageSpinner />;

  if (isError || !board) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20">
        <EmptyState
          icon={<ListTodo size={22} />}
          title={t("board.notFound.title")}
          description={t("board.notFound.desc")}
          action={
            <Link href="/boards">
              <Button variant="secondary">{t("board.notFound.back")}</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const hasColumns = (snapshot?.columns.length ?? 0) > 0;

  return (
    <>
      {/* Context header */}
      <header className="flex h-[60px] flex-shrink-0 items-center gap-2.5 border-b border-border/60 px-4 sm:gap-3.5 sm:px-6">
        <nav className="flex items-center gap-2 text-[12.5px] text-fg-subtle max-sm:hidden">
          <Link href="/boards" className="transition-colors hover:text-fg">
            {t("nav.boards")}
          </Link>
          <ChevronRight size={13} className="rtl:rotate-180" />
        </nav>
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
          style={{ backgroundColor: board.color }}
        />
        <h1
          dir="auto"
          className="min-w-0 truncate text-[17px] font-bold tracking-tight text-fg"
        >
          {board.name}
        </h1>

        <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1">
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLabelsOpen(true)}
              title={t("labels.title")}
            >
              <Tags size={16} />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleActivityPanel}
            title={
              activityPanelOpen
                ? t("board.activity.toggleHide")
                : t("board.activity.toggleShow")
            }
          >
            <Activity size={16} />
          </Button>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              title={t("board.settings")}
            >
              <Settings size={16} />
            </Button>
          )}
        </div>
      </header>

      {/* Toolbar row: search + presence */}
      <div className="flex flex-shrink-0 items-center gap-3 px-4 pt-4 sm:px-6 sm:pt-5">
        <div className="relative min-w-0 flex-1 sm:flex-none">
          <Search
            size={14}
            className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-fg-subtle"
          />
          <Input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("board.search")}
            className="w-full ps-8 sm:w-56"
          />
        </div>
        <div className="hidden flex-1 sm:block" />
        <PresenceBar viewers={viewers} connected={connected} />
      </div>

      {/* Filter & sort bar (additive; below the toolbar). */}
      {hasColumns && (
        <div className="flex-shrink-0 px-4 pt-3 sm:px-6">
          <BoardFilterBar boardId={boardId} labels={labels} />
        </div>
      )}

      {/* Kanban surface (full width) */}
      <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 sm:px-6 sm:py-5">
        {!hasColumns ? (
          <EmptyState
            icon={<ListTodo size={22} />}
            title={t("board.empty.title")}
            description={t("board.empty.desc")}
            action={
              canEdit && (
                <Button onClick={() => setAddColumnOpen(true)}>
                  <Plus size={16} /> {t("board.addColumn")}
                </Button>
              )
            }
          />
        ) : (
          <KanbanBoard
            boardId={boardId}
            columns={filteredColumns}
            canEdit={!!canEdit}
            dragEnabled={dragEnabled}
            labels={labels}
            onAddTask={(columnId) => setTaskDialog({ columnId })}
            onOpenTask={(task) => setTaskDialog({ task })}
            onAddColumn={() => setAddColumnOpen(true)}
          />
        )}
      </div>

      {/* Activity drawer (slide-over) */}
      <ActivityDrawer
        open={activityPanelOpen}
        onClose={toggleActivityPanel}
        entries={activity}
      />

      {/* Dialogs */}
      {taskDialog && (
        <TaskDialog
          boardId={boardId}
          open
          onClose={() => setTaskDialog(null)}
          columnId={taskDialog.columnId}
          task={taskDialog.task}
          labels={labels}
          canEdit={!!canEdit}
          isOwner={isOwner}
          currentUserId={user?.id}
        />
      )}
      <AddColumnDialog
        boardId={boardId}
        open={addColumnOpen}
        onClose={() => setAddColumnOpen(false)}
      />
      {isOwner && (
        <BoardSettingsDialog
          board={board}
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {canEdit && (
        <ManageLabelsDialog
          boardId={boardId}
          open={labelsOpen}
          onClose={() => setLabelsOpen(false)}
        />
      )}
    </>
  );
}
