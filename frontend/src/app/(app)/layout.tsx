"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-auth";
import { FullPageSpinner } from "@/components/ui/misc";
import { TopBar } from "@/components/app-shell";
import { Backdrop } from "@/components/backdrop";

/**
 * Auth gate for all app routes. While the session is loading we show a spinner;
 * if there's no user we redirect to /login. (Client-side guard; the backend
 * remains the real authority and rejects unauthenticated API calls.)
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <FullPageSpinner />;

  return (
    <div className="relative min-h-screen">
      <Backdrop />
      <div className="relative z-10">
        <TopBar />
        {children}
      </div>
    </div>
  );
}
