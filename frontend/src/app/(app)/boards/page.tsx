"use client";

import { useState } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/misc";
import { useBoards } from "@/hooks/use-boards";
import { CreateBoardDialog } from "@/components/boards/create-board-dialog";
import { BoardCard } from "@/components/boards/board-card";

export default function BoardsPage() {
  const { data: boards, isLoading } = useBoards();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Your boards</h1>
          <p className="mt-0.5 text-sm text-fg-muted">
            {boards?.length ?? 0} board{boards?.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          New board
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-6 w-6 text-accent" />
        </div>
      ) : !boards || boards.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={22} />}
          title="No boards yet"
          description="Create your first board to start organizing tasks across columns."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              Create a board
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      )}

      <CreateBoardDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </main>
  );
}
