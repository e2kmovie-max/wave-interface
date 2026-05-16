import Link from "next/link";
import { Types } from "mongoose";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { User } from "@/lib/wave-interface";
import { connectMongo } from "@/lib/clients/social";
import { readSession } from "@/lib/session";
import { getTranslator } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import { CreateRoomForm } from "./create-room-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await readSession();
  const { lang, t } = await getTranslator();

  let viewer: { name: string; initials: string } | null = null;
  if (session && Types.ObjectId.isValid(session.uid)) {
    await connectMongo();
    const user = await User.findById(session.uid).lean();
    if (user) {
      const name = displayName(user);
      viewer = { name, initials: initialsFor(name) };
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-10">
      <SiteHeader
        lang={lang}
        user={viewer}
        signInLabel={t("web.nav.sign_in")}
        signOutLabel={t("web.nav.sign_out")}
      />

      <section className="relative flex flex-1 flex-col items-center justify-center gap-10 pb-12 pt-10 text-center sm:pt-20">
        <div className="wave-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-60" />

        <Pill tone="accent" className="gap-2">
          <span className="live-dot" aria-hidden />
          {lang === "ru" ? "Синхронный просмотр" : "Synced watch party"}
        </Pill>

        <h1 className="text-balance font-display text-[44px] font-semibold leading-[1.02] tracking-[-0.02em] sm:text-6xl md:text-7xl">
          {t("web.home.title")}
          <br />
          <span className="bg-gradient-to-br from-[var(--color-accent)] via-[color-mix(in_oklab,var(--color-accent)_70%,white)] to-[var(--color-coral)] bg-clip-text text-transparent">
            {t("web.home.title_emph")}
          </span>
        </h1>

        <p className="max-w-2xl text-balance text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">
          {t("web.home.lead")}
        </p>

        {viewer ? (
          <CreateRoomForm
            strings={{
              placeholder: t("web.home.form_label"),
              submit: t("web.home.form_submit"),
              loading: t("web.home.creating"),
              invalid: t("web.home.form_invalid"),
              subscriptionRequired:
                lang === "ru"
                  ? "Сначала подпишись на обязательные каналы: {channels}. Затем нажми «Создать комнату» ещё раз."
                  : "Subscribe to the required channels first: {channels}. Then press “Create room” again.",
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full px-8 sm:w-auto">
                {t("web.home.cta_sign_in")}
              </Button>
            </Link>
            <p className="text-xs text-[var(--color-subtle)]">
              {lang === "ru"
                ? "Без регистрации. Войди через Google или Telegram."
                : "No signup form. One tap with Google or Telegram."}
            </p>
          </div>
        )}
      </section>

      <section className="grid gap-3 pb-12 sm:grid-cols-3">
        {steps(lang).map((step, idx) => (
          <div
            key={step.title}
            className="group relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_55%,transparent)] p-5 backdrop-blur-md transition-colors hover:border-[var(--color-border-strong)]"
          >
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--color-subtle)]">
              0{idx + 1}
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">
              {step.body}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}

function steps(
  lang: "ru" | "en",
): Array<{ title: string; body: string }> {
  if (lang === "ru") {
    return [
      {
        title: "Вставь ссылку",
        body: "Любая поддерживаемая ссылка на видео. Без выбора источника, без лишних шагов.",
      },
      {
        title: "Поделись комнатой",
        body: "Wave соберёт инвайт, который можно отправить в чат прямо из Telegram.",
      },
      {
        title: "Смотрите вместе",
        body: "Play, pause, seek и качество синхронизируются автоматически у всех зрителей.",
      },
    ];
  }
  return [
    {
      title: "Drop a link",
      body: "Any supported video URL. No source picker, no extra steps.",
    },
    {
      title: "Share the room",
      body: "Wave generates an invite you can forward from inside Telegram in one tap.",
    },
    {
      title: "Watch in lockstep",
      body: "Play, pause, seek and quality stay synced across every viewer automatically.",
    },
  ];
}

function displayName(user: {
  googleName?: string | null;
  googleEmail?: string | null;
  telegramUsername?: string | null;
  telegramFirstName?: string | null;
  guestName?: string | null;
}): string {
  return (
    user.googleName ??
    user.telegramFirstName ??
    user.telegramUsername ??
    user.guestName ??
    user.googleEmail ??
    "Guest"
  );
}

function initialsFor(name: string): string {
  const tokens = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return "·";
  if (tokens.length === 1) return tokens[0]!.slice(0, 2).toUpperCase();
  return `${tokens[0]![0]}${tokens[1]![0]}`.toUpperCase();
}
