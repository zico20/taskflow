"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
      <Toaster
        theme="system"
        position="bottom-right"
        toastOptions={{
          // Clear-glass toasts. Tokens adapt to light/dark automatically.
          style: {
            background: "var(--glass-clear-bg)",
            backdropFilter:
              "blur(var(--glass-blur-clear)) saturate(var(--glass-saturate))",
            WebkitBackdropFilter:
              "blur(var(--glass-blur-clear)) saturate(var(--glass-saturate))",
            border: "1px solid var(--glass-clear-border)",
            borderRadius: "0.9rem",
            boxShadow: "var(--glass-shadow-sm)",
            color: "rgb(var(--fg))",
          },
        }}
      />
    </QueryClientProvider>
  );
}
