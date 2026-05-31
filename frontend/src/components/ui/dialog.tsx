"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExitTransition } from "@/hooks/use-exit-transition";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Lightweight modal. Closes on Escape and backdrop click. (We keep this
 * dependency-free rather than pulling in Radix, to stay lean.) Animates on both
 * open and close via `useExitTransition`; instant under prefers-reduced-motion.
 */
export function Dialog({ open, onClose, children, className }: DialogProps) {
  const { mounted, closing } = useExitTransition(open, 160);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 pt-[8vh] backdrop-blur-sm",
        closing ? "animate-fade-out" : "animate-fade-in",
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "glass-frost w-full max-w-lg rounded-2xl",
          closing ? "animate-scale-out" : "animate-scale-in",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4">
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      <div className="flex items-center gap-2">
        {children}
        <button
          onClick={onClose}
          className="rounded-md p-1 text-fg-subtle hover:bg-bg-muted hover:text-fg"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export function DialogBody({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-4">{children}</div>;
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
      {children}
    </div>
  );
}
