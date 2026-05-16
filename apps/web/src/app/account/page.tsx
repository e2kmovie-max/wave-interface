import { redirect } from "next/navigation";
import Link from "next/link";
import { Types } from "mongoose";
import { connectMongo, User, getEnv, isGoogleOAuthConfigured } from "@/lib/wave-interface";
import { readSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { WaveBrand } from "@/components/brand/wave-mark";
import { getTranslator } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const LINK_ERROR_MESSAGES_EN: Record<string, string> = {
  google_already_linked:
    "That Google account is already attached to a different Wave user.",
  telegram_already_linked:
    "That Telegram account is already attached to a different Wave user.",
};

const LINK_ERROR_MESSAGES_RU: Record<string, string> = {
  google_already_linked:
    "Этот Google-аккаунт уже привязан к другой учётке Wave.",
  telegram_already_linked:
    "Этот Telegram-аккаунт уже привязан к другой учётке Wave.",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await readSession();
  if (!session || !Types.ObjectId.isValid(session.uid)) redirect("/login?next=/account");

  await connectMongo();
  const user = await User.findById(session.uid).lean();
  if (!user) redirect("/login");

  const env = getEnv();
  const params = await searchParams;
  const { lang, t } = await getTranslator();
  const errorTable =
    lang === "ru" ? LINK_ERROR_MESSAGES_RU : LINK_ERROR_MESSAGES_EN;
  const error = params.error
    ? errorTable[params.error] ?? params.error
    : null;
  const googleReady = isGoogleOAuthConfigured(env);

  const hasGoogle = Boolean(user.googleId);
  const hasTelegram = Boolean(user.telegramId);
  const isGuest = Boolean(user.isGuest);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-5 py-6 sm:px-6 sm:py-10">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <WaveBrand />
        </Link>
        <form action="/api/auth/logout" method="post">
          <Button variant="ghost" size="sm" type="submit">
            {t("web.nav.sign_out")}
          </Button>
        </form>
      </header>

      <div className="mt-8 flex flex-col gap-2">
        <span className="eyebrow">
          {lang === "ru" ? "Аккаунт" : "Account"}
        </span>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("web.account.title")}
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-[var(--color-muted)]">
          {t("web.account.lead")}
        </p>
      </div>

      {isGuest && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[color-mix(in_oklab,var(--color-warn)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-warn)_12%,transparent)] p-4 text-sm">
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--color-warn)_25%,transparent)] text-xs font-bold text-[var(--color-warn)]"
          >
            !
          </span>
          <p className="text-[var(--color-muted)]">
            {t("web.account.guest_notice")}
            {user.guestName ? ` — ${user.guestName}` : ""}
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-[color-mix(in_oklab,var(--color-danger)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_15%,transparent)] p-3 text-sm text-[color-mix(in_oklab,var(--color-danger)_55%,white)]">
          {error}
        </div>
      )}

      <section className="mt-6 flex flex-col gap-3">
        <IdentityRow
          icon={<GoogleGlyph />}
          label="Google"
          linked={hasGoogle}
          linkedAs={
            hasGoogle
              ? user.googleEmail ?? user.googleName ?? user.googleId ?? null
              : null
          }
          linkedLabel={t("web.account.linked")}
          unlinkedLabel={t("web.account.not_linked")}
          lang={lang}
          action={
            hasGoogle ? null : googleReady ? (
              <a href="/api/auth/google/start?link=1&next=/account">
                <Button size="sm">{t("web.account.link_google")}</Button>
              </a>
            ) : (
              <Button size="sm" disabled>
                {lang === "ru"
                  ? "Google OAuth не настроен"
                  : "Google OAuth disabled"}
              </Button>
            )
          }
        />

        <IdentityRow
          icon={<TelegramGlyph />}
          label="Telegram"
          linked={hasTelegram}
          linkedAs={
            hasTelegram
              ? user.telegramUsername
                ? `@${user.telegramUsername}`
                : user.telegramFirstName ?? String(user.telegramId)
              : null
          }
          linkedLabel={t("web.account.linked")}
          unlinkedLabel={t("web.account.not_linked")}
          lang={lang}
          action={
            hasTelegram ? null : env.BOT_USERNAME ? (
              <a
                href={`https://t.me/${env.BOT_USERNAME}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="secondary">
                  {t("web.account.link_telegram")}
                </Button>
              </a>
            ) : (
              <Button size="sm" disabled>
                {lang === "ru" ? "Бот не подключён" : "Bot not configured"}
              </Button>
            )
          }
        />
      </section>
    </main>
  );
}

function IdentityRow({
  icon,
  label,
  linked,
  linkedAs,
  linkedLabel,
  unlinkedLabel,
  lang,
  action,
}: {
  icon: React.ReactNode;
  label: string;
  linked: boolean;
  linkedAs: string | null;
  linkedLabel: string;
  unlinkedLabel: string;
  lang: "ru" | "en";
  action: React.ReactNode;
}) {
  return (
    <div className="surface flex items-center gap-4 rounded-3xl p-4 sm:p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface-2)_70%,transparent)] text-[var(--color-fg)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold tracking-tight">{label}</p>
          <Pill tone={linked ? "mint" : "neutral"}>
            {linked ? linkedLabel : unlinkedLabel}
          </Pill>
        </div>
        <p className="mt-0.5 truncate text-sm text-[var(--color-muted)]">
          {linkedAs ??
            (lang === "ru"
              ? "Привяжи, чтобы заходить с этого устройства"
              : "Link to sign in from this surface")}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
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
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M21.94 4.27 18.7 19.94c-.24 1.06-.86 1.31-1.75.82l-4.83-3.56-2.33 2.25c-.26.26-.47.47-.96.47l.34-4.88L17.94 6.5c.39-.34-.08-.54-.6-.2L7.42 12.7l-4.81-1.5c-1.04-.32-1.06-1.04.22-1.55l18.81-7.25c.87-.32 1.63.2 1.3 1.87z"
      />
    </svg>
  );
}
