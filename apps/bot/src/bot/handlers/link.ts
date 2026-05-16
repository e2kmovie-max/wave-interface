import { Composer, InlineKeyboard } from "grammy";
import {
  buildTgAuthDeeplink,
  getEnv,
  isGoogleOAuthConfigured,
  type TgLinkTokenData,
} from "../../lib/wave-interface";
import type { WaveContext } from "../context";

/**
 * `/link` — emits a one-shot, server-signed deeplink that lets the user finish
 * Google sign-in on the web and link the resulting profile to *this* Telegram
 * account. The chat id is embedded in the signed token so the web side knows
 * exactly where to send the confirmation back.
 */
export const linkHandler = new Composer<WaveContext>();

linkHandler.command("link", async (ctx) => {
  const tgUser = ctx.from;
  if (!tgUser || !ctx.chat) return;

  const env = getEnv();
  if (!isGoogleOAuthConfigured(env) || !env.PUBLIC_WEB_URL) {
    await ctx.reply(ctx.t("bot.link.disabled"));
    return;
  }

  const tokenData: TgLinkTokenData = {
    tgUserId: tgUser.id,
    chatId: ctx.chat.id,
    firstName: tgUser.first_name,
    lastName: tgUser.last_name,
    username: tgUser.username,
    lang: ctx.lang,
  };

  const url = buildTgAuthDeeplink(tokenData, {
    publicWebUrl: env.PUBLIC_WEB_URL,
  });

  const keyboard = new InlineKeyboard().url(ctx.t("bot.link.button"), url);
  await ctx.reply(ctx.t("bot.link.intro"), {
    reply_markup: keyboard,
    link_preview_options: { is_disabled: true },
  });
});
