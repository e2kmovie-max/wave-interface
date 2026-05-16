import Link from "next/link";
import { getEnv } from "@/lib/wave-interface";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { WaveBrand } from "@/components/brand/wave-mark";
import { getTranslator } from "@/lib/i18n";
import type { I18nKey } from "@/lib/wave-interface";

export const dynamic = "force-dynamic";

const REASON_TO_KEY: Record<string, I18nKey> = {
  invalid: "web.tgauth.error_invalid",
  expired: "web.tgauth.error_expired",
  already_linked: "web.tgauth.error_already_linked",
  google_disabled: "web.tgauth.error_invalid",
  bot_disabled: "web.tgauth.error_bot_disabled",
};

export default async function TgAuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const { t } = await getTranslator();
  const reasonKey =
    REASON_TO_KEY[params.reason ?? ""] ?? "web.tgauth.error_invalid";
  const botLink = env.BOT_USERNAME ? `https://t.me/${env.BOT_USERNAME}` : null;

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col px-5 py-6 sm:px-6 sm:py-10">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <WaveBrand />
        </Link>
        <Pill tone="danger">!</Pill>
      </header>

      <section className="relative flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("web.tgauth.error_title")}
        </h1>
        <p className="mx-auto max-w-sm text-balance text-sm leading-relaxed text-[var(--color-muted)]">
          {t(reasonKey)}
        </p>

        <div className="surface flex w-full flex-col gap-3 rounded-3xl p-5">
          {botLink && (
            <a href={botLink} target="_blank" rel="noreferrer" className="contents">
              <Button size="lg" className="w-full">
                {t("web.tgauth.back_to_bot")}
              </Button>
            </a>
          )}
          <Link href="/login" className="contents">
            <Button size="lg" variant="secondary" className="w-full">
              {t("web.nav.sign_in")}
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
