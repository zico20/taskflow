import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      // 16px (text-base) on mobile prevents iOS zoom-on-focus; revert to the
      // desktop sizing at md+. Slightly taller on mobile for a comfortable target.
      "flex h-10 w-full rounded-md border border-border bg-bg-subtle px-3 py-1 text-base text-fg",
      "md:h-9 md:text-sm",
      "placeholder:text-fg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      // 16px on mobile (no iOS zoom); desktop sizing at md+.
      "flex min-h-[80px] w-full rounded-md border border-border bg-bg-subtle px-3 py-2 text-base text-fg md:text-sm",
      "placeholder:text-fg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
      "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("text-sm font-medium text-fg-muted", className)}
      {...props}
    />
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}
