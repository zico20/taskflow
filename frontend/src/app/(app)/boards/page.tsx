"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/misc";
import { useBoards } from "@/hooks/use-boards";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";
import { BoardCard } from "@/components/boards/board-card";
import { useT, useTCount } from "@/lib/i18n";
import type { BoardRole, BoardSummary } from "@/lib/types";

// Display order + heading key for each ownership group.
const GROUPS: { role: BoardRole; key: string }[] = [
  { role: "owner", key: "boards.group.owned" },
  { role: "editor", key: "boards.group.editor" },
  { role: "viewer", key: "boards.group.viewer" },
];

export default function BoardsPage() {
  const t = useT();
  const tc = useTCount();
  const { data: boards, isLoading } = useBoards();
  const [createOpen, setCreateOpen] = useState(false);

  // Bucket boards by role for grouped sections (presentation only — same data).
  const grouped = useMemo(() => {
    const map: Record<BoardRole, BoardSummary[]> = {
      owner: [],
      editor: [],
      viewer: [],
    };
    for (const b of boards ?? []) {
      if (b.role) map[b.role].push(b);
    }
    return map;
  }, [boards]);

  return (
    <>
      {/* Context header */}
      <header className="flex h-[60px] flex-shrink-0 items-center gap-3 border-b border-border/60 px-4 sm:gap-3.5 sm:px-6">
        <h1 className="text-[17px] font-bold tracking-tight text-fg">
          {t("nav.allBoards")}
        </h1>
        <span className="hidden text-[12.5px] text-fg-subtle sm:inline">
          {tc("boards.count", boards?.length ?? 0)}
        </span>
        <div className="flex-1" />
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          {t("boards.new")}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-6 w-6 text-accent" />
          </div>
        ) : !boards || boards.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid size={22} />}
            title={t("boards.empty.title")}
            description={t("boards.empty.desc")}
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus size={16} />
                {t("boards.empty.cta")}
              </Button>
            }
          />
        ) : (
          <div className="space-y-7">
            {GROUPS.map(({ role, key }) => {
              const items = grouped[role];
              if (items.length === 0) return null;
              return (
                <section key={role}>
                  <div className="mb-3.5 flex items-center gap-2.5">
                    <h2 className="text-[13px] font-bold uppercase tracking-wide text-fg-muted">
                      {t(key)}
                    </h2>
                    <span className="h-px flex-1 bg-border/70" />
                    <span className="text-[11.5px] text-fg-subtle">
                      {items.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map((board) => (
                      <BoardCard key={board.id} board={board} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <CreateBoardDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
