"use client";

import Link from "next/link";
import { LayoutGrid, LogOut } from "lucide-react";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/boards" className="flex items-center gap-2 text-fg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-bg">
            <LayoutGrid size={16} />
          </span>
          <span className="font-semibold">TaskFlow</span>
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar name={user.name} src={user.avatar_url} size={28} />
              <span className="text-sm text-fg-muted">{user.name}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              title="Log out"
              onClick={() => logout.mutate()}
            >
              <LogOut size={16} />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
