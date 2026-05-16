"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { cn } from "@/lib/utils";

const EMOJI_REACTIONS = ["😀", "😂", "😍", "🔥", "👏", "🍿", "💙", "🎉"];
const SPEED_MIN = 0.25;
const SPEED_MAX = 2;
const SPEED_STEP = 0.25;

export interface PlayerFormat {
  formatId: string;
  label: string;
}

export interface InitialRoomState {
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  selectedFormatId?: string;
  quality?: string;
}

export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  createdAt: string;
}

export interface RoomPlayerStrings {
  connected: string;
  reconnecting: string;
  playing: string;
  paused: string;
  quality: string;
  speed: string;
  duration: string;
  stateSync: string;
  chatTitle: string;
  chatEmpty: string;
  chatPlaceholder: string;
  chatSend: string;
  invite: string;
  webInvite: string;
  telegramInvite: string;
  copyLink: string;
  linkCopied: string;
  play: string;
  pause: string;
  signedInAs: string;
}

interface RoomPlayerProps {
  code: string;
  formats: PlayerFormat[];
  initialState: InitialRoomState;
  initialMessages: ChatMessage[];
  currentUser: {
    id: string;
    name: string;
  };
  invites: {
    web: string;
    telegram: string | null;
  };
  strings: RoomPlayerStrings;
}

type SyncPayload =
  | {
      type: "state";
      event?: "play" | "pause" | "seek" | "quality" | "speed";
      state: InitialRoomState;
    }
  | { type: "chat"; message: ChatMessage }
  | { type: "error"; error: string };

