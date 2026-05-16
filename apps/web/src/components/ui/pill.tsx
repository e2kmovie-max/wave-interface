import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "danger" | "warn" | "mint";

const tones: Record<Tone, string> = {
  neutral:
    "border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface-2)_70%,transparent)] text-[var(--color-muted)]",
  accent:
    "border-[color-mix(in_oklab,var(--color-accent)_40%,transparent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  danger:
    "border-[color-mix(in_oklab,var(--color-danger)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_18%,transparent)] text-[color-mix(in_oklab,var(--color-danger)_45%,white)]",
  warn:
    "border-[color-mix(in_oklab,var(--color-warn)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-warn)_15%,transparent)] text-[var(--color-warn)]",
  mint:
    "border-[color-mix(in_oklab,var(--color-mint)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-mint)_15%,transparent)] text-[var(--color-mint)]",
};

export function Pill({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
