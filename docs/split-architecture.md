# Wave physical split — Interface

This repository is the Interface boundary of Wave.

## Owns

- Next.js web UI and route handlers in `apps/web`.
- Telegram bot and Mini App entry in `apps/bot`.
- Google OAuth, Telegram Mini App verification, session cookies, language selection, and account linking.

## Depends on

- Player contracts through `apps/*/src/lib/clients/player.ts`.
- Social contracts through `apps/*/src/lib/clients/social.ts`.

During the transition these client adapters re-export the local sibling `../wave-player/packages/shared` implementation so all split repos can be verified together before APIs/packages are published. Replace those adapters with real HTTP clients once player/social services are deployed.

## Must not own

- yt-dlp/ffmpeg execution or instance health logic.
- Room/chat persistence internals beyond interface-level route orchestration.
- YouTube cookie storage implementation details.
