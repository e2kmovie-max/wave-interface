import Link from "next/link";
import { getEnv } from "@/lib/wave-interface";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { WaveBrand, WaveMark } from "@/components/brand/wave-mark";
import { getTranslator } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function TgAuthDonePage() {
  const env = getEnv();
  const { t } = await getTranslator();
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
        <Pill tone="mint">✓</Pill>
      </header>

      <section className="relative flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
        <div className="wave-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 opacity-50" />

        <span className="grid h-16 w-16 place-items-center rounded-[24px] border border-[var(--color-border-strong)] bg-[color-mix(in_oklab,var(--color-surface-2)_85%,transparent)] text-[var(--color-accent)]">
          <WaveMark size={36} />
        </span>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("web.tgauth.done_title")}
        </h1>
        <p className="mx-auto max-w-sm text-balance text-sm leading-relaxed text-[var(--color-muted)]">
          {t("web.tgauth.done_body")}
        </p>

        <div className="surface flex w-full flex-col gap-3 rounded-3xl p-5">
          {botLink && (
            <a href={botLink} target="_blank" rel="noreferrer" className="contents">
              <Button size="lg" className="w-full">
                {t("web.tgauth.back_to_bot")}
              </Button>
            </a>
          )}
          <Link href="/account" className="contents">
            <Button size="lg" variant="secondary" className="w-full">
              {t("web.tgauth.open_account")}
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
