"use client";

import { useRef } from "react";
import { SUPPORTED_WEB_LANGS, type Lang } from "@/lib/wave-interface/i18n";

/**
 * Compact language switcher. Posts to `/api/lang` so it round-trips through
 * the Next route handler and re-renders the page in the new language without
 * relying on client-side translation. Falls back to a Submit button if the
 * client has JavaScript disabled.
 */
export function LangSwitcher({ current }: { current: Lang }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={formRef}
      action="/api/lang"
      method="post"
      className="inline-flex items-center"
    >
      <label htmlFor="wave-lang" className="sr-only">
        Language
      </label>
      <div className="relative">
        <select
          id="wave-lang"
          name="lang"
          defaultValue={current}
          className="h-9 cursor-pointer appearance-none rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] py-1 pl-3 pr-8 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)] outline-none transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)] focus-visible:border-[var(--color-accent)] focus-visible:text-[var(--color-fg)]"
          onChange={() => formRef.current?.submit()}
        >
          {SUPPORTED_WEB_LANGS.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.code.toUpperCase()}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 12 8"
          className="pointer-events-none absolute right-2.5 top-1/2 h-2 w-3 -translate-y-1/2 text-[var(--color-muted)]"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <noscript>
        <button
          type="submit"
          className="ml-2 rounded-full border border-[var(--color-border)] px-3 py-1 text-xs"
        >
          Set
        </button>
      </noscript>
    </form>
  );
}
