import { NextRequest, NextResponse } from "next/server";
import { isGoogleOAuthConfigured, verifyTgLinkToken } from "@/lib/wave-interface";
import { buildGoogleAuthUrl, type GoogleAuthState } from "@/lib/google-oauth";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.json(
      {
        error: "google_oauth_not_configured",
        message:
          "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the environment to enable Google sign-in.",
      },
      { status: 503 },
    );
  }
  const next = req.nextUrl.searchParams.get("next") ?? "/";
  const link = req.nextUrl.searchParams.get("link") === "1";
  const tgLink = req.nextUrl.searchParams.get("tgLink");

  const state: GoogleAuthState = { next };

  if (tgLink) {
    // /tg-auth deeplink flow: re-verify the signed token before propagating
    // it through OAuth state so we fail fast if it expired in the meantime.
    if (!verifyTgLinkToken(tgLink)) {
      return NextResponse.redirect(
        new URL("/tg-auth/error?reason=expired", req.url),
      );
    }
    state.tgLink = tgLink;
  } else if (link) {
    const session = await readSession();
    if (session) state.linkUid = session.uid;
  }

  return NextResponse.redirect(buildGoogleAuthUrl(state));
}
