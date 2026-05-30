"use client";

import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import { Avatar, EmptyState } from "@/components/ui/misc";
import {
  useT,
  useLocale,
  dateFnsLocale,
  humanizeActivity,
} from "@/lib/i18n";
import type { ActivityEntry } from "@/lib/types";

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  const t = useT();
  const { locale } = useLocale();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <Activity size={15} className="text-fg-subtle" />
        <h3 className="text-sm font-semibold text-fg">{t("activity.title")}</h3>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<Activity size={18} />}
          title={t("activity.empty.title")}
          description={t("activity.empty.desc")}
        />
      ) : (
        <ul className="space-y-3 overflow-y-auto pr-1">
          {entries.map((e) => {
            const userName = e.user?.name ?? t("activity.someone");
            // Rebuild the sentence per-locale from structured data; the server's
            // pre-built `message` is the fallback for unknown action types.
            const message = humanizeActivity(
              e.action_type,
              userName,
              e.payload,
              t,
              e.message,
            );
            return (
              <li key={e.id} className="flex gap-2.5 animate-fade-in">
                <Avatar name={userName} src={e.user?.avatar_url} size={24} />
                <div className="min-w-0 flex-1">
                  <p dir="auto" className="text-sm leading-snug text-fg-muted">
                    {message}
                  </p>
                  <p className="mt-0.5 text-[11px] text-fg-subtle">
                    {formatDistanceToNow(new Date(e.created_at), {
                      addSuffix: true,
                      locale: dateFnsLocale(locale),
                    })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
