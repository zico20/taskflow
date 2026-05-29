"use client";

import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import { Avatar, EmptyState } from "@/components/ui/misc";
import type { ActivityEntry } from "@/lib/types";

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <Activity size={15} className="text-fg-subtle" />
        <h3 className="text-sm font-semibold text-fg">Activity</h3>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<Activity size={18} />}
          title="No activity yet"
          description="Actions on this board will show up here."
        />
      ) : (
        <ul className="space-y-3 overflow-y-auto pr-1">
          {entries.map((e) => (
            <li key={e.id} className="flex gap-2.5 animate-fade-in">
              <Avatar
                name={e.user?.name ?? "Someone"}
                src={e.user?.avatar_url}
                size={24}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-fg-muted">
                  {e.message}
                </p>
                <p className="mt-0.5 text-[11px] text-fg-subtle">
                  {formatDistanceToNow(new Date(e.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