export function RoomPlayer({
  code,
  formats,
  initialState,
  initialMessages,
  currentUser,
  invites,
  strings,
}: RoomPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const suppressRef = useRef(false);
  const [state, setState] = useState(initialState);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const selectedFormatId = state.selectedFormatId ?? formats[0]?.formatId ?? "";
  const playbackRate = state.playbackRate ?? 1;
  const streamUrl = useMemo(
    () => `/api/rooms/${code}/stream?format=${encodeURIComponent(selectedFormatId)}`,
    [code, selectedFormatId],
  );

  useEffect(() => {
    void fetch(`/api/rooms/${code}/join`, { method: "POST" });
  }, [code]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/rooms/${code}/sync`);
    socketRef.current = socket;
    socket.addEventListener("open", () => {
      setConnected(true);
      socket.send(JSON.stringify({ type: "hello" }));
    });
    socket.addEventListener("close", () => setConnected(false));
    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data as string) as SyncPayload;
      if (payload.type === "state") applyState(payload.state);
      if (payload.type === "chat") {
        setMessages((current) => [...current, payload.message].slice(-100));
      }
    });
    return () => socket.close();
  }, [code]);

  function applyState(next: InitialRoomState) {
    setState(next);
    const video = videoRef.current;
    if (!video) return;
    suppressRef.current = true;
    video.playbackRate = next.playbackRate ?? 1;
    if (Math.abs(video.currentTime - next.currentTime) > 1) {
      video.currentTime = Math.max(0, next.currentTime);
    }
    if (next.isPlaying && video.paused) {
      void video.play().catch(() => undefined);
    }
    if (!next.isPlaying && !video.paused) {
      video.pause();
    }
    window.setTimeout(() => {
      suppressRef.current = false;
    }, 250);
  }

  function send(
    type: "play" | "pause" | "seek" | "quality" | "speed",
    override: Partial<InitialRoomState> = {},
  ) {
    const video = videoRef.current;
    const currentTime = override.currentTime ?? video?.currentTime ?? state.currentTime;
    const payload = {
      type,
      currentTime,
      playbackRate: override.playbackRate ?? playbackRate,
      selectedFormatId: override.selectedFormatId ?? state.selectedFormatId,
      quality: override.quality ?? state.quality,
    };
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
      return;
    }
    void fetch(`/api/rooms/${code}/state`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...payload,
        isPlaying: type === "play",
      }),
    });
  }

  function changeQuality(formatId: string) {
    const selected = formats.find((format) => format.formatId === formatId);
    const next = {
      ...state,
      selectedFormatId: formatId,
      quality: selected?.label ?? formatId,
      currentTime: videoRef.current?.currentTime ?? state.currentTime,
      isPlaying: false,
    };
    setState(next);
    send("quality", next);
  }

  function changeSpeed(value: string) {
    const nextRate = clampPlaybackRate(Number(value));
    if (videoRef.current) videoRef.current.playbackRate = nextRate;
    const next = {
      ...state,
      playbackRate: nextRate,
      currentTime: videoRef.current?.currentTime ?? state.currentTime,
    };
    setState(next);
    send("speed", next);
  }

  function sendChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(
      JSON.stringify({
        type: "chat",
        text,
        userId: currentUser.id,
      }),
    );
    setDraft("");
  }

  function addEmoji(emoji: string) {
    setDraft((current) => `${current}${emoji}`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--color-border-strong)] bg-black shadow-[0_30px_60px_-30px_rgba(0,0,0,0.65)]">
          <video
            key={selectedFormatId}
            ref={videoRef}
            src={streamUrl}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-black"
            onLoadedMetadata={(event) => {
              event.currentTarget.playbackRate = playbackRate;
            }}
            onPlay={() => {
              if (!suppressRef.current) send("play");
            }}
            onPause={() => {
              if (!suppressRef.current) send("pause");
            }}
            onSeeked={() => {
              if (!suppressRef.current) send("seek");
            }}
          />
          <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold backdrop-blur">
            <span
              className="live-dot"
              data-state={connected ? "ok" : "warn"}
            />
            <span className="text-white/90">
              {connected ? strings.connected : strings.reconnecting}
            </span>
          </div>
        </div>

        <div className="surface flex flex-wrap items-center gap-3 rounded-3xl p-3 sm:gap-4 sm:p-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="md"
              onClick={() => videoRef.current?.play()}
            >
              <PlayGlyph />
              <span className="hidden sm:inline">{strings.play}</span>
            </Button>
            <Button
              type="button"
              size="md"
              variant="secondary"
              onClick={() => videoRef.current?.pause()}
            >
              <PauseGlyph />
              <span className="hidden sm:inline">{strings.pause}</span>
            </Button>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3 sm:gap-4">
            <ControlField label={strings.quality}>
              <select
                className="h-9 rounded-lg border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg-deep)_75%,transparent)] px-2.5 text-sm text-[var(--color-fg)] outline-none transition focus:border-[var(--color-accent)]"
                value={selectedFormatId}
                onChange={(event) => changeQuality(event.target.value)}
                disabled={formats.length === 0}
              >
                {formats.length === 0 ? (
                  <option value="">—</option>
                ) : (
                  formats.map((format) => (
                    <option key={format.formatId} value={format.formatId}>
                      {format.label}
                    </option>
                  ))
                )}
              </select>
            </ControlField>

            <ControlField
              label={`${strings.speed} · ${playbackRate.toFixed(2)}×`}
            >
              <input
                type="range"
                min={SPEED_MIN}
                max={SPEED_MAX}
                step={SPEED_STEP}
                value={playbackRate}
                onChange={(event) => changeSpeed(event.target.value)}
                className="h-9 w-36 cursor-pointer accent-[var(--color-accent)]"
              />
            </ControlField>
          </div>

          <div className="basis-full text-xs text-[var(--color-subtle)]">
            <span className="eyebrow inline-block">{strings.stateSync}</span>{" "}
            <Pill tone={state.isPlaying ? "mint" : "neutral"} className="ml-1">
              {state.isPlaying ? strings.playing : strings.paused}
            </Pill>
            <span className="ml-2 font-mono text-[var(--color-muted)]">
              {Math.round(state.currentTime)}s
            </span>
          </div>
        </div>
      </div>

      <aside className="surface flex h-full flex-col gap-3 rounded-3xl p-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold tracking-tight">
              {strings.chatTitle}
            </h2>
            <span className="eyebrow">{currentUser.name}</span>
          </div>
          <p className="truncate text-xs text-[var(--color-subtle)]">
            {strings.signedInAs}
          </p>
        </div>

        <InviteRow
          label={strings.webInvite}
          href={invites.web}
          copyLabel={strings.copyLink}
          copiedLabel={strings.linkCopied}
        />
        {invites.telegram && (
          <InviteRow
            label={strings.telegramInvite}
            href={invites.telegram}
            copyLabel={strings.copyLink}
            copiedLabel={strings.linkCopied}
            telegram
          />
        )}

        <div className="scroll-soft -mx-1 flex max-h-[420px] min-h-[180px] flex-1 flex-col gap-2 overflow-y-auto px-1 py-1">
          {messages.length === 0 ? (
            <div className="grid flex-1 place-items-center rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-xs text-[var(--color-subtle)]">
              {strings.chatEmpty}
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface-2)_70%,transparent)] px-3 py-2 text-sm"
              >
                <div className="mb-0.5 flex items-baseline justify-between gap-2">
                  <strong className="truncate text-[13px] font-semibold text-[var(--color-fg)]">
                    {message.name}
                  </strong>
                  <time className="shrink-0 text-[11px] text-[var(--color-subtle)]">
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
                <p className="break-words text-[var(--color-fg)]/90">
                  {message.text}
                </p>
              </article>
            ))
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {EMOJI_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={emoji}
              className="grid h-8 w-8 place-items-center rounded-xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface-2)_55%,transparent)] text-base transition hover:scale-105 hover:border-[var(--color-accent)] active:scale-95"
              onClick={() => addEmoji(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>

        <form onSubmit={sendChat} className="flex items-center gap-2">
          <input
            value={draft}
            maxLength={280}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={strings.chatPlaceholder}
            className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-bg-deep)_75%,transparent)] px-3 text-sm outline-none transition focus:border-[var(--color-accent)] focus:bg-[color-mix(in_oklab,var(--color-bg-deep)_88%,transparent)]"
            aria-label={strings.chatPlaceholder}
          />
          <Button
            type="submit"
            size="md"
            disabled={!draft.trim() || !connected}
          >
            {strings.chatSend}
          </Button>
        </form>
      </aside>
    </div>
  );
}

function ControlField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="eyebrow whitespace-nowrap">{label}</span>
      {children}
    </label>
  );
}

function InviteRow({
  label,
  href,
  copyLabel,
  copiedLabel,
  telegram,
}: {
  label: string;
  href: string;
  copyLabel: string;
  copiedLabel: string;
  telegram?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface-2)_55%,transparent)] px-3 py-2",
      )}
    >
      <span
        aria-hidden
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--color-accent)_18%,transparent)] text-[var(--color-accent)]"
      >
        {telegram ? <TelegramGlyph /> : <LinkGlyph />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-subtle)]">
          {label}
        </span>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="truncate text-xs text-[var(--color-fg)] underline-offset-4 hover:underline"
        >
          {href}
        </a>
      </div>
      <button
        type="button"
        className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-fg)]"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(href);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
          } catch {
            // noop — fallback is the link itself
          }
        }}
      >
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}

function PlayGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5">
      <path fill="currentColor" d="M4 2.5v11l10-5.5z" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5">
      <path fill="currentColor" d="M3 2h4v12H3zM9 2h4v12H9z" />
    </svg>
  );
}

function LinkGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M10.5 14.5l-3 3a3 3 0 01-4.243-4.243l4.243-4.243a3 3 0 014.243 0M13.5 9.5l3-3a3 3 0 014.243 4.243l-4.243 4.243a3 3 0 01-4.243 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TelegramGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="currentColor"
        d="M21.94 4.27 18.7 19.94c-.24 1.06-.86 1.31-1.75.82l-4.83-3.56-2.33 2.25c-.26.26-.47.47-.96.47l.34-4.88L17.94 6.5c.39-.34-.08-.54-.6-.2L7.42 12.7l-4.81-1.5c-1.04-.32-1.06-1.04.22-1.55l18.81-7.25c.87-.32 1.63.2 1.3 1.87z"
      />
    </svg>
  );
}

function clampPlaybackRate(rate: number): number {
  if (!Number.isFinite(rate)) return 1;
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, rate));
}
