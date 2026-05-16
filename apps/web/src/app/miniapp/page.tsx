import Script from "next/script";
import { getTranslator } from "@/lib/i18n";
import { WaveMark } from "@/components/brand/wave-mark";
import { MiniAppAuth } from "./mini-app-auth";

export const dynamic = "force-dynamic";

export default async function MiniAppPage() {
  const { lang, t } = await getTranslator();
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-5 py-8 text-center">
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />

      <div className="relative">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-accent)_55%,transparent)_0%,transparent_70%)] blur-2xl"
        />
        <span className="grid h-20 w-20 place-items-center rounded-[28px] border border-[var(--color-border-strong)] bg-[color-mix(in_oklab,var(--color-surface-2)_85%,transparent)] text-[var(--color-accent)] shadow-[0_18px_48px_-18px_color-mix(in_oklab,var(--color-accent)_70%,transparent)]">
          <WaveMark size={48} />
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("web.miniapp.heading")}
        </h1>
        <p className="mx-auto max-w-xs text-balance text-sm leading-relaxed text-[var(--color-muted)]">
          {t("web.miniapp.lead")}
        </p>
      </div>

      <MiniAppAuth
        strings={{
          idle: t("web.miniapp.idle"),
          verifying: t("web.miniapp.verifying"),
          ready: t("web.miniapp.ready"),
          linkHint: t("web.miniapp.link_hint"),
          retry: t("web.miniapp.retry"),
          notInTelegram:
            lang === "ru"
              ? "Telegram WebApp недоступен. Открой эту ссылку из бота."
              : "Telegram WebApp is missing. Open this URL from inside the bot.",
        }}
      />
    </main>
  );
}
