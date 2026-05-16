"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export interface CreateRoomFormStrings {
  placeholder: string;
  submit: string;
  loading: string;
  invalid: string;
  subscriptionRequired: string;
}

export function CreateRoomForm({ strings }: { strings?: CreateRoomFormStrings } = {}) {
  const s = strings ?? {
    placeholder: "Paste YouTube / video URL",
    submit: "Create room",
    loading: "Preparing…",
    invalid: "Could not create room.",
    subscriptionRequired: "Subscribe to the required channels first: {channels}. Then press “Create room” again.",
  };
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as {
        url?: string;
        error?: string;
        missing?: Array<{ chatId: string; title: string; inviteLink?: string }>;
      };
      if (!res.ok || !data.url) {
        if (data.error === "subscription_required" && data.missing?.length) {
          const channels = data.missing
            .map((m) => m.title || m.chatId)
            .join(", ");
          setError(s.subscriptionRequired.replace("{channels}", channels));
        } else {
          setError(data.error ?? s.invalid);
        }
        return;
      }
      router.push(data.url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="surface mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center sm:p-2"
    >
      <div className="relative flex-1">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-subtle)]"
        >
          <path
            d="M10.5 14.5l-3 3a3 3 0 01-4.243-4.243l4.243-4.243a3 3 0 014.243 0M13.5 9.5l3-3a3 3 0 014.243 4.243l-4.243 4.243a3 3 0 01-4.243 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          className="h-12 w-full rounded-xl border border-transparent bg-transparent px-4 pl-10 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-subtle)] outline-none transition focus:border-[var(--color-accent)] focus:bg-[color-mix(in_oklab,var(--color-bg-deep)_70%,transparent)]"
          placeholder={s.placeholder}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          disabled={loading}
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>
      <Button
        size="lg"
        type="submit"
        disabled={loading || !url.trim()}
        className="h-12 sm:px-7"
      >
        {loading ? s.loading : s.submit}
      </Button>
      {error && (
        <p className="basis-full px-2 pb-1 text-sm text-[color-mix(in_oklab,var(--color-danger)_55%,white)]">
          {error}
        </p>
      )}
    </form>
  );
}
