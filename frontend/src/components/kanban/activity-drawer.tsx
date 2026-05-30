"use client";

import { X } from "lucide-react";
import { ActivityFeed } from "@/components/kanban/activity-feed";
import { useT } from "@/lib/i18n";
import type { ActivityEntry } from "@/lib/types";

/**
 * Activity as a right-side slide-over drawer (was a fixed inline column).
 * Visibility is driven by the existing `activityPanelOpen` UI-store flag — no
 * new state or feature, just a different placement. Mirrors correctly under RTL
 * via logical `inset-inline-end` + a direction-aware transform.
 */
export function ActivityDrawer({
  open,
  onClose,
  entries,
}: {
  open: boolean;
  onClose: () => void;
  entries: ActivityEntry[];
}) {
  const t = useT();
  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        aria-hidden={!open}
        className={`fixed inset-0 z-[55] bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label={t("board.activity.toggleShow")}
        className={`glass-frost fixed inset-y-0 end-0 z-[60] flex w-[340px] max-w-[88vw] flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open
            ? "translate-x-0"
            : "translate-x-full rtl:-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-end border-b border-fg/10 px-3 py-2.5">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.cancel")}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-sm text-fg-subtle transition-colors hover:bg-fg/10 hover:text-fg"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ActivityFeed entries={entries} />
        </div>
      </aside>
    </>
  );
}
