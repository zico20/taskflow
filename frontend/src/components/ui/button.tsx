import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-1 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap active:translate-y-px",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-b from-accent-hover to-accent text-bg font-semibold shadow-[0_4px_14px_-4px_rgb(var(--accent)/0.55),inset_0_1px_0_rgba(255,255,255,0.35)] hover:brightness-[1.07]",
        secondary:
          "glass-clear text-fg hover:brightness-[1.08]",
        ghost: "text-fg-muted hover:bg-bg-muted hover:text-fg",
        danger:
          "bg-danger/90 text-white hover:bg-danger shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
        outline:
          "border border-border bg-transparent text-fg hover:bg-bg-muted",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-10 px-5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
