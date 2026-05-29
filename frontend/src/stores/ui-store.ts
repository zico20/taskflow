"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Client-only UI state (NOT server data — that lives in TanStack Query).
 * Persisted to localStorage so preferences survive reloads.
 */
interface UiState {
  activityPanelOpen: boolean;
  toggleActivityPanel: () => void;
  setActivityPanel: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activityPanelOpen: true,
      toggleActivityPanel: () =>
        set((s) => ({ activityPanelOpen: !s.activityPanelOpen })),
      setActivityPanel: (open) => set({ activityPanelOpen: open }),
    }),
    { name: "taskflow-ui" },
  ),
);
