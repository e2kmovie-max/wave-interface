"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface TelegramWebApp {
  initData: string;
  initDataUnsafe?: { user?: { id: number; first_name?: string } };
  ready(): void;
  expand(): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

type Status =
  | { state: "idle" }
  | { state: "verifying" }
  | { state: "ok"; userId: string }
  | { state: "error"; message: string };

export interface MiniAppAuthStrings {
  idle: string;
  verifying: string;
  ready: string;
  linkHint: string;
  retry: string;
  notInTelegram: string;
}

export function MiniAppAuth({ strings }: { strings: MiniAppAuthStrings }) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [link, setLink] = useState(false);

  const verify = useCallback(async (initData: string, asLink: boolean) => {
    setStatus({ state: "verifying" });
    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData, link: asLink }),
      });
      const data = (await res.json()) as { ok?: boolean; userId?: string; error?: string };
      if (!res.ok || !data.ok || !data.userId) {
        setStatus({ state: "error", message: data.error ?? `HTTP ${res.status}` });
        return;
      }
      setStatus({ state: "ok", userId: data.userId });
    } catch (e) {
      setStatus({ state: "error", message: String(e) });
    }
  }, []);

  useEffect(() => {
    const wa = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
    if (!wa) return;
    wa.ready();
    wa.expand();
    if (wa.initData) {
      void verify(wa.initData, false);
    }
  }, [verify]);

  const dotTone =
    status.state === "ok"
      ? "var(--color-mint)"
      : status.state === "error"
      ? "var(--color-danger)"
      : status.state === "verifying"
      ? "var(--color-accent)"
      : "var(--color-subtle)";

  return (
    <div className="surface flex w-full flex-col gap-4 rounded-3xl p-5">
      <div className="flex items-center justify-center gap-2 text-sm">
        <span
          aria-hidden
          className="h-2.5 w-2.5 rounded-full"
          style={{
            background: dotTone,
            boxShadow: `0 0 0 4px color-mix(in oklab, ${dotTone} 25%, transparent)`,
          }}
        />
        <span className="text-[var(--color-muted)]">
          {status.state === "idle" && strings.idle}
          {status.state === "verifying" && strings.verifying}
          {status.state === "ok" && strings.ready}
          {status.state === "error" && status.message}
        </span>
      </div>

      <label className="flex items-start gap-2 rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface-2)_60%,transparent)] p-3 text-left text-xs text-[var(--color-muted)]">
        <input
          type="checkbox"
          checked={link}
          onChange={(e) => setLink(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
        />
        <span>{strings.linkHint}</span>
      </label>

      <Button
        variant="secondary"
        size="md"
        className="w-full"
        onClick={() => {
          const wa = window.Telegram?.WebApp;
          if (wa?.initData) void verify(wa.initData, link);
          else setStatus({ state: "error", message: strings.notInTelegram });
        }}
      >
        {strings.retry}
      </Button>
    </div>
  );
}
