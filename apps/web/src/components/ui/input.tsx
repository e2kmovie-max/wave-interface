import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg)_85%,transparent)] px-4 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-subtle)] outline-none transition-[border-color,box-shadow,background-color] duration-150 focus:border-[var(--color-accent)] focus:bg-[color-mix(in_oklab,var(--color-bg-deep)_85%,transparent)] focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-accent)_18%,transparent)] disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
