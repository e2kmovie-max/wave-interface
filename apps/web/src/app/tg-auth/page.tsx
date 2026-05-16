import Link from "next/link";
import { redirect } from "next/navigation";
import {
  isBotConfigured,
  isGoogleOAuthConfigured,
  pickLang,
  verifyTgLinkToken,
} from "@/lib/wave-interface";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { WaveBrand } from "@/components/brand/wave-mark";
import { getTranslator } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function TgAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim();

  if (!token) redirect("/tg-auth/error?reason=invalid");

  const tgData = verifyTgLinkToken(token);
  if (!tgData) redirect("/tg-auth/error?reason=expired");

  if (!isGoogleOAuthConfigured()) redirect("/tg-auth/error?reason=google_disabled");
  if (!isBotConfigured()) redirect("/tg-auth/error?reason=bot_disabled");

  // Prefer the language the bot detected at link time; fall back to web
  // detection so the user sees something sensible if their browser disagrees.
  const tokenLang = tgData.lang ?? pickLang(undefined);
  const { t } = await getTranslator();
  const displayName =
    tgData.firstName?.trim() ||
    tgData.username?.trim() ||
    tgData.lastName?.trim() ||
    String(tgData.tgUserId);

  const startHref = `/api/auth/google/start?tgLink=${encodeURIComponent(token)}&next=${encodeURIComponent("/tg-auth/done?linked=google")}`;

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col px-5 py-6 sm:px-6 sm:py-10">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <WaveBrand />
        </Link>
        <Pill tone="accent" className="gap-2">
          <TelegramGlyph />
          Telegram
        </Pill>
      </header>

      <section className="relative flex flex-1 flex-col justify-center gap-7 py-10">
        <div className="wave-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 opacity-50" />

        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("web.tgauth.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-balance text-sm leading-relaxed text-[var(--color-muted)]">
            {t("web.tgauth.greeting", { name: displayName })}
          </p>
        </div>

        <div className="surface flex flex-col gap-3 rounded-3xl p-5">
          <a href={startHref} className="contents">
            <Button size="lg" className="w-full">
              <GoogleGlyph />
              {t("web.tgauth.continue")}
            </Button>
          </a>
          <p className="text-center text-xs leading-relaxed text-[var(--color-subtle)]">
            {t("web.tgauth.security_note")}
          </p>
        </div>

        <p className="text-center text-xs text-[var(--color-subtle)]">
          {/* Keep the bot lang visible — useful when supporting users. */}
          <span aria-hidden>·</span> {tokenLang.toUpperCase()} <span aria-hidden>·</span>
        </p>
      </section>
    </main>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="currentColor"
        d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.6 4.6 0 01-1.995 3.018v2.51h3.227c1.89-1.74 2.986-4.305 2.986-7.351z"
        opacity=".95"
      />
      <path
        fill="currentColor"
        d="M12 22c2.7 0 4.964-.895 6.614-2.422l-3.227-2.509c-.895.6-2.04.955-3.387.955-2.605 0-4.81-1.76-5.595-4.123H3.067v2.591A9.996 9.996 0 0012 22z"
        opacity=".7"
      />
      <path
        fill="currentColor"
        d="M6.405 13.901a6.003 6.003 0 010-3.802V7.508H3.067a10.001 10.001 0 000 8.984l3.338-2.591z"
        opacity=".55"
      />
      <path
        fill="currentColor"
        d="M12 5.977c1.468 0 2.786.504 3.823 1.495l2.868-2.868C16.96 2.99 14.696 2 12 2A9.996 9.996 0 003.067 7.508l3.338 2.591C7.19 7.736 9.395 5.977 12 5.977z"
        opacity=".85"
      />
    </svg>
  );
}

function TelegramGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5">
      <path
        fill="currentColor"
        d="M21.94 4.27 18.7 19.94c-.24 1.06-.86 1.31-1.75.82l-4.83-3.56-2.33 2.25c-.26.26-.47.47-.96.47l.34-4.88L17.94 6.5c.39-.34-.08-.54-.6-.2L7.42 12.7l-4.81-1.5c-1.04-.32-1.06-1.04.22-1.55l18.81-7.25c.87-.32 1.63.2 1.3 1.87z"
      />
    </svg>
  );
}
