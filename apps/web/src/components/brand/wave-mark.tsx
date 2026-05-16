import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Wave brand mark. A geometric "W" formed from three offset wave strokes —
 * used in the header, login screens, and miniapp splash. Inherits `currentColor`
 * so callers can tint it with `text-[var(--color-accent)]` etc.
 */
export function WaveMark({
  className,
  size = 28,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      role="img"
      aria-label="Wave"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      {...props}
    >
      <defs>
        <linearGradient id="wave-mark-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <path
        d="M3 11c2.4 0 2.4 6 4.8 6S10.2 11 12.6 11s2.4 6 4.8 6 2.4-6 4.8-6 2.4 6 4.8 6"
        stroke="url(#wave-mark-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M3 17c2.4 0 2.4 6 4.8 6S10.2 17 12.6 17s2.4 6 4.8 6 2.4-6 4.8-6 2.4 6 4.8 6"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function WaveBrand({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-[var(--color-fg)]",
        className,
      )}
    >
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--color-border-strong)] bg-[color-mix(in_oklab,var(--color-surface-2)_85%,transparent)] text-[var(--color-accent)] shadow-[0_8px_24px_-16px_color-mix(in_oklab,var(--color-accent)_85%,transparent)]"
      >
        <WaveMark size={22} />
      </span>
      {showWordmark && (
        <span className="font-display text-base font-semibold tracking-tight">
          Wave
        </span>
      )}
    </span>
  );
}
