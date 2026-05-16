import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getEnv, User } from "@/lib/wave-interface";
import { connectMongo, makeRoomState, Room } from "@/lib/clients/social";
import { readSession } from "@/lib/session";
import { WaveBrand } from "@/components/brand/wave-mark";
import { Pill } from "@/components/ui/pill";
import { getTranslator } from "@/lib/i18n";
import { RoomPlayer, type ChatMessage, type PlayerFormat } from "./room-player";

export const dynamic = "force-dynamic";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await readSession();
  if (!session) redirect(`/login?next=/rooms/${encodeURIComponent(code)}`);

  await connectMongo();
  const [room, user] = await Promise.all([
    Room.findOne({ code: code.toUpperCase(), isClosed: false }).lean(),
    User.findById(session.uid).lean(),
  ]);
  if (!room) notFound();
  if (!user) redirect(`/login?next=/rooms/${encodeURIComponent(code)}`);

  const env = getEnv();
  const { lang, t } = await getTranslator();
  const webInvite = `${env.PUBLIC_WEB_URL.replace(/\/$/, "")}/rooms/${room.code}`;
  const botInvite =
    room.source === "bot" && room.botPayload && env.BOT_USERNAME
      ? `https://t.me/${env.BOT_USERNAME}?start=${room.botPayload}`
      : null;
  const formats: PlayerFormat[] = room.availableFormats.map((format) => ({
    formatId: format.formatId,
    label: format.label,
  }));
  const initialMessages: ChatMessage[] = (room.chatMessages ?? [])
    .slice(-100)
    .map((message) => ({
      id: String(message._id),
      name: message.name,
      text: message.text,
      createdAt: (message.createdAt ?? new Date()).toISOString(),
    }));
  const currentUser = {
    id: String(user._id),
    name: displayName(user),
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-8">
      <header className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <WaveBrand />
        </Link>
        <div className="flex items-center gap-2">
          <Pill tone="accent" className="hidden sm:inline-flex">
            <span className="opacity-75">
              {lang === "ru" ? "Код" : "Code"}
            </span>
            <span className="font-mono tracking-[0.18em]">{room.code}</span>
          </Pill>
        </div>
      </header>

      <section className="flex flex-col gap-1">
        <span className="eyebrow flex items-center gap-2">
          <span>{t("web.room.title")}</span>
          <span aria-hidden className="text-[var(--color-subtle)]">·</span>
          <span className="font-mono tracking-[0.18em]">{room.code}</span>
        </span>
        <h1 className="text-balance font-display text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
          {room.videoTitle ?? (lang === "ru" ? "Совместный просмотр" : "Watch room")}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-muted)]">
          {room.videoUploader && <span className="truncate">{room.videoUploader}</span>}
          {room.videoUploader && (
            <span aria-hidden className="text-[var(--color-subtle)]">·</span>
          )}
          <span>{formatDuration(room.videoDuration ?? undefined, lang)}</span>
          {formats.length > 0 && (
            <>
              <span aria-hidden className="text-[var(--color-subtle)]">·</span>
              <span>
                {formats.length}{" "}
                {lang === "ru" ? "качества" : "qualities"}
              </span>
            </>
          )}
        </div>
      </section>

      <RoomPlayer
        code={room.code}
        formats={formats}
        initialState={makeRoomState(room)}
        initialMessages={initialMessages}
        currentUser={currentUser}
        invites={{ web: webInvite, telegram: botInvite }}
        strings={{
          connected: t("web.room.connected"),
          reconnecting: t("web.room.reconnecting"),
          playing: t("web.room.playing"),
          paused: t("web.room.paused"),
          quality: t("web.room.quality"),
          speed: t("web.room.speed"),
          duration: t("web.room.duration"),
          stateSync: t("web.room.state_sync"),
          chatTitle: t("web.room.chat_title"),
          chatEmpty: t("web.room.chat_empty"),
          chatPlaceholder: t("web.room.chat_placeholder"),
          chatSend: t("web.room.chat_send"),
          invite: t("web.room.invite"),
          webInvite: t("web.room.web_invite"),
          telegramInvite: t("web.room.telegram_invite"),
          copyLink: t("web.room.copy_link"),
          linkCopied: t("web.room.link_copied"),
          play: lang === "ru" ? "Запустить" : "Play",
          pause: lang === "ru" ? "Пауза" : "Pause",
          signedInAs:
            lang === "ru"
              ? `Ты — ${currentUser.name}`
              : `Signed in as ${currentUser.name}`,
        }}
      />
    </main>
  );
}

function formatDuration(seconds: number | undefined, lang: "ru" | "en"): string {
  if (!seconds) return lang === "ru" ? "Длительность неизвестна" : "Unknown duration";
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const rest = rounded % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${rest
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
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
    user.telegramUsername ??
    user.telegramFirstName ??
    user.guestName ??
    user.googleEmail ??
    "Guest"
  );
}
