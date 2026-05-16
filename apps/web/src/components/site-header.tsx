import Link from "next/link";
import { WaveBrand } from "@/components/brand/wave-mark";
import { Button } from "@/components/ui/button";
import { LangSwitcher } from "@/components/lang-switcher";
import type { Lang } from "@/lib/wave-interface";

export interface SiteHeaderProps {
  lang: Lang;
  user?: {
    name: string;
    initials: string;
  } | null;
  signInLabel: string;
  signOutLabel: string;
}

/**
 * Top navigation strip shared across most pages. Intentionally minimal — the
 * mini-app surface deliberately does not expose Account / Settings / Friends /
 * Admin entry points in the chrome. Authenticated users see a compact identity
 * pill next to the sign-out form.
 */
export function SiteHeader({
  lang,
  user,
  signInLabel,
  signOutLabel,
}: SiteHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 py-2">
      <Link
        href="/"
        className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      >
        <WaveBrand />
      </Link>
      <div className="flex items-center gap-2">
        <LangSwitcher current={lang} />
        {user ? (
          <form action="/api/auth/logout" method="post" className="contents">
            <div className="hidden h-9 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] pl-1 pr-3 sm:inline-flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[color-mix(in_oklab,var(--color-accent)_30%,transparent)] text-[11px] font-bold uppercase text-[var(--color-fg)]">
                {user.initials}
              </span>
              <span className="max-w-[14ch] truncate text-sm font-medium text-[var(--color-fg)]">
                {user.name}
              </span>
            </div>
            <Button variant="ghost" size="sm" type="submit">
              {signOutLabel}
            </Button>
          </form>
        ) : (
          <Link href="/login">
            <Button size="sm">{signInLabel}</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
