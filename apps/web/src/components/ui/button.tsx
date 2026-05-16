import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[var(--color-accent-fg)] shadow-[0_8px_24px_-12px_color-mix(in_oklab,var(--color-accent)_70%,transparent)] hover:brightness-110 hover:shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--color-accent)_85%,transparent)] active:brightness-95",
  secondary:
    "bg-[color-mix(in_oklab,var(--color-surface-2)_85%,transparent)] text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-[color-mix(in_oklab,var(--color-surface-3)_85%,transparent)] hover:border-[var(--color-border-strong)]",
  outline:
    "bg-transparent text-[var(--color-fg)] border border-[var(--color-border-strong)] hover:bg-[color-mix(in_oklab,var(--color-surface)_60%,transparent)]",
  ghost:
    "bg-transparent text-[var(--color-fg)] hover:bg-[color-mix(in_oklab,var(--color-surface-2)_70%,transparent)]",
  danger:
    "bg-[var(--color-danger)] text-white hover:brightness-110 active:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-2xl",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 font-semibold tracking-tight transition-[filter,background-color,box-shadow,transform,border-color] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-deep)]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
