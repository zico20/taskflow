"use client";

import * as React from "react";
import { useUiStore } from "@/stores/ui-store";
import { dirFor, type Direction, type Locale } from "./locale";
import { createT, translateCount, type TFunction, type TParams } from "./translate";
import type { MessageKey } from "./dictionaries";

/**
 * Seeds the client locale store from the server-resolved value on mount, so the
 * first client render matches the server-rendered <html dir/lang> (no hydration
 * mismatch, no flash). Reads locale reactively from the Zustand store thereafter.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  // Seed synchronously on first render (before children read the store).
  const [seeded] = React.useState(() => {
    useUiStore.getState().initLocale(initialLocale);
    return true;
  });
  void seeded;
  return <>{children}</>;
}

export function useLocale(): {
  locale: Locale;
  dir: Direction;
  setLocale: (next: Locale) => void;
} {
  const locale = useUiStore((s) => s.locale);
  const setLocale = useUiStore((s) => s.setLocale);
  return { locale, dir: dirFor(locale), setLocale };
}

/** Returns a translate function bound to the active locale. */
export function useT(): TFunction {
  const locale = useUiStore((s) => s.locale);
  return React.useMemo(() => createT(locale), [locale]);
}

/** Count-aware translate bound to the active locale. */
export function useTCount() {
  const locale = useUiStore((s) => s.locale);
  return React.useMemo(
    () =>
      (key: MessageKey, count: number, params?: TParams) =>
        translateCount(locale, key, count, params),
    [locale],
  );
}
