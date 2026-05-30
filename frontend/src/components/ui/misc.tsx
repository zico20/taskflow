import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn, colorFromString, initials } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <Spinner className="h-6 w-6 text-accent" />
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 28,
  title,
}: {
  name: string;
  src?: string | null;
  size?: number;
  title?: string;
}) {
  const dim = { width: size, height: size, fontSize: size * 0.4 };
  if (src) {
    return (
      // Avatars are tiny, external, user-provided URLs; next/image optimization
      // isn't worth the config here. Plain img is intentional.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        title={title ?? name}
        style={dim}
        className="rounded-full object-cover ring-2 ring-bg"
      />
    );
  }
  return (
    <div
      title={title ?? name}
      style={{ ...dim, backgroundColor: colorFromString(name) }}
      className="flex items-center justify-center rounded-full font-semibold text-bg ring-2 ring-bg"
    >
      {initials(name)}
    </div>
  );
}

export function Badge({
  children,
  color,
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
      style={
        color
          ? { backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }
          : undefined
      }
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-subtle/40 px-6 py-12 text-center animate-fade-in">
      <div className="glass-clear mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-fg-muted">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-fg-muted">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
