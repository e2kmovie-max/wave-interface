import type { NextRequest } from "next/server";
import { getEnv } from "@/lib/wave-interface";

/**
 * Build an absolute URL anchored at the *public* origin of the deployment.
 *
 * We deliberately do NOT use `req.url` as the base, because the custom
 * Node server in `src/server.ts` boots Next.js with `hostname=0.0.0.0`,
 * and Next.js bakes that bind address into `req.url` regardless of the
 * real `Host` header. That makes naive `new URL(path, req.url)`
 * redirects emit `Location: https://0.0.0.0:3000/…`, which the user's
 * browser cannot reach when the app sits behind nginx — breaking
 * Google OAuth login (and every other auth-related redirect).
 *
 * Resolution order:
 *   1. `X-Forwarded-Host` (+ optional `X-Forwarded-Proto`) when present
 *      — works behind any reverse proxy that forwards these headers,
 *      including the nginx config shipped under `deploy/nginx`.
 *   2. `PUBLIC_WEB_URL` from the validated env — the canonical public
 *      origin configured by the operator.
 */
export function publicUrl(path: string, req: NextRequest): URL {
  const fwdHost = req.headers.get("x-forwarded-host");
  if (fwdHost) {
    const fwdProto = req.headers.get("x-forwarded-proto") ?? "https";
    return new URL(path, `${fwdProto}://${fwdHost}`);
  }
  return new URL(path, getEnv().PUBLIC_WEB_URL);
}
