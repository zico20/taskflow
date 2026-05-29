"use client";

import { Avatar } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import type { PresenceUser } from "@/lib/types";

export function PresenceBar({
  viewers,
  connected,
}: {
  viewers: PresenceUser[];
  connected: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          connected ? "bg-success" : "bg-fg-subtle",
        )}
        title={connected ? "Live" : "Disconnected"}
      />
      <div className="flex -space-x-2">
        {viewers.slice(0, 5).map((v) => (
          <Avatar key={v.id} name={v.name} src={v.avatar_url} size={26} />
        ))}
        {viewers.length > 5 && (
          <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-bg-muted text-[10px] font-semibold text-fg-muted ring-2 ring-bg">
            +{viewers.length - 5}
          </div>
        )}
      </div>
    </div>
  );
}
