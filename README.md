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
