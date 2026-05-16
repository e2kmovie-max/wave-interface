# wave-interface

Wave interface service: Next.js web UI, Google/Telegram auth, Telegram Mini App entrypoint, and grammY bot.

## Contents

- `apps/web` — Next.js 15 + React 19 + Tailwind UI, auth routes, room pages, admin screens, stream proxy routes, WebSocket sync server.
- `apps/bot` — grammY bot, OP-gate flows, deep-link room invites, bot admin panels.
- `apps/web/src/lib/wave-interface` and `apps/bot/src/lib/wave-interface` — local interface/auth helpers.
- `apps/*/src/lib/clients/player.ts` — player-domain client adapter.
- `apps/*/src/lib/clients/social.ts` — social-domain client adapter.

The client adapters currently point at the local sibling `../wave-player/packages/shared` source so this repo can be verified before the package/API publishing step. Replace those adapters with HTTP clients or versioned packages when the service contracts are deployed.

## Local development

```bash
bun install
cp .env.example .env
bun run db:up
bun run dev:web
bun run dev:bot
```

Optional local player instance lives in `../wave-player/apps/instance`.

## Checks

```bash
bun run typecheck
bun run build
bun run lint
```

## Domain boundary

This repository owns user-facing interface concerns only. Player internals and social internals must stay behind the `apps/*/src/lib/clients/*` adapters; do not import their implementation files directly from app code.

## Telegram → Google account linking (`/link`)

The bot can hand the user a one-shot, server-signed deeplink that finishes Google sign-in on the website and merges the resulting profile onto the Telegram identity. The user never has to copy a `chat_id` by hand and the link cannot be spoofed by changing query params.

Flow:

1. In the chat, the user runs `/link`. The bot generates an HMAC-signed token containing the Telegram user id, chat id, display fields, and language, then replies with an inline button pointing at `${PUBLIC_WEB_URL}/tg-auth?token=...`.
2. The website verifies the token, greets the user by name, and offers a "Continue with Google" button that hits `/api/auth/google/start?tgLink=<token>&next=/tg-auth/done?linked=google`.
3. The Google OAuth callback re-verifies the token, links the Google identity onto the user matching the embedded `tgUserId` (creating it on the fly if needed), writes the web session, and fires a confirmation message back into the Telegram chat via the Bot API.
4. The user lands on `/tg-auth/done` and is offered "Back to bot" + "Open Account".

Token lifetime is 10 minutes. Invalid or expired tokens land on `/tg-auth/error?reason=...`. The token is signed with `APP_SECRET` so the Telegram identity in the deeplink can be trusted by the web side without any extra round-trip.
