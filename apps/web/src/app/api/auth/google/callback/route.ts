import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import {
  connectMongo,
  isGoogleOAuthConfigured,
  sendBotMessage,
  t,
  User,
  verifyTgLinkToken,
  type TgLinkTokenData,
} from "@/lib/wave-interface";
import { exchangeCodeForProfile, parseGoogleAuthState } from "@/lib/google-oauth";
import { writeSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google_disabled", req.url));
  }

  const code = req.nextUrl.searchParams.get("code");
  const stateToken = req.nextUrl.searchParams.get("state") ?? "";
  const errorParam = req.nextUrl.searchParams.get("error");
  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorParam)}`, req.url),
    );
  }
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", req.url));
  }

  const state = parseGoogleAuthState(stateToken);
  if (!state) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", req.url));
  }

  let profile;
  try {
    profile = await exchangeCodeForProfile(code);
  } catch (e) {
    console.error("[google callback] exchange failed", e);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }

  await connectMongo();

  const googleUpdate = {
    googleId: profile.sub,
    googleEmail: profile.email,
    googleName: profile.name,
    googleAvatar: profile.picture,
    isGuest: false,
  };

  // ------------------------------------------------------------------
  // 1) /tg-auth deeplink flow: link Google onto the Telegram user from the
  //    signed token. The user does not have to already be signed in.
  // ------------------------------------------------------------------
  if (state.tgLink) {
    const tgData = verifyTgLinkToken(state.tgLink);
    if (!tgData) {
      return NextResponse.redirect(
        new URL("/tg-auth/error?reason=expired", req.url),
      );
    }

    const existingByGoogle = await User.findOne({ googleId: profile.sub });
    const existingByTg = await User.findOne({ telegramId: tgData.tgUserId });
    if (
      existingByGoogle &&
      existingByTg &&
      String(existingByGoogle._id) !== String(existingByTg._id)
    ) {
      return NextResponse.redirect(
        new URL("/tg-auth/error?reason=already_linked", req.url),
      );
    }
    if (existingByGoogle && !existingByTg) {
      const updated = await User.findByIdAndUpdate(
        existingByGoogle._id,
        {
          $set: {
            telegramId: tgData.tgUserId,
            telegramUsername: tgData.username,
            telegramFirstName: tgData.firstName,
            telegramLastName: tgData.lastName,
            telegramPhotoUrl: tgData.photoUrl,
          },
        },
        { new: true },
      );
      await finalizeTgLinkSuccess(String(updated!._id), tgData, profile.email);
      return NextResponse.redirect(
        new URL("/tg-auth/done?linked=google", req.url),
      );
    }

    const merged = await User.findOneAndUpdate(
      { telegramId: tgData.tgUserId },
      {
        $set: {
          ...googleUpdate,
          telegramId: tgData.tgUserId,
          telegramUsername: tgData.username,
          telegramFirstName: tgData.firstName,
          telegramLastName: tgData.lastName,
          telegramPhotoUrl: tgData.photoUrl,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await finalizeTgLinkSuccess(String(merged._id), tgData, profile.email);
    return NextResponse.redirect(new URL("/tg-auth/done?linked=google", req.url));
  }

  // ------------------------------------------------------------------
  // 2) Classic flows: link Google onto a logged-in user, or upsert by Google id.
  // ------------------------------------------------------------------
  let userId: string;
  if (state.linkUid && Types.ObjectId.isValid(state.linkUid)) {
    const existingByGoogle = await User.findOne({ googleId: profile.sub });
    if (existingByGoogle && String(existingByGoogle._id) !== state.linkUid) {
      return NextResponse.redirect(
        new URL("/account?error=google_already_linked", req.url),
      );
    }
    const updated = await User.findByIdAndUpdate(state.linkUid, googleUpdate, {
      new: true,
    });
    if (!updated) {
      return NextResponse.redirect(new URL("/login?error=session_expired", req.url));
    }
    userId = String(updated._id);
  } else {
    const user = await User.findOneAndUpdate(
      { googleId: profile.sub },
      { $set: googleUpdate },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    userId = String(user._id);
  }

  await writeSession({ uid: userId });
  const next = state.next && state.next.startsWith("/") ? state.next : "/";
  return NextResponse.redirect(new URL(next, req.url));
}

/**
 * After a successful /tg-auth linking, write the web session AND best-effort
 * push a confirmation back into the Telegram chat. Errors from the Bot API
 * are swallowed — we still want the user to land on the success page.
 */
async function finalizeTgLinkSuccess(
  userId: string,
  tgData: TgLinkTokenData,
  googleEmail: string | undefined,
): Promise<void> {
  await writeSession({ uid: userId });
  try {
    const lang = tgData.lang ?? "en";
    await sendBotMessage({
      chatId: tgData.chatId,
      text: t(lang, "web.tgauth.notify_success", {
        email: googleEmail ?? "—",
      }),
    });
  } catch (err) {
    console.warn("[tg-auth] bot notify failed", err);
  }
}
